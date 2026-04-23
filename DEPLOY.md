# Instory AWS Deployment Guide

## Architecture

```
git push → GitHub Actions → build + test → push ECR → EC2 pull & restart

User → Nginx (443) → .NET App (8080) → RDS PostgreSQL
                                      → AWS S3 (media)
```

## AWS Resources

| Service | Chi tiết |
|---|---|
| ECR | `689327565628.dkr.ecr.ap-southeast-2.amazonaws.com/instory-api` |
| RDS | `instory-db.cbomcyqc8i6z.ap-southeast-2.rds.amazonaws.com` — PostgreSQL 17, db.t3.micro |
| EC2 | IP `3.25.112.35`, Ubuntu 24.04, t2.micro |
| Secrets Manager | `instory/production` |
| IAM Role | `instory-ec2-role` (gắn vào EC2) |
| IAM User | `iuser-deploy` (dùng cho GitHub Actions) |
| Region | `ap-southeast-2` (Sydney) |

---

## Bước 1: Chuẩn bị AWS Infrastructure

### 1.1 Tạo ECR repository
```bash
aws ecr create-repository --repository-name instory-api --region ap-southeast-2
```

### 1.2 Tạo RDS PostgreSQL
- Engine: PostgreSQL 17
- Instance: db.t3.micro
- DB name: `Instory`, User: `instory`
- VPC: default VPC
- Security group: tạo `instory-rds-sg`

### 1.3 Tạo EC2
- AMI: Ubuntu 24.04
- Instance type: t2.micro
- Security group: tạo `instory-sg` (inbound: 22, 80, 443, 8080)
- IAM Role: `instory-ec2-role` với policies:
  - `AmazonEC2ContainerRegistryReadOnly`
  - `SecretsManagerReadWrite`
  - `AmazonS3FullAccess`

### 1.4 Kết nối EC2 → RDS
Vào **RDS → instory-db → Connectivity & security → Connected compute resources → "Set up EC2 connection"**, chọn EC2 instance.  
AWS sẽ tự động config security group cho cả hai.

### 1.5 Tạo Secrets Manager
Vào **Secrets Manager → Store a new secret → Other type**:
```json
{
  "ConnectionStrings__Instory": "Host=instory-db.cbomcyqc8i6z.ap-southeast-2.rds.amazonaws.com;Database=Instory;Username=instory;Password=YOUR_PASSWORD;sslmode=require",
  "JwtSettings__SecretKey": "YOUR_JWT_SECRET_KEY",
  "AWS__AccessKey": "YOUR_AWS_ACCESS_KEY",
  "AWS__SecretKey": "YOUR_AWS_SECRET_KEY",
  "AWS__BucketName": "YOUR_S3_BUCKET",
  "AWS__Region": "ap-southeast-2"
}
```
Secret name: `instory/production`

### 1.6 Tạo IAM User cho GitHub Actions
- User name: `iuser-deploy`
- Policies: `AmazonEC2ContainerRegistryFullAccess`, `SecretsManagerReadWrite`
- Tạo Access Key → lưu lại

---

## Bước 2: Cài đặt EC2

SSH vào EC2:
```bash
ssh -i your-key.pem ubuntu@3.25.112.35
```

### 2.1 Cài Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
```

### 2.2 Cài AWS CLI
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2.3 Cài Nginx
```bash
sudo apt update && sudo apt install -y nginx
```

---

## Bước 3: Deploy Script trên EC2

Tạo file `/home/ubuntu/deploy.sh`:
```bash
#!/bin/bash
set -e

AWS_REGION="ap-southeast-2"
ECR_REGISTRY="689327565628.dkr.ecr.ap-southeast-2.amazonaws.com"
IMAGE_NAME="instory-api"
SECRET_NAME="instory/production"

echo "Fetching secrets..."
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id $SECRET_NAME \
  --region $AWS_REGION \
  --query SecretString \
  --output text)

# Ghi ra file .env
echo "$SECRET" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for k, v in data.items():
    print(f'{k}={v}')
