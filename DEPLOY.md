# Triển khai Instory trên AWS

Bản triển khai dùng tài khoản `092201262875`, region `ap-southeast-1` (Singapore).
CloudFormation stack: `instory`. Mẫu hạ tầng: `deploy/aws.yml`.

## Dịch vụ

| Thành phần | Tài nguyên | Thiết lập |
|---|---|---|
| Website HTTPS | https://d3bxzivb46uej3.cloudfront.net | Tạo CloudFront distribution |
| Media HTTPS | https://dyyv9jtx43bib.cloudfront.net | Tạo CloudFront distribution + OAC |
| EC2 có sẵn | `i-0b3a2deb9e5aab2b9`, Ubuntu, Docker + Nginx + SSM | Tái sử dụng; khởi động, Docker/Nginx/SSM, tăng EBS lên 20GB |
| Elastic IP | `46.137.243.190` | Tạo và gắn vào EC2 |
| RDS | `instory`, PostgreSQL 17.11, db.t4g.micro, private, backup 7 ngày | Tạo mới; database mới |
| ECR có sẵn | `092201262875.dkr.ecr.ap-southeast-1.amazonaws.com/instory/backend` | Tái sử dụng backend repository; image theo commit SHA |
| Media bucket có sẵn | `instory-092201262875-ap-southeast-1-an`, private, CloudFront OAC | Tái sử dụng; chặn public, chỉ CloudFront OAC đọc |
| Artifact bucket | `instory-artifacts-zblrc3x7bwly`, private, releases hết hạn sau 30 ngày | Tạo mới |
| Cấu hình runtime | Secrets Manager `instory/production` | Tái sử dụng secret; cập nhật cấu hình production |
| Instance role | `Instory`: đọc secret, ECR, artifacts; đọc/ghi media; SSM | Tái sử dụng; thu hẹp quyền và bật SSM |
| CI role | `instory-github-deploy`: GitHub OIDC, chỉ `qbael/Instory` nhánh `main` | Tạo role và GitHub OIDC provider |

CloudFront chuyển website/API/SignalR cùng origin đến Nginx. Nginx phục vụ SPA,
proxy `/api/`, `/hubs/` (WebSocket), `/health` đến API tại `127.0.0.1:8080`.
CloudFront media truy cập S3 bằng OAC. S3 chặn truy cập public trực tiếp.
Security group chỉ cho CloudFront vào cổng 80; RDS chỉ cho EC2 vào 5432.
Quản trị máy bằng SSM, không mở SSH hoặc cổng API ra Internet.

`instory.codes` không phân giải DNS khi thiết lập. URL CloudFront hoạt động độc lập
với domain này; gắn domain riêng cần DNS + ACM và cập nhật Google OAuth origins.
Database cũ không còn instance/snapshot, nên đây là database mới. S3 cũ được giữ lại.
Stack cũng tạo database subnet group và hai security group cho EC2/RDS; VPC/subnet
có sẵn được tái sử dụng.

## CI/CD

`.github/workflows/ci-cd.yml` kiểm tra pull request và `main`:

- Backend: restore, Release build, tests, coverage.
- Frontend: `npm ci`, lint, test, production build.
- Triển khai: kiểm tra secrets rendering, deploy thành công và rollback khi lỗi.

Push/merge vào `main`, hoặc chạy workflow thủ công trên `main`, sẽ:

1. Nhận AWS credentials tạm thời bằng OIDC.
2. Build/push image ECR với tag commit SHA; tag immutable được tái sử dụng khi chạy lại.
3. Gói `frontend/` và `deploy/`, tải lên S3.
4. Gọi SSM để EC2 tải release, đọc Secrets Manager, chạy Docker Compose.
5. Chờ database/API health, đổi symlink frontend, kiểm tra URL public và commit marker.
6. Khôi phục backend/frontend/Nginx của release trước nếu deploy lỗi.

Một EC2 chạy một API instance; mỗi restart có gián đoạn ngắn.
Deploy không tự hoàn nguyên database migration. Migration tiếp theo cần tương thích
với release trước hoặc có kế hoạch phục hồi RDS; bản khởi tạo này tạo schema mới.

GitHub Actions **variables** (không chứa mật khẩu): `AWS_REGION`, `ECR_REGISTRY`,
`ECR_REPOSITORY`, `INSTANCE_ID`, `ARTIFACT_BUCKET`, `AWS_DEPLOY_ROLE_ARN`,
`SITE_URL`, `VITE_GOOGLE_CLIENT_ID`. Không cần AWS access key hoặc SSH key trong GitHub.

## Secrets và Google

