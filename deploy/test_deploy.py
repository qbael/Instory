#!/usr/bin/env python3
"""No AWS calls: exercise secret interpolation, successful deploy, and failed deploy rollback."""

import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("render_secrets", HERE / "render-secrets.py")
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
secret = {
    "ConnectionStrings": {"Instory": "Host=db;Password=quote'\"$HOME\\with\nnewline"},
    "JwtSettings__SecretKey": "${NOT_AN_ENVIRONMENT_VARIABLE}",
    "Email": {"Port": 587, "UseSsl": True},
}
rendered = renderer.environment(secret)
assert rendered["ConnectionStrings__Instory"] == secret["ConnectionStrings"]["Instory"].replace("$", "$$")
assert rendered["Email__Port"] == "587" and rendered["Email__UseSsl"] == "true"
for extra in ({"ConnectionStrings__Instory": "collision"}, {"Email": {"Password": None}}, {"ASPNETCORE_ENVIRONMENT": "Development"}):
    try:
        renderer.environment(secret | extra)
        raise AssertionError("Unsafe secret accepted")
    except ValueError:
        pass

with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    payload = root / "payload"
    (payload / "frontend").mkdir(parents=True)
    (payload / "frontend/index.html").write_text("<html>Instory</html>")
    archive = root / "release.tar.gz"
    with tarfile.open(archive, "w:gz") as tar:
        tar.add(payload / "frontend", arcname="frontend")
        tar.add(HERE, arcname="deploy", filter=lambda member: None if "__pycache__" in member.name else member)
    bin_dir = root / "bin"
    bin_dir.mkdir()
    # The same stub runs under each command name; the deploy script keeps all file operations real.
    stub = bin_dir / "stub"
    stub.write_text('''#!/usr/bin/env python3
import json, os, pathlib, shutil, sys
name = pathlib.Path(sys.argv[0]).name
args = sys.argv[1:]
root = pathlib.Path(os.environ["CHECK_ROOT"])
if name == "aws":
    if args[:2] == ["s3", "cp"]:
        shutil.copyfile(root / "release.tar.gz", args[3])
    elif args[0] == "secretsmanager":
        print((root / "secret.json").read_text())
    elif args[0] == "ecr":
        if args[1] == "describe-images":
            status = os.environ["CHECK_ECR_STATUS"]
            if status != "exists":
                print("An error occurred (" + ("ImageNotFoundException" if status == "missing" else "AccessDeniedException") + ")", file=sys.stderr)
                sys.exit(254)
        else:
            print("dummy-ecr-password")
elif name == "docker":
    if args[0] == "login":
        sys.stdin.read()
    elif "up" in args:
        manifests = [args[i + 1] for i, item in enumerate(args[:-1]) if item == "-f"]
        config = json.loads(pathlib.Path(manifests[-1]).read_text())
        (root / "running-image").write_text(config["services"]["api"]["image"])
    elif "down" in args:
        (root / "running-image").unlink(missing_ok=True)
    elif args[0] in ("build", "push"):
        with (root / "image-commands").open("a") as log:
            log.write(args[0] + "\\n")
elif name == "curl":
    if os.environ.get("FAIL_HEALTH") == "1":
        sys.exit(22)
    if args[-1].endswith("release.txt"):
        if os.environ.get("FAIL_MARKER") == "1":
            sys.exit(22)
        sys.stdout.write((pathlib.Path(os.environ["APP_ROOT"]) / "current/frontend/release.txt").read_text())
''')
    stub.chmod(0o755)
    for command in ("aws", "docker", "nginx", "systemctl", "curl"):
        (bin_dir / command).symlink_to(stub)
    (root / "secret.json").write_text(json.dumps(secret))
    env = os.environ | {
        "PATH": f"{bin_dir}:{os.environ['PATH']}", "CHECK_ROOT": str(root),
        "AWS_REGION": "ap-southeast-1", "ECR_REGISTRY": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com",
        "ECR_REPOSITORY": "instory/backend", "ARTIFACT_BUCKET": "artifact-test", "ARTIFACT_KEY": "release.tar.gz",
        "SECRET_ID": "instory/production", "APP_ROOT": str(root / "app"), "NGINX_ROOT": str(root / "nginx"),
        "RELEASE_SHA": "a" * 40, "HEALTH_ATTEMPTS": "1", "HEALTH_INTERVAL": "0",
    }
    success = subprocess.run(["bash", HERE / "deploy.sh"], env=env, text=True, capture_output=True)
    assert success.returncode == 0, success.stdout + success.stderr
    old_release = (root / "app/current").resolve()
    assert oct((old_release / "runtime.json").stat().st_mode & 0o777) == "0o600"
    site = root / "nginx/sites-available/instory"
    original_nginx = site.read_text() + "\n# previous deployment configuration\n"
    site.write_text(original_nginx)
    failure = subprocess.run(["bash", HERE / "deploy.sh"], env=env | {"RELEASE_SHA": "b" * 40, "FAIL_HEALTH": "1"}, text=True, capture_output=True)
    assert failure.returncode != 0
    assert (root / "app/current").resolve() == old_release
    assert (root / "running-image").read_text().endswith(":" + "a" * 40)
    assert (root / "nginx/sites-available/instory").read_text() == original_nginx
    assert len(list((root / "app/releases").iterdir())) == 1
    after_swap = subprocess.run(["bash", HERE / "deploy.sh"], env=env | {"RELEASE_SHA": "c" * 40, "FAIL_MARKER": "1"}, text=True, capture_output=True)
    assert after_swap.returncode != 0
    assert (root / "app/current").resolve() == old_release
    assert (root / "running-image").read_text().endswith(":" + "a" * 40)
    assert "${NOT_AN_ENVIRONMENT_VARIABLE}" not in success.stdout + success.stderr + failure.stdout + failure.stderr

    for status in ("exists", "missing", "denied"):
        command_log = root / "image-commands"
        command_log.unlink(missing_ok=True)
        pushed = subprocess.run(["bash", HERE / "push-image.sh"], env=env | {"CHECK_ECR_STATUS": status}, capture_output=True, text=True)
        assert (pushed.returncode == 0) == (status != "denied")
        assert command_log.exists() == (status == "missing")
        if status == "missing":
            assert command_log.read_text() == "build\npush\n"

    if shutil.which("docker"):
        compose = subprocess.run(["docker", "compose", "--env-file", "/dev/null", "-f", HERE / "docker-compose.prod.yml", "-f", old_release / "runtime.json", "config", "--format", "json"], env=os.environ | {"API_IMAGE": "example.invalid/api:" + "a" * 40}, capture_output=True, text=True, check=True)
        actual = json.loads(compose.stdout)["services"]["api"]["environment"]
        # `config` re-escapes dollars when serializing; container creation decodes them.
        assert actual["ConnectionStrings__Instory"] == rendered["ConnectionStrings__Instory"]
        assert actual["JwtSettings__SecretKey"] == rendered["JwtSettings__SecretKey"]

print("Secret rendering, successful deployment, and image/static rollback passed")
