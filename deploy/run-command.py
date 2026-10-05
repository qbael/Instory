#!/usr/bin/env python3
"""Deploy the CI artifact on EC2 through its instance role and SSM."""
import json
import os
import shlex
import subprocess
import time


def aws(*args):
    result = subprocess.run(["aws", *args, "--region", os.environ["AWS_REGION"],
                             "--output", "json"], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


if __name__ == "__main__":
    names = ["AWS_REGION", "ECR_REGISTRY", "ECR_REPOSITORY", "RELEASE_SHA",
             "ARTIFACT_BUCKET", "ARTIFACT_KEY", "SECRET_ID", "SITE_URL",
             "DATA_PROTECTION_VOLUME"]
    config = {name: os.environ[name] for name in names}
    if any(not value for value in config.values()):
        raise SystemExit("Missing deployment configuration")
    script = "set -e\numask 077\n" + "\n".join(
        "export " + name + "=" + shlex.quote(value) for name, value in config.items())
    script += '\nwork=$(mktemp -d)\ntrap \'rm -rf "$work"\' EXIT\n'
    script += 'aws s3 cp "s3://$ARTIFACT_BUCKET/$ARTIFACT_KEY" "$work/release.tar.gz" --no-progress\n'
    script += 'tar -xzf "$work/release.tar.gz" -C "$work" deploy/deploy.sh\n'
    script += 'bash "$work/deploy/deploy.sh"\n'
    result = aws("ssm", "send-command", "--instance-ids", os.environ["INSTANCE_ID"],
                 "--document-name", "AWS-RunShellScript", "--parameters",
                 json.dumps({"commands": ["bash -c " + shlex.quote(script)],
                             "executionTimeout": ["1200"]}))
    command = result["Command"]["CommandId"]
    print("Deployment command:", command, flush=True)
    deadline = time.monotonic() + 1200
    while time.monotonic() < deadline:
        time.sleep(5)
        try:
            status = aws("ssm", "get-command-invocation", "--command-id", command,
                         "--instance-id", os.environ["INSTANCE_ID"])
        except RuntimeError as error:
            if "InvocationDoesNotExist" in str(error):
                continue
            raise
        if status["Status"] in ("Pending", "InProgress", "Delayed"):
            continue
        print(status.get("StandardOutputContent", ""))
        if status["Status"] != "Success" or status.get("ResponseCode") != 0:
            print(status.get("StandardErrorContent", ""))
            raise SystemExit("Deployment failed: " + status["Status"])
        break
    else:
        raise SystemExit("Deployment timed out; inspect the SSM command before retrying")