Secret nhận JSON phẳng (dấu `__`) hoặc lồng nhau; `render-secrets.py` chuyển thành
Compose JSON override mode `0600`. Secrets không nằm trong image hoặc frontend.
Các khóa runtime:

- `ConnectionStrings__Instory`: RDS endpoint, database `Instory`, username/password,
  `SSL Mode=VerifyFull;Root Certificate=/app/rds-ca-bundle.pem`.
- `JwtSettings__SecretKey`, `Issuer`, `Audience`, `ExpirationMinutes`,
  `RefreshTokenExpirationDays`.
- `AWS__Region`, `AWS__BucketName`, `AWS__PublicBaseUrl` (media CloudFront URL).
- `Google__ClientId`: trùng `VITE_GOOGLE_CLIENT_ID` lúc build frontend.
- `Email__Host`, `Port`, `Username`, `Password`, `FromName`; `FromEmail` nếu khác username.
- `Cors__AllowedOrigins__0`: website HTTPS origin.

OAuth project: `instory-499507`, client Instory
`340684800952-gt4r2o1a5oh9fj8mpfv3sk36jq0orjiq.apps.googleusercontent.com`.
Authorized JavaScript origins cần website HTTPS ở trên. Login dùng Google ID-token
popup, không cần OAuth client secret hoặc callback backend. Google có thể mất vài
phút để áp dụng thay đổi. Đăng nhập Google và đăng ký bằng OTP qua email thật
đã được xác minh trên website AWS; tài khoản chủ sở hữu đã có quyền Admin.

## Dịch vụ ngoài AWS

| Dịch vụ | Cấu hình | Thiết lập |
|---|---|---|
| GitHub Actions | CI/CD trong `qbael/Instory`, 8 repository variables, AWS OIDC | Tạo workflow và variables; dùng repository có sẵn |
| Google Cloud OAuth | Project `instory-499507`, client Instory, website CloudFront trong Authorized JavaScript origins | Cập nhật client có sẵn; không tạo project/client mới |
| Gmail SMTP | Gửi OTP qua `smtp.gmail.com:587`, thông tin đăng nhập ở Secrets Manager | Tái sử dụng tài khoản SMTP có sẵn; không tạo mailbox mới |

## Vận hành và kiểm tra

```bash
aws login
aws cloudformation describe-stacks --stack-name instory --region ap-southeast-1
aws ssm start-session --target i-0b3a2deb9e5aab2b9 --region ap-southeast-1
```

Trong EC2, release tại `/opt/instory/current`, release trước tại `/opt/instory/previous`.
Docker volume `instory_dataprotection_keys` được giữ qua deploy. Logs container xoay
vòng 3 file x 10MB; Nginx log bỏ query để không ghi SignalR access token.

```bash
curl --fail https://d3bxzivb46uej3.cloudfront.net/health
curl --fail https://d3bxzivb46uej3.cloudfront.net/release.txt
python3 deploy/test_deploy.py
python3 deploy/smoke.py --self-test
node deploy/realtime-smoke.mjs --self-test
```

Live smoke chỉ dùng hai tài khoản `@example.invalid` có username `instory_smoke_*`.
Đặt `SITE_URL`, `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `SECOND_EMAIL`, `SECOND_PASSWORD`;
chạy `smoke.py --register-only`, xác nhận email trong DB và cấp Admin cho tài khoản
thứ nhất, rồi chạy `smoke.py` và `realtime-smoke.mjs`. Script không gửi OTP và xuất
`CLEANUP_MANIFEST` cho các bản ghi/media cần dọn. Không dùng tài khoản thật cho smoke.
Admin thật được cấp cho tài khoản chủ sở hữu sau khi đăng ký/xác minh hoặc Google login.
Bộ kiểm tra live bao gồm đăng nhập/refresh cookie, profile, kết bạn, CRUD bài viết,
media, tìm kiếm/hashtag, story/highlight, chat, thông báo, báo cáo và quản trị.
`realtime-smoke.mjs` kiểm tra WSS và đúng sự kiện tin nhắn, bài mới, lượt thích,
bình luận. Google/OTP được kiểm tra bằng tài khoản thật, riêng với các tài khoản synthetic.

CloudFormation giữ artifact bucket khi xóa stack, tạo snapshot RDS, và bật RDS deletion
protection. Khi cập nhật stack, dùng `UsePreviousValue` cho `DatabasePassword` để
không ghi mật khẩu vào command line. EC2/ECR/media bucket/secret có sẵn được tái sử dụng,
không thuộc vòng đời tạo/xóa của stack. Instance security group và managed SSM policy
đã cấu hình ngoài stack; giữ chúng khi phục hồi cấu hình EC2.
