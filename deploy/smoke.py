#!/usr/bin/env python3
"""Live checks using two disposable instory_smoke_* accounts, never OTP email.

Set SITE_URL, SMOKE_EMAIL, SMOKE_PASSWORD, SECOND_EMAIL, SECOND_PASSWORD.
--register-only creates unconfirmed users; an operator must confirm them in DB.
Grant Admin to the first synthetic account for admin checks. The final manifest
identifies synthetic records/media requiring DB/S3 cleanup where APIs lack delete.
"""
import argparse
import base64
import hashlib
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid

IMAGE = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")


def multipart(fields, file_field=None):
    boundary = "instory-" + uuid.uuid4().hex
    parts = []
    for name, value in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    if file_field:
        parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; filename="smoke.gif"\r\nContent-Type: image/gif\r\n\r\n'.encode(), IMAGE, b"\r\n"]
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


class Client:
    def __init__(self, site):
        self.site = site.rstrip("/")
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))

    def request(self, method, path, data=None, fields=None, file_field=None,
                expected=(200, 201, 204), raw=False):
        headers = {"Accept": "application/json", "User-Agent": "InstorySyntheticSmoke/1"}
        body = None
        if fields is not None:
            body, headers["Content-Type"] = multipart(fields, file_field)
        elif data is not None:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(urllib.parse.urljoin(self.site + "/", path),
                                         body, headers, method=method)
        try:
            response = self.opener.open(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            result = response.read()
            if response.status not in expected:
                # Never echo response bodies, credentials or cookie headers.
                raise RuntimeError(f"{method} {urllib.parse.urlsplit(path).path}: HTTP {response.status}, expected {expected}")
        return result if raw else json.loads(result) if result else None


def check(condition, label):
    if not condition:
        raise AssertionError(label)
    print("PASS " + label, flush=True)


def rows(result):
    return result if isinstance(result, list) else result["data"]


def has_id(result, identifier):
    return any(item.get("post", item)["id"] == identifier for item in rows(result))


def username(email):
    return "instory_smoke_" + hashlib.sha256(email.lower().encode()).hexdigest()[:16]


def login(client, email, password):
    result = client.request("POST", "/api/v1/auth/login", {"usernameOrEmail": email, "password": password})
    user = client.request("GET", "/api/v1/auth/me")
    check(user["id"] == result["userId"] and user["email"].lower() == email.lower(), "cookie authentication")
    check(user["userName"].startswith("instory_smoke_"), "account is explicitly synthetic")
    cookies = {cookie.name: cookie for cookie in client.cookies}
    check({"jwt", "refreshToken"} <= cookies.keys(), "access and refresh cookies")
    for name in ("jwt", "refreshToken"):
        attrs = {key.lower(): value for key, value in cookies[name]._rest.items()}
        check(cookies[name].secure and "httponly" in attrs and attrs.get("samesite", "").lower() == "strict",
              name + " Secure/HttpOnly/SameSite=Strict")
    return user


def run(site, credentials):
    guest, first, second = Client(site), Client(site), Client(site)
    cleanup = []
    manifest = {"userIds": [], "postIds": [], "storyIds": [], "highlightIds": [],
                "chatIds": [], "messageIds": [], "mediaUrls": [], "reportIds": []}
    marker = "smoke" + uuid.uuid4().hex[:12]
    try:
        check(guest.request("GET", "/health")["status"] == "healthy", "API and database health")
        check(b'id="root"' in guest.request("GET", "/login", raw=True), "HTTPS SPA deep link")
        guest.request("GET", "/api/v1/auth/me", expected=(401,))
        a = login(first, *credentials[0])
        b = login(second, *credentials[1])
        check(a["id"] != b["id"], "two distinct synthetic accounts")
        manifest["userIds"] = [a["id"], b["id"]]

        old_refresh = next(cookie.value for cookie in first.cookies if cookie.name == "refreshToken")
        for cookie in list(first.cookies):
            if cookie.name == "jwt":
                first.cookies.clear(cookie.domain, cookie.path, cookie.name)
        first.request("GET", "/api/v1/auth/me", expected=(401,))
        first.request("POST", "/api/v1/auth/refresh")
        new_refresh = next(cookie.value for cookie in first.cookies if cookie.name == "refreshToken")
        check(first.request("GET", "/api/v1/auth/me")["id"] == a["id"] and old_refresh != new_refresh,
              "refresh cookie rotates and restores access")
        for hub in ("chat", "notifications"):
            path = f"/hubs/{hub}/negotiate?negotiateVersion=1"
            guest.request("POST", path, expected=(401,))
            negotiation = first.request("POST", path)
            check(negotiation.get("connectionToken") and any(t["transport"] == "WebSockets" for t in negotiation["availableTransports"]),
                  hub + " authenticated SignalR negotiation")

        profile = first.request("GET", "/api/v1/profile/" + urllib.parse.quote(a["userName"]))
        check(profile["id"] == a["id"], "profile by username")
        if profile.get("fullName"):
            cleanup.append((first, "PUT", "/api/v1/profile/me", {"fields": {"FullName": profile["fullName"]}}))
            updated = first.request("PUT", "/api/v1/profile/me", fields={"FullName": marker})
            check(updated["fullName"] == marker, "profile update")

        relationship = first.request("GET", f'/api/v1/profile/id/{b["id"]}')
        check(relationship.get("friendshipStatus") is None, "no pre-existing relationship is altered")
        first.request("POST", f'/api/v1/friendship/{b["id"]}/friend-request')
        cleanup.append((first, "DELETE", f'/api/v1/friendship/{b["id"]}/friend-request', {"expected": (204, 400, 404)}))
        check(second.request("GET", "/api/v1/friendship/requests"), "friend request received")
        first.request("GET", "/api/v1/friendship/sent")
        second.request("PATCH", f'/api/v1/friendship/{a["id"]}/respond', {"status": "accepted"})
        cleanup.append((first, "DELETE", f'/api/v1/friendship/{b["id"]}/friend', {"expected": (204, 404)}))
        check(has_id(first.request("GET", "/api/v1/friendship/friends"), b["id"]), "friend request accepted")

        post = first.request("POST", "/api/v1/posts", fields={"Content": marker + " #" + marker, "AllowComment": "true"}, file_field="Images")
        post_id = post["id"]
        manifest["postIds"].append(post_id)
        cleanup.append((first, "DELETE", f"/api/v1/posts/{post_id}", {"expected": (204, 404)}))
        check(post_id > 0 and post["images"], "post and S3 media upload")
        media = post["images"][0]["imageUrl"]
        manifest["mediaUrls"].append(media)
        check(media.startswith("https://") and guest.request("GET", media, raw=True) == IMAGE, "public media HTTPS download")
        first.request("PUT", f"/api/v1/posts/{post_id}", fields={"Content": marker + " edited #" + marker})
        check("edited" in first.request("GET", f"/api/v1/posts/{post_id}")["content"], "post edit persists")
        check(has_id(second.request("GET", "/api/v1/posts/feed"), post_id), "post appears in feed")
        check(has_id(first.request("GET", f'/api/v1/users/{a["id"]}/posts'), post_id), "profile posts")

        second.request("POST", f"/api/v1/posts/{post_id}/like")
        check(has_id(second.request("GET", f'/api/v1/users/{b["id"]}/liked-posts'), post_id), "post like persists")
        second.request("DELETE", f"/api/v1/posts/{post_id}/like")
        comment = second.request("POST", f"/api/v1/posts/{post_id}/comments", {"content": marker})["data"]
        cleanup.append((second, "DELETE", f'/api/v1/posts/{post_id}/comments/{comment["id"]}', {"expected": (200, 400, 404)}))
        check(has_id(first.request("GET", f"/api/v1/posts/{post_id}/comments"), comment["id"]), "comment persists")
        second.request("POST", f"/api/v1/share-post/{post_id}", {"caption": marker})
        check(has_id(second.request("GET", f'/api/v1/users/{b["id"]}/shared-posts'), post_id), "post sharing persists")
        check(has_id(second.request("GET", "/api/v1/search/posts?" + urllib.parse.urlencode({"query": marker})), post_id), "post search")
        check(has_id(first.request("GET", "/api/v1/search/users?" + urllib.parse.urlencode({"query": b["userName"]})), b["id"]), "user search")
        check(second.request("GET", "/api/v1/search/hashtags?" + urllib.parse.urlencode({"query": marker})), "hashtag search")
        first.request("GET", "/api/v1/hashtags/trending")
        check(has_id(first.request("GET", "/api/v1/posts/search?hashtag=" + marker), post_id), "posts by hashtag")

        story = first.request("POST", "/api/v1/story", fields={"Caption": marker}, file_field="File")
        story_id = story["id"]
        manifest["storyIds"].append(story_id)
        manifest["mediaUrls"].append(story["mediaUrl"])
        cleanup.append((first, "DELETE", f"/api/v1/story/{story_id}", {"expected": (204, 404)}))
        check(guest.request("GET", story["mediaUrl"], raw=True) == IMAGE, "story image upload/download")
        check(first.request("GET", f"/api/v1/story/{story_id}")["id"] == story_id, "story detail")
        check(second.request("GET", "/api/v1/story"), "friend story feed")
        second.request("POST", f"/api/v1/story/{story_id}/view")
        group = second.request("GET", f'/api/v1/story/user/{a["id"]}')
        check(any(s["id"] == story_id and s["isViewed"] for s in group["stories"]), "story view persists")
        first.request("GET", "/api/v1/story/archive")
        highlight = first.request("POST", "/api/v1/highlights", fields={"Title": marker, "CoverUrl": story["mediaUrl"]})
        highlight_id = highlight["id"]
        manifest["highlightIds"].append(highlight_id)
        manifest["mediaUrls"].append(highlight["coverUrl"])
        cleanup.append((first, "DELETE", f"/api/v1/highlights/{highlight_id}", {"expected": (204, 404)}))
        check(guest.request("GET", highlight["coverUrl"], raw=True) == IMAGE, "highlight S3 copy and download")
        added = first.request("POST", f"/api/v1/highlights/{highlight_id}/stories", {"storyId": story_id})
        check(has_id(added["stories"], story_id), "highlight contains story")
        check(has_id(second.request("GET", f'/api/v1/highlights?userId={a["id"]}'), highlight_id), "public profile highlights")
        first.request("DELETE", f"/api/v1/highlights/{highlight_id}/stories/{story_id}")

        for path, payload in ((f'/api/v1/chat/direct/{b["id"]}', None),
                              ("/api/v1/chat/group", {"name": marker, "participantIds": [b["id"]]})):
            chat = first.request("POST", path, payload)
            chat_id = chat["id"]
            manifest["chatIds"].append(chat_id)
            message = first.request("POST", "/api/v1/chat/message", {"chatId": chat_id, "content": marker})
            manifest["messageIds"].append(message["id"])
            check(has_id(second.request("GET", f"/api/v1/chat/{chat_id}/messages"), message["id"]), "chat message persists")
        media_message = second.request("POST", "/api/v1/chat/message/media", fields={"chatId": manifest["chatIds"][0], "content": marker}, file_field="file")
        manifest["messageIds"].append(media_message["id"])
        manifest["mediaUrls"].append(media_message["mediaUrl"])
        check(guest.request("GET", media_message["mediaUrl"], raw=True) == IMAGE, "chat media upload/download")
        check(has_id(second.request("GET", "/api/v1/chat"), manifest["chatIds"][0]), "chat list")
        notifications = rows(second.request("GET", "/api/v1/notifications"))
        own_notifications = [n for n in notifications if n.get("actorId") == a["id"]]
        check(own_notifications and second.request("GET", "/api/v1/notifications/unread-count") > 0, "notifications and unread count")
        second.request("PUT", f'/api/v1/notifications/{own_notifications[0]["id"]}/read')
        second.request("PUT", "/api/v1/notifications/read-all")
        check(second.request("GET", "/api/v1/notifications/unread-count") == 0, "notification read state")

        reasons = first.request("GET", "/api/v1/reports/reasons")
        check(reasons, "report reasons seeded")
        second.request("POST", f"/api/v1/reports/{post_id}", {"reasonId": reasons[0]["id"], "reasonDetail": marker})
        if "Admin" in a.get("roles", []):
            first.request("GET", "/api/v1/admin/users?" + urllib.parse.urlencode({"search": credentials[0][0]}))
            first.request("GET", "/api/v1/admin/posts?search=" + marker)
            report = next(r for r in rows(first.request("GET", "/api/v1/admin/reports")) if r["post"]["id"] == post_id and r["reporter"]["id"] == b["id"])
            manifest["reportIds"].append(report["id"])
            first.request("PUT", f'/api/v1/admin/reports/{report["id"]}/resolve', {"action": "dismiss"})
            reason = first.request("POST", "/api/v1/admin/report-reasons", {"code": marker, "name": marker})
            cleanup.append((first, "DELETE", f'/api/v1/admin/report-reasons/{reason["id"]}', {}))
            check(has_id(first.request("GET", "/api/v1/admin/report-reasons"), reason["id"]), "admin report/reason management")
            if "Admin" not in b.get("roles", []):
                second.request("GET", "/api/v1/admin/users", expected=(403,))
                first.request("POST", f'/api/v1/admin/users/{b["id"]}/toggle-block')
                try:
                    guest.request("POST", "/api/v1/auth/login", {"usernameOrEmail": credentials[1][0], "password": credentials[1][1]}, expected=(403,))
                    check(True, "admin user block prevents login")
                finally:
                    first.request("POST", f'/api/v1/admin/users/{b["id"]}/toggle-block')
            first.request("DELETE", f"/api/v1/admin/posts/{post_id}")
            check(True, "admin deletes synthetic post")
        else:
            print("SKIP admin functionality: grant Admin to the first synthetic account")
        check(True, "live smoke completed; Google/OTP delivery and WebSocket events require separate verification")
    finally:
        for client, method, path, kwargs in reversed(cleanup):
            try:
                client.request(method, path, **kwargs)
                print("CLEAN " + method + " " + path)
            except Exception as error:
                print("WARN cleanup " + path + ": " + str(error), file=sys.stderr)
        for client in (first, second):
            if any(cookie.name == "jwt" for cookie in client.cookies):
                try:
                    client.request("POST", "/api/v1/auth/logout")
                    client.request("GET", "/api/v1/auth/me", expected=(401,))
                    print("PASS logout clears authentication")
                except Exception as error:
                    print("WARN logout: " + str(error), file=sys.stderr)
        print("CLEANUP_MANIFEST " + json.dumps(manifest, sort_keys=True), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--register-only", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        body, content_type = multipart({"Content": "hello #smoke"}, "Images")
        check(IMAGE.startswith(b"GIF89a") and IMAGE in body and b'name="Images"' in body,
              "valid synthetic image and multipart file")
        check(body.endswith(("--" + content_type.split("boundary=")[1] + "--\r\n").encode()), "multipart terminator")
        check(username("smoke@example.invalid") == username("SMOKE@example.invalid"), "stable synthetic username")
        check(has_id({"data": [{"post": {"id": 3}}]}, 3), "feed identifiers")
        return
    site = os.environ["SITE_URL"]
    parsed = urllib.parse.urlsplit(site)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
        raise ValueError("SITE_URL must be a public HTTPS origin without credentials or query")
    credentials = [(os.environ["SMOKE_EMAIL"], os.environ["SMOKE_PASSWORD"]),
                   (os.environ["SECOND_EMAIL"], os.environ["SECOND_PASSWORD"])]
    if credentials[0][0].lower() == credentials[1][0].lower():
        raise ValueError("Provide two different disposable accounts")
    if any(not email.lower().endswith("@example.invalid") for email, _ in credentials):
        raise ValueError("Only reserved @example.invalid synthetic accounts are allowed")
    if args.register_only:
        for email, password in credentials:
            name = username(email)
            Client(site).request("POST", "/api/v1/auth/register", {"username": name, "email": email,
                                "password": password, "fullName": "Instory synthetic smoke"}, expected=(201,))
            print(json.dumps({"email": email, "username": name, "requiresDBConfirmation": True}))
    else:
        run(site, credentials)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("FAIL " + str(error), file=sys.stderr)
        sys.exit(1)
