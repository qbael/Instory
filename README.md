# Instory

# Instory — Hướng Dẫn Khởi Chạy

Dự án gồm 3 thành phần chính: **Backend** (ASP.NET Core), **Frontend** (React), và **Database** (PostgreSQL trên AWS RDS; Docker là tuỳ chọn cho database local).

## Tech Stack

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Backend | ASP.NET Core | .NET 10 |
| Backend | Entity Framework Core | 10.0.5 |
| Backend | Npgsql (PostgreSQL driver) | 10.0.1 |
| Backend | SignalR | 10.0.5 |
| Backend | JWT Bearer Auth | 10.0.5 |
| Backend | Swagger UI | 10.1.7 |
| Frontend | React | 19 |
| Frontend | TypeScript | 5.9 |
| Frontend | Vite | 8 |
| Frontend | Redux Toolkit | 2.x |
| Frontend | React Router | 7.x |
| Frontend | TailwindCSS | 4.x |
| Database | PostgreSQL | AWS RDS / Docker local |

---

## Cấu Trúc Dự Án

```
instory/
├── backend/                        # ASP.NET Core API
│   └── Instory.API/
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       └── ...
├── frontend/                       # React App
│   ├── .env
│   └── ...
└── docker-compose.yml
```

---

## Bước 0 — Cài Đặt Môi Trường (Chỉ Làm 1 Lần)

Nếu máy bạn chưa cài các công cụ dưới đây, hãy làm theo hướng dẫn tương ứng với hệ điều hành của mình.

### Docker Desktop (tuỳ chọn)

Chỉ cần Docker nếu muốn chạy database local thay cho RDS.

- **Windows / macOS:** Tải và cài tại https://www.docker.com/products/docker-desktop
    - Sau khi cài xong, mở ứng dụng **Docker Desktop** và chờ icon Docker ở thanh taskbar chuyển sang trạng thái **"Running"** trước khi tiếp tục.
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install -y docker.io docker-compose-plugin
  sudo usermod -aG docker $USER
  # Đăng xuất và đăng nhập lại để áp dụng quyền
  ```

Kiểm tra cài đặt thành công:

```bash
docker --version
docker compose version
```

### .NET SDK 10

Dùng để chạy backend ASP.NET Core.

- Tải tại https://dotnet.microsoft.com/download/dotnet/10.0 → chọn đúng hệ điều hành → cài file `.pkg` (macOS) hoặc `.exe` (Windows)

Kiểm tra:

```bash
dotnet --version
# 10.x.x
```

### Node.js 22+

Dùng để chạy frontend React (Vite 8 yêu cầu Node.js 22 trở lên).

- Tải tại https://nodejs.org → chọn phiên bản **v22 LTS** → cài như phần mềm bình thường

> **Lưu ý:** Chọn đúng **v22**, không chọn bản "Latest" vì có thể chưa ổn định.

Kiểm tra:

```bash
node --version
# v22.x.x hoặc cao hơn
npm --version
```

### Git

Dùng để tải source code từ GitHub.

- **Windows:** Tải tại https://git-scm.com/download/win → cài mặc định, không cần thay đổi tuỳ chọn
- **macOS:** Chạy lệnh `git --version` trong Terminal, nếu chưa có máy sẽ tự hỏi cài
- **Linux:** `sudo apt install -y git`

---

## Bước 1 — Clone Repository

Mở Terminal (macOS/Linux) hoặc **Git Bash** (Windows), chạy:

```bash
git clone https://github.com/your-org/instory.git
cd instory
```

> Thay `your-org/instory` bằng đường dẫn repo thực tế trên GitHub.

---

## 2. Kết Nối Database RDS

Backend dùng connection string `ConnectionStrings:Instory` để kết nối PostgreSQL trên RDS, không cần chạy Docker. Máy local phải được phép truy cập endpoint RDS qua cổng 5432 trong security group của database.

Trong cấu hình bên dưới, thay `RDS_PASSWORD` bằng mật khẩu database. `SSL Mode=Require` giữ kết nối mã hóa và không yêu cầu tải file CA; chế độ này không xác minh chứng chỉ máy chủ.

Nếu muốn dùng database local, vẫn có thể chạy `docker compose up -d postgres` và đổi connection string về `Host=localhost;Port=5432;Database=Instory;Username=instory;Password=instory_pass`.

---

## 2. Cấu Hình Backend (ASP.NET Core)

### 2.1 Tạo file cấu hình

Trong thư mục `backend/Instory.API/`, tạo file `appsettings.Development.json` với nội dung sau:

```json
{
  "ConnectionStrings": {
    "Instory": "Host=instory.c7qgaem64gqm.ap-southeast-1.rds.amazonaws.com;Port=5432;Database=Instory;Username=instory;Password=RDS_PASSWORD;SSL Mode=Require"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_LOCAL_JWT_SECRET_AT_LEAST_32_CHARACTERS",
    "Issuer": "Instory",
    "Audience": "Instory",
    "ExpirationMinutes": 4320,
    "RefreshTokenExpirationDays": 7
  },
  "AWS": {
    "AccessKey": "YOUR_AWS_ACCESS_KEY",
    "SecretKey": "YOUR_AWS_SECRET_KEY",
    "Region": "ap-southeast-1",
    "BucketName": "instory-media"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

> **Lưu ý:** Thay `YOUR_AWS_ACCESS_KEY` và `YOUR_AWS_SECRET_KEY` bằng credentials AWS thực tế nếu cần dùng tính năng upload file. Liên hệ team để lấy giá trị chính xác.

File `appsettings.Development.json` được Git bỏ qua; không commit mật khẩu RDS.

### 2.2 Migration database

Backend tự áp dụng migration khi khởi động. Với RDS dùng chung production, thao tác ghi và migration từ local sẽ tác động trực tiếp tới dữ liệu production. Chỉ chạy lệnh sau khi cần cập nhật thủ công:

```bash
cd backend/Instory.API
dotnet ef database update
```

### 2.3 Khởi động backend

```bash
cd backend/Instory.API
dotnet run
```

Hoặc từ thư mục gốc repo: `dotnet run --project backend/Instory.API`.

Backend sẽ chạy tại: `http://localhost:5174`

---

## 3. Cấu Hình Frontend (React)

### 3.1 Tạo file `.env`

Trong thư mục `frontend/`, tạo file `.env` với nội dung:

```env
API_BASE_URL=http://localhost:5174/api
```

### 3.2 Cài đặt dependencies và chạy

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## Tóm Tắt Các Địa Chỉ

| Dịch vụ | Địa chỉ |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend API (ASP.NET) | http://localhost:5174 |
| PostgreSQL (RDS) | instory.c7qgaem64gqm.ap-southeast-1.rds.amazonaws.com:5432 |

---

## Lệnh Hữu Ích

```bash
# Các lệnh dưới đây chỉ dành cho database Docker local
# Xem log database
docker compose logs -f postgres

# Kết nối trực tiếp vào PostgreSQL
docker compose exec postgres psql -U instory -d Instory

# Dừng database
docker compose stop

# Xoá hoàn toàn database (mất data!)
docker compose down -v
```

---

## Thứ Tự Khởi Động

```
1. Cấu hình connection string RDS (chỉ lần đầu)
2. dotnet run --project backend/Instory.API → API sẵn sàng
3. npm run dev (frontend/)                 → Giao diện sẵn sàng
```