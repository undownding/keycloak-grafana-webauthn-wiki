# 生产环境配置

本章节介绍生产环境的安全加固和优化配置。

## 安全加固

### Keycloak 安全

#### 1. 启用 HTTPS

```bash
# 使用正式证书
keycloak start \
  --https-certificate-file=/path/to/cert.pem \
  --https-certificate-key-file=/path/to/key.pem
```

#### 2. 配置安全头

```yaml
# nginx 配置
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

#### 3. 密码策略

进入 **Authentication** → **Policies** → **Password policy**：

| 策略 | 推荐值 |
|------|--------|
| Minimum length | 12 |
| Digits | 1 |
| Lowercase characters | 1 |
| Uppercase characters | 1 |
| Special characters | 1 |
| Not recently used | 3 |
| Not username | ON |

#### 4. 会话配置

进入 **Realm settings** → **Tokens**：

| 配置项 | 推荐值 |
|--------|--------|
| SSO Session Idle | 30 分钟 |
| SSO Session Max | 8 小时 |
| Access Token Lifespan | 5 分钟 |
| Refresh Token Lifespan | 1 天 |

#### 5. 暴力破解防护

进入 **Realm settings** → **Security defenses** → **Brute force detection**：

| 配置项 | 推荐值 |
|--------|--------|
| Enabled | ON |
| Max login failures | 5 |
| Wait increment seconds | 60 |
| Max wait seconds | 900 |
| Failure reset time | 43200 |

### Grafana 安全

#### 1. 安全头配置

```ini
[security]
content_security_policy = true
content_security_policy_template = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
```

#### 2. Cookie 安全

```ini
[session]
cookie_secure = true
cookie_samesite = strict
```

#### 3. 禁用匿名访问

```ini
[auth.anonymous]
enabled = false
```

## 性能优化

### Keycloak 优化

#### 1. JVM 配置

```bash
JAVA_OPTS="-Xms2g -Xmx4g -XX:+UseG1GC -XX:MaxRAMPercentage=75.0"
```

#### 2. 数据库连接池

```bash
KC_DB_POOL_MIN_SIZE=5
KC_DB_POOL_MAX_SIZE=20
```

#### 3. 缓存配置

```yaml
# Infinispan 配置
<distributed-cache name="sessions" owners="2">
    <expiration max-idle="3600000"/>
</distributed-cache>
```

### Grafana 优化

#### 1. 数据库连接池

```ini
[database]
max_idle_conn = 10
max_open_conn = 100
conn_max_lifetime = 14400
```

#### 2. 查询缓存

```ini
[dataproxy]
logging = true
timeout = 30
dialTimeout = 10
keep_alive_seconds = 30
```

#### 3. 渲染性能

```ini
[rendering]
server_url = http://renderer:8081
callback_url = http://grafana:3000/
concurrent_render_request_limit = 10
```

## 日志和监控

### Keycloak 日志

```bash
# 启用审计日志
keycloak start --log-level=INFO,org.keycloak.events:DEBUG
```

### Grafana 日志

```ini
[log]
mode = console file
level = info
filters = oauth:debug

[log.console]
level = info

[log.file]
level = info
log_rotate = true
max_lines = 1000000
max_size_shift = 28
```

### 监控指标

#### Keycloak 指标

```yaml
# ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: keycloak
spec:
  endpoints:
  - port: management
    path: /metrics
    interval: 30s
```

#### Grafana 指标

```ini
[metrics]
enabled = true
interval_seconds = 10
```

## 备份策略

### 数据库备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/$DATE"

# Keycloak 数据库
docker-compose exec -T postgres pg_dump -U keycloak keycloak > $BACKUP_DIR/keycloak.sql

# Grafana 数据库
docker-compose exec -T grafana-postgres pg_dump -U grafana grafana > $BACKUP_DIR/grafana.sql

# Keycloak 配置
docker-compose exec -T keycloak /opt/keycloak/bin/kc.sh export --dir /tmp/export

# 压缩
tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR

# 上传到 S3
aws s3 cp $BACKUP_DIR.tar.gz s3://your-backup-bucket/keycloak-grafana/

# 清理旧备份
find /backup -name "*.tar.gz" -mtime +30 -delete
```

### 定时备份

```bash
# crontab
0 2 * * * /path/to/backup.sh
```

## 灾难恢复

### 恢复流程

1. **停止服务**
```bash
docker-compose down
```

2. **恢复数据库**
```bash
docker-compose up -d postgres
docker-compose exec -T postgres psql -U keycloak keycloak < backup/keycloak.sql
```

3. **恢复配置**
```bash
docker-compose exec -T keycloak /opt/keycloak/bin/kc.sh import --dir /tmp/export
```

4. **启动服务**
```bash
docker-compose up -d
```

## 更新策略

### 滚动更新

```yaml
# docker-compose.yml
services:
  keycloak:
    deploy:
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
```

### 数据库迁移

```bash
# 备份
docker-compose exec postgres pg_dump -U keycloak keycloak > backup.sql

# 更新镜像
docker-compose pull keycloak

# 迁移
docker-compose up -d keycloak
```

## 合规性

### GDPR 合规

1. **数据保留策略**
   - 用户数据保留 2 年
   - 日志保留 90 天

2. **数据删除**
   ```bash
   # 删除用户
   docker-compose exec keycloak /opt/keycloak/bin/kc.sh delete-user -r grafana -u username
   ```

3. **数据导出**
   ```bash
   # 导出用户数据
   docker-compose exec keycloak /opt/keycloak/bin/kc.sh export-users -r grafana
   ```

### 审计要求

1. **登录审计**
   - 记录所有登录/登出事件
   - 保留 1 年

2. **配置变更审计**
   - 记录所有配置修改
   - 保留 2 年

## 下一步

- [SSL 证书配置](./ssl) - HTTPS 详细配置
- [反向代理](./reverse-proxy) - Nginx/Traefik 配置
