# Docker Compose 部署

使用 Docker Compose 快速部署 Keycloak + Grafana + WebAuthn 环境。

## 目录结构

```
.
├── docker-compose.yml          # 主配置文件
├── .env                        # 环境变量
├── certs/                      # SSL 证书
│   ├── server.crt.pem
│   └── server.key.pem
├── nginx/                      # Nginx 配置
│   ├── nginx.conf
│   └── conf.d/
└── scripts/
    └── generate-certs.sh       # 证书生成脚本
```

## 快速部署

### 1. 准备环境

```bash
# 克隆仓库
git clone https://github.com/undownding/keycloak-grafana-webauthn-wiki.git
cd keycloak-grafana-webauthn-wiki

# 安装依赖（可选，用于本地文档预览）
bun install
```

### 2. 配置环境变量

```bash
cp .env.example .env

# 编辑 .env 文件
vim .env
```

关键配置项：

```bash
# 域名
KEYCLOAK_HOSTNAME=keycloak.example.com
GRAFANA_HOSTNAME=grafana.example.com

# 数据库密码（请修改）
POSTGRES_PASSWORD=your_strong_password
KEYCLOAK_ADMIN_PASSWORD=your_admin_password

# Keycloak Client Secret（生成后填写）
KEYCLOAK_CLIENT_SECRET=your_client_secret
```

### 3. 生成 SSL 证书

```bash
# 测试环境 - 自签名证书
./scripts/generate-certs.sh

# 生产环境 - Let's Encrypt（推荐）
certbot certonly --standalone -d keycloak.example.com -d grafana.example.com
```

### 4. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f keycloak
```

### 5. 验证部署

```bash
# 检查容器状态
docker-compose ps

# 检查健康状态
docker-compose exec keycloak curl -f http://localhost:8080/health/ready
docker-compose exec grafana curl -f http://localhost:3000/api/health
```

## 服务访问

| 服务 | URL | 说明 |
|------|-----|------|
| Keycloak | https://keycloak.example.com:8443 | 身份提供商 |
| Grafana | http://localhost:3000 | 监控平台（通过 Nginx 代理到 443） |
| Nginx | https://grafana.example.com | 反向代理入口 |

## 初始配置

### 配置 Keycloak

1. 访问 https://keycloak.example.com:8443/admin
2. 使用 `KEYCLOAK_ADMIN` 和 `KEYCLOAK_ADMIN_PASSWORD` 登录
3. 创建 Realm: `grafana`
4. 创建 Client: `grafana`
5. 获取 Client Secret 并更新到 `.env`
6. 重启 Grafana: `docker-compose restart grafana`

详见 [Keycloak 配置](../guide/keycloak)

### 配置 WebAuthn

1. 进入 Keycloak Admin Console
2. Authentication → Policies → WebAuthn Policy
3. 启用 **Enable Passkeys**
4. 配置 User Verification Requirement

详见 [WebAuthn 设置](../guide/webauthn)

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v

# 重启服务
docker-compose restart

# 重启单个服务
docker-compose restart grafana

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec keycloak bash

# 更新镜像
docker-compose pull
docker-compose up -d

# 查看资源使用
docker-compose stats
```

## 数据持久化

数据存储在 Docker 卷中：

| 卷名 | 用途 | 备份路径 |
|------|------|----------|
| postgres_data | Keycloak 数据库 | /var/lib/postgresql/data |
| keycloak_data | Keycloak 配置 | /opt/keycloak/data |
| grafana_data | Grafana 数据 | /var/lib/grafana |
| grafana_postgres_data | Grafana 数据库 | /var/lib/postgresql/data |
| redis_data | 会话缓存 | /data |

### 备份数据

```bash
# 备份脚本
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

docker-compose exec postgres pg_dump -U keycloak keycloak > $BACKUP_DIR/keycloak.sql
docker-compose exec grafana-postgres pg_dump -U grafana grafana > $BACKUP_DIR/grafana.sql
tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR
```

## 生产环境优化

### 1. 使用外部数据库

```yaml
# docker-compose.prod.yml
services:
  keycloak:
    environment:
      KC_DB_URL: jdbc:postgresql://your-rds-instance:5432/keycloak
```

### 2. 配置日志轮转

```yaml
services:
  keycloak:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 资源限制

```yaml
services:
  keycloak:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 故障排除

### 容器无法启动

```bash
# 检查日志
docker-compose logs keycloak

# 检查端口占用
netstat -tlnp | grep 8443

# 检查磁盘空间
df -h
```

### 数据库连接失败

```bash
# 检查数据库健康状态
docker-compose exec postgres pg_isready -U keycloak

# 重置数据库（会丢失数据）
docker-compose down -v
docker-compose up -d postgres
docker-compose up -d
```

## 下一步

- [Kubernetes 部署](./kubernetes) - 大规模集群部署
- [生产环境配置](./production) - 安全加固和优化
- [SSL 证书配置](./ssl) - HTTPS 详细配置
