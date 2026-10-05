#!/usr/bin/env bash
# A workflow retry reuses the immutable image for the same commit.
set -euo pipefail
: "${ECR_REGISTRY:?}" "${ECR_REPOSITORY:?}" "${RELEASE_SHA:?}"
error_file=$(mktemp)
trap 'rm -f "$error_file"' EXIT
if aws ecr describe-images --repository-name "$ECR_REPOSITORY" \
    --image-ids "imageTag=$RELEASE_SHA" >/dev/null 2>"$error_file"; then
    echo "Reusing image for $RELEASE_SHA"
    exit 0
fi
if ! grep -q '(ImageNotFoundException)' "$error_file"; then
    cat "$error_file" >&2
    exit 1
fi
image="$ECR_REGISTRY/$ECR_REPOSITORY:$RELEASE_SHA"
docker build -t "$image" ./backend
docker push "$image"
