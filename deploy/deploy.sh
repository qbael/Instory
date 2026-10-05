#!/usr/bin/env bash
# Run as root through SSM. AWS access comes from the instance role, never SSH keys.
set +x
set -Eeuo pipefail
umask 077

: "${AWS_REGION:?}" "${ECR_REGISTRY:?}" "${ECR_REPOSITORY:?}" "${RELEASE_SHA:?}"
: "${ARTIFACT_BUCKET:?}" "${ARTIFACT_KEY:?}" "${SECRET_ID:?}"
[[ "$RELEASE_SHA" =~ ^[a-f0-9]{40,64}$ ]] || { echo 'Invalid release SHA' >&2; exit 1; }
[[ "$ECR_REGISTRY" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com$ ]] || exit 1
[[ "$ECR_REPOSITORY" =~ ^[a-z0-9][a-z0-9_./-]*$ ]] || exit 1

APP_ROOT=${APP_ROOT:-/opt/instory}
NGINX_ROOT=${NGINX_ROOT:-/etc/nginx}
SITE_URL=${SITE_URL:-http://127.0.0.1}
HEALTH_ATTEMPTS=${HEALTH_ATTEMPTS:-90}
HEALTH_INTERVAL=${HEALTH_INTERVAL:-2}
[[ "$APP_ROOT" =~ ^/[a-zA-Z0-9_./-]+$ ]] || exit 1
[[ "$HEALTH_ATTEMPTS" =~ ^[1-9][0-9]*$ && "$HEALTH_INTERVAL" =~ ^[0-9]+$ ]] || exit 1
export API_IMAGE="$ECR_REGISTRY/$ECR_REPOSITORY:$RELEASE_SHA"
export AWS_DEFAULT_REGION="$AWS_REGION" AWS_PAGER=""

install -d -m 755 "$APP_ROOT" "$APP_ROOT/releases"
exec 9>"$APP_ROOT/.deploy.lock"
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }
release=$(mktemp -d "$APP_ROOT/releases/$RELEASE_SHA.XXXXXXXX")
chmod 755 "$release"
work=$(mktemp -d)
export DOCKER_CONFIG="$work/docker"
previous=""
[[ ! -e "$APP_ROOT/current" || -L "$APP_ROOT/current" ]] || { echo 'current must be a release symlink' >&2; exit 1; }
[[ ! -L "$APP_ROOT/current" ]] || previous=$(readlink -f "$APP_ROOT/current")
site="$NGINX_ROOT/sites-available/instory"
site_link="$NGINX_ROOT/sites-enabled/instory"
default_link="$NGINX_ROOT/sites-enabled/default"
api_changed=0
nginx_changed=0
had_site=0
[[ ! -f "$site" ]] || { cp -a "$site" "$work/nginx.before"; had_site=1; }

compose() {
    docker compose --env-file /dev/null -p instory \
        -f "$1/deploy/docker-compose.prod.yml" -f "$1/runtime.json" "${@:2}"
}

switch_static() {
    ln -s "$1" "$APP_ROOT/.current.$$"
    mv -Tf "$APP_ROOT/.current.$$" "$APP_ROOT/current"
}

rollback() {
    local status=$?
    trap - ERR
    set +e
    echo 'Deployment failed; restoring the previous release' >&2
    if (( api_changed )); then
        if [[ -n "$previous" && -f "$previous/runtime.json" ]]; then
            compose "$previous" up -d --force-recreate --remove-orphans
            switch_static "$previous"
        else
            compose "$release" down
            rm -f "$APP_ROOT/current"
        fi
    fi
    if (( nginx_changed )); then
        if (( had_site )); then
            cp -a "$work/nginx.before" "$site"
        else
            rm -f "$site" "$site_link"
        fi
        [[ ! -e "$work/nginx.default" && ! -L "$work/nginx.default" ]] || mv "$work/nginx.default" "$default_link"
        nginx -t && systemctl reload nginx
    fi
    rm -rf "$release"
    exit "$status"
}
trap rollback ERR
trap 'rm -rf "$work"; rm -f "$APP_ROOT/.current.$$"' EXIT

echo "Downloading release $RELEASE_SHA"
aws s3 cp "s3://$ARTIFACT_BUCKET/$ARTIFACT_KEY" "$work/release.tar.gz" --no-progress
python3 - "$work/release.tar.gz" "$release" <<'PY'
import pathlib, sys, tarfile
with tarfile.open(sys.argv[1], "r:gz") as archive:
    for member in archive.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or not (member.isfile() or member.isdir()):
            raise SystemExit("Unsafe deployment archive")
        if path.parts and path.parts[0] not in ("frontend", "deploy"):
            raise SystemExit("Unexpected deployment archive layout")
    archive.extractall(sys.argv[2], filter="data")
PY
test -s "$release/frontend/index.html"
test -f "$release/deploy/docker-compose.prod.yml"
test -f "$release/deploy/nginx.conf"
find "$release/frontend" -type d -exec chmod 755 {} +
find "$release/frontend" -type f -exec chmod 644 {} +
printf '%s\n' "$RELEASE_SHA" > "$release/frontend/release.txt"
chmod 644 "$release/frontend/release.txt"

aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text \
    | python3 "$release/deploy/render-secrets.py" "$API_IMAGE" > "$release/runtime.json"
chmod 600 "$release/runtime.json"
compose "$release" config --quiet
aws ecr get-login-password | docker login --username AWS --password-stdin "$ECR_REGISTRY"
compose "$release" pull --quiet api

install -d -m 755 "$NGINX_ROOT/sites-available" "$NGINX_ROOT/sites-enabled"
sed "s#__APP_ROOT__#$APP_ROOT#g" "$release/deploy/nginx.conf" > "$work/nginx.new"
nginx_changed=1
install -m 644 "$work/nginx.new" "$site"
ln -sfn "$site" "$site_link"
[[ ! -e "$default_link" && ! -L "$default_link" ]] || mv "$default_link" "$work/nginx.default"
nginx -t
systemctl enable --now nginx
systemctl reload nginx

api_changed=1
compose "$release" up -d --force-recreate --remove-orphans
ready=0
for (( attempt=0; attempt<HEALTH_ATTEMPTS; attempt++ )); do
    if curl --fail --silent --max-time 5 http://127.0.0.1:8080/health >/dev/null; then
        ready=1
        break
    fi
    sleep "$HEALTH_INTERVAL"
done
(( ready ))
switch_static "$release"
# CloudFront can briefly retain an origin error while the API is restarting.
ready=0
for (( attempt=0; attempt<HEALTH_ATTEMPTS; attempt++ )); do
    if curl --fail --silent --location --max-time 10 "$SITE_URL/health" >/dev/null \
        && [[ "$(curl --fail --silent --location --max-time 10 "$SITE_URL/release.txt")" == "$RELEASE_SHA" ]]; then
        ready=1
        break
    fi
    sleep "$HEALTH_INTERVAL"
done
(( ready ))
[[ -z "$previous" || "$previous" == "$release" ]] || { ln -sfn "$previous" "$APP_ROOT/previous"; }
find "$APP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d \
    ! -path "$release" ! -path "$previous" -exec rm -rf {} +
# ponytail: one EC2 restart has brief downtime; use a load balancer when zero downtime is required.
echo "Deployed $RELEASE_SHA"
