# Docker Deployment Guide

## Prerequisites
- Docker và Docker Compose đã được cài đặt

## Cách sử dụng

### 1. Build và chạy với Docker Compose

```bash
# Set environment variable (optional)
export VITE_API_BASE_URL=http://your-api-server:8000

# Build và chạy
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

### 2. Build và chạy với Docker trực tiếp

```bash
# Build image
docker build --build-arg VITE_API_BASE_URL=http://your-api-server:8000 -t vet-cms .

# Chạy container
docker run -d -p 3000:80 --name vet-cms vet-cms

# Xem logs
docker logs -f vet-cms

# Dừng và xóa container
docker stop vet-cms
docker rm vet-cms
```

### 3. Sử dụng file .env

Tạo file `.env` trong thư mục gốc:

```env
VITE_API_BASE_URL=http://your-api-server:8000
```

Sau đó chạy:

```bash
docker-compose up -d
```

## Cấu hình

### Thay đổi port

Sửa file `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:80"
```

### Thay đổi API URL

Set biến môi trường `VITE_API_BASE_URL` khi build:

```bash
docker build --build-arg VITE_API_BASE_URL=http://your-api:8000 -t vet-cms .
```

## Production Deployment

### Với Nginx reverse proxy

1. Build image:
```bash
docker build --build-arg VITE_API_BASE_URL=https://api.yourdomain.com -t vet-cms .
```

2. Chạy container:
```bash
docker run -d -p 80:80 --name vet-cms --restart unless-stopped vet-cms
```

### Với Docker Compose

```bash
docker-compose -f docker-compose.yml up -d
```

## Troubleshooting

### Container không start
```bash
docker logs vet-cms
```

### Rebuild image
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Xóa tất cả
```bash
docker-compose down -v
docker rmi vet-cms
```

