# 反向代理配置

本章节介绍如何配置 Nginx 和 Traefik 作为反向代理。

## Nginx 配置

### 基础配置

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 包含其他配置
    include /etc/nginx/conf.d/*.conf;
}
```

### Keycloak 代理配置

```nginx
# /etc/nginx/conf.d/keycloak.conf
server {
    listen 443 ssl http2;
    server_name keycloak.example.com;

    ssl_certificate /etc/nginx/certs/server.crt.pem;
    ssl_certificate_key /etc/nginx/certs/server.key.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 代理配置
    location / {
        proxy_pass http://keycloak:8080;
        proxy_http_version 1.1;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 缓冲区配置
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name keycloak.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Grafana 代理配置

```nginx
# /etc/nginx/conf.d/grafana.conf
server {
    listen 443 ssl http2;
    server_name grafana.example.com;

    ssl_certificate /etc/nginx/certs/server.crt.pem;
    ssl_certificate_key /etc/nginx/certs/server.key.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 代理配置
    location / {
        proxy_pass http://grafana:3000;
        proxy_http_version 1.1;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket 支持 (Grafana Live)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 缓冲区配置
        proxy_buffering off;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name grafana.example.com;
    return 301 https://$server_name$request_uri;
}
```

### 负载均衡配置

```nginx
# Upstream 配置
upstream keycloak_backend {
    least_conn;
    server keycloak1:8080 max_fails=3 fail_timeout=30s;
    server keycloak2:8080 max_fails=3 fail_timeout=30s;
    server keycloak3:8080 max_fails=3 fail_timeout=30s;
}

upstream grafana_backend {
    least_conn;
    server grafana1:3000 max_fails=3 fail_timeout=30s;
    server grafana2:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name keycloak.example.com;

    location / {
        proxy_pass https://keycloak_backend;
        # ... 其他配置
    }
}
```

## Traefik 配置

### Docker Compose 配置

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.example.com`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"

  keycloak:
    image: quay.io/keycloak/keycloak:26.3.0
    # ... 其他配置
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.keycloak.rule=Host(`keycloak.example.com`)"
      - "traefik.http.routers.keycloak.entrypoints=websecure"
      - "traefik.http.routers.keycloak.tls.certresolver=letsencrypt"
      - "traefik.http.services.keycloak.loadbalancer.server.port=8080"
      - "traefik.http.services.keycloak.loadbalancer.server.scheme=http"

  grafana:
    image: grafana/grafana:latest
    # ... 其他配置
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`grafana.example.com`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
```

### 文件提供者配置

```yaml
# traefik.yml
global:
  checkNewVersion: false
  sendAnonymousUsage: false

api:
  dashboard: true
  insecure: false

providers:
  docker:
    exposedByDefault: false
  file:
    directory: /etc/traefik/dynamic
    watch: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: /letsencrypt/acme.json
      tlsChallenge: {}
```

### 动态配置

```yaml
# /etc/traefik/dynamic/keycloak.yml
http:
  routers:
    keycloak:
      rule: "Host(`keycloak.example.com`)"
      service: keycloak
      tls:
        certResolver: letsencrypt
      middlewares:
        - security-headers

  services:
    keycloak:
      loadBalancer:
        servers:
          - url: "http://keycloak:8080"
        healthCheck:
          path: /health/ready
          interval: 10s

  middlewares:
    security-headers:
      headers:
        customFrameOptionsValue: SAMEORIGIN
        contentTypeNosniff: true
        browserXssFilter: true
        referrerPolicy: strict-origin-when-cross-origin
```

## 性能优化

### Nginx 性能调优

```nginx
http {
    # 连接优化
    worker_connections 4096;
    use epoll;
    multi_accept on;

    # 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 缓存
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

    # 超时优化
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;
}
```

### 启用 HTTP/2

```nginx
server {
    listen 443 ssl http2;
    # ...
}
```

## 安全加固

### 限制请求速率

```nginx
# Nginx
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

server {
    location / {
        limit_req zone=one burst=20 nodelay;
        # ...
    }
}
```

```yaml
# Traefik
middlewares:
  rate-limit:
    rateLimit:
      average: 100
      burst: 50
```

### IP 白名单

```nginx
# Nginx
location /admin {
    allow 192.168.1.0/24;
    deny all;
    # ...
}
```

```yaml
# Traefik
middlewares:
  ip-whitelist:
    ipWhiteList:
      sourceRange:
        - "192.168.1.0/24"
```

## 监控

### Nginx 状态

```nginx
server {
    location /nginx_status {
        stub_status on;
        allow 127.0.0.1;
        deny all;
    }
}
```

### Traefik 指标

```yaml
# traefik.yml
metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true
    addRoutersLabels: true
```

## 故障排除

### 502 Bad Gateway

**原因**: 后端服务不可用

**解决**:
```bash
# 检查服务状态
docker-compose ps

# 检查网络连接
docker-compose exec nginx ping keycloak

# 查看后端日志
docker-compose logs keycloak
```

### SSL 握手失败

**原因**: 证书或加密套件不匹配

**解决**:
```bash
# 检查证书
openssl s_client -connect keycloak.example.com:443 -servername keycloak.example.com

# 更新 Nginx SSL 配置
ssl_protocols TLSv1.2 TLSv1.3;
```

## 下一步

- [生产环境配置](./production) - 生产环境安全加固
- [SSL 证书配置](./ssl) - HTTPS 详细配置
