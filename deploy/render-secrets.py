#!/usr/bin/env python3
"""Read SecretString JSON on stdin; write a Compose override without logging secrets."""

import json
import math
import re
import sys


def environment(secret):
    if not isinstance(secret, dict) or not secret:
        raise ValueError("SecretString must be a nonempty JSON object")
    result = {}
    seen = set()

    def flatten(value, key):
        if isinstance(value, dict):
            for name, child in value.items():
                if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
                    raise ValueError("Secret contains an invalid environment key")
                flatten(child, f"{key}__{name}" if key else name)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                flatten(child, f"{key}__{index}")
        else:
            if key.lower() in seen or value is None or (isinstance(value, float) and not math.isfinite(value)):
                raise ValueError("Secret contains a duplicate key or unsupported value")
            if key.upper().startswith(("ASPNETCORE_", "DOTNET_")):
                raise ValueError("Runtime settings belong in the production Compose file")
            text = str(value).lower() if isinstance(value, bool) else str(value)
            if "\x00" in text:
                raise ValueError("Environment values cannot contain NUL")
            # Compose performs interpolation even in JSON; $$ preserves a literal $.
            result[key] = text.replace("$", "$$")
            seen.add(key.lower())

    flatten(secret, "")
    for key in ("ConnectionStrings__Instory", "JwtSettings__SecretKey"):
        if not result.get(key):
            raise ValueError("Secret is missing required database or JWT configuration")
    return result


if __name__ == "__main__":
    try:
        config = {"services": {"api": {"image": sys.argv[1], "environment": environment(json.load(sys.stdin))}}}
        json.dump(config, sys.stdout)
        sys.stdout.write("\n")
    except (ValueError, IndexError):
        sys.exit("Unable to render production secrets; check the JSON keys and required settings")