" > /home/ubuntu/.env

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

echo "Pulling latest image..."
docker pull $ECR_REGISTRY/$IMAGE_NAME:latest

echo "Restarting container..."
cd /home/ubuntu
docker compose -f docker-compose.prod.yml down || true
docker compose -f docker-compose.prod.yml up -d

echo "Done!"
```

```bash
chmod +x /home/ubuntu/deploy.sh
```

---

## Bước 4: Docker Compose Production

Tạo `/home/ubuntu/docker-compose.prod.yml`:
```yaml
version: '3.9'
services:
  api:
    image: 689327565628.dkr.ecr.ap-southeast-2.amazonaws.com/instory-api:latest
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - dataprotection_keys:/root/.aspnet/DataProtection-Keys
    restart: unless-stopped

volumes:
  dataprotection_keys:
```

---

## Bước 5: Nginx Config

```bash
sudo nano /etc/nginx/sites-available/instory
```

```nginx
server {
    listen 80;
    server_name 3.25.112.35;  # thay bằng domain nếu có

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SignalR WebSocket
    location /hubs/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/instory /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Bước 6: GitHub Actions CI/CD

### 6.1 Thêm GitHub Secrets
Vào repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access key của `iuser-deploy` |
| `AWS_SECRET_ACCESS_KEY` | Secret key của `iuser-deploy` |
| `EC2_HOST` | `3.25.112.35` |
| `EC2_SSH_KEY` | Nội dung file `.pem` |

### 6.2 Workflow file

Tạo `.github/workflows/ci-cd.yml`:
```yaml
name: CI/CD

on:
  push:
    branches: [main]

env:
  AWS_REGION: ap-southeast-2
  ECR_REGISTRY: 689327565628.dkr.ecr.ap-southeast-2.amazonaws.com
  ECR_REPOSITORY: instory-api

jobs:
  build-and-push:
    name: Build & Push to ECR
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.x'

      - name: Build & Test
        run: |
          dotnet restore backend/Instory.slnx
          dotnet build backend/Instory.slnx --no-restore
          dotnet test backend/Instory.Tests --no-build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & Push Docker image
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy:
    name: Deploy to EC2
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: SSH & Deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: /home/ubuntu/deploy.sh
```

---

## Bước 7: HTTPS với Certbot (cần domain)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo systemctl enable certbot.timer
```

Certbot sẽ tự động update Nginx config và renew cert mỗi 90 ngày.

---

## Những chỗ bị bí

### EC2 không connect được RDS (nc timeout)

**Triệu chứng:**
```
nc: connect to instory-db... port 5432 (tcp) timed out
```

**Đã thử mà không fix được:**
- Tự tay thêm inbound rule vào `instory-rds-sg` cho EC2 security group `sg-0812e9dc1b51f6238`
- Rule đúng port 5432, đúng VPC, đúng security group — vẫn timeout
- Lý do nghi ngờ: Network ACL ở subnet level có thể block dù security group đúng

**Cách fix:**
Dùng AWS wizard thay vì config tay:
> RDS → instory-db → Connectivity & security → Connected compute resources → **"Set up EC2 connection"** → chọn EC2 instance

AWS tự động config toàn bộ security group + networking. Sau khi wizard chạy xong thì `nc` thành công ngay.

**Bài học:** Đừng config security group EC2↔RDS tay — dùng wizard của AWS, nhanh hơn và chắc chắn hơn.

---

## Checklist

- [x] ECR repository
- [x] RDS PostgreSQL
- [x] EC2 với Docker + Nginx + AWS CLI
- [x] IAM Role cho EC2
- [x] IAM User cho GitHub Actions
- [x] Secrets Manager
- [x] EC2 → RDS connection
- [ ] deploy.sh trên EC2
- [ ] docker-compose.prod.yml trên EC2
- [ ] Nginx config
- [ ] GitHub Actions workflow
- [ ] GitHub Secrets
- [ ] HTTPS (nếu có domain)
