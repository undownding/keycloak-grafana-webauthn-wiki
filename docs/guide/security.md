# 安全加固

本章节介绍 Keycloak 和 Grafana 的安全加固配置。

## Keycloak 安全加固

### 1. 启用 HTTPS

生产环境必须启用 HTTPS：

```bash
keycloak start \
  --https-certificate-file=/path/to/cert.pem \
  --https-certificate-key-file=/path/to/key.pem
```

### 2. 密码策略

进入 **Authentication** → **Policies** → **Password policy**：

| 策略 | 推荐值 | 说明 |
|------|--------|------|
| Minimum length | 12 | 最小长度 |
| Digits | 1 | 至少 1 个数字 |
| Lowercase characters | 1 | 至少 1 个小写字母 |
| Uppercase characters | 1 | 至少 1 个大写字母 |
| Special characters | 1 | 至少 1 个特殊字符 |
| Not recently used | 3 | 不能重复使用最近 3 次密码 |
| Not username | ON | 密码不能包含用户名 |
| Not email | ON | 密码不能包含邮箱 |
| Hashing algorithm | pbkdf2-sha256 | 哈希算法 |

### 3. 会话安全

进入 **Realm settings** → **Tokens**：

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| SSO Session Idle | 30 分钟 | 会话空闲超时 |
| SSO Session Max | 8 小时 | 会话最大时长 |
| Access Token Lifespan | 5 分钟 | Access Token 有效期 |
| Refresh Token Lifespan | 1 天 | Refresh Token 有效期 |
| Revoke refresh token | ON | 使用后撤销 Refresh Token |

### 4. 暴力破解防护

进入 **Realm settings** → **Security defenses** → **Brute force detection**：

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| Enabled | ON | 启用暴力破解检测 |
| Max login failures | 5 | 最大登录失败次数 |
| Wait increment seconds | 60 | 等待时间增量 |
| Max wait seconds | 900 | 最大等待时间（15分钟） |
| Failure reset time | 43200 | 失败计数重置时间（12小时） |
| Permanent lockout | OFF | 禁用永久锁定（可选） |

### 5. 安全头配置

通过反向代理添加安全头：

```nginx
# Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

### 6. 审计日志

启用事件记录：

1. 进入 **Events** → **Config**
2. 启用 **Save events**
3. 配置 **Expiration**: 90 天

记录的事件类型：
- LOGIN - 登录
- LOGOUT - 登出
- REGISTER - 注册
- UPDATE_PASSWORD - 密码更新
- UPDATE_EMAIL - 邮箱更新
- UPDATE_PROFILE - 资料更新
- REMOVE_FEDERATED_IDENTITY - 移除联邦身份
- REMOVE_TOTP - 移除 TOTP
- GRANT_CONSENT - 授权同意
- UPDATE_CONSENT - 更新同意
- REVOKE_GRANT - 撤销授权

### 7. 客户端安全

#### 客户端访问类型

- **confidential**: 需要客户端密钥（推荐用于 Web 应用）
- **public**: 不需要客户端密钥（用于 SPA、移动应用）
- **bearer-only**: 仅接受 Bearer Token（用于服务）

#### 安全设置

| 设置 | 推荐值 | 说明 |
|------|--------|------|
| Client authentication | ON | 启用客户端认证 |
| Authorization | 按需 | 启用细粒度授权 |
| Standard flow | ON | 标准 OIDC 流程 |
| Implicit flow | OFF | 禁用隐式流程（不安全） |
| Direct access grants | 按需 | 直接访问授权 |
| Service accounts | 按需 | 服务账号 |

#### 重定向 URI 限制

严格限制有效的重定向 URI：

```
Valid redirect URIs:
- https://grafana.example.com/login/generic_oauth
- https://app.example.com/callback

Valid post logout redirect URIs:
- https://grafana.example.com/login
- https://app.example.com/logout
```

### 8. 用户安全配置

#### 必需操作

为用户设置必需的安全操作：

1. 进入 **Users** → 选择用户 → **Details**
2. **Required user actions**:
   - Update Password（更新密码）
   - Verify Email（验证邮箱）
   - Configure OTP（配置 OTP）
   - WebAuthn Register（注册 WebAuthn）

#### 用户属性

设置用户安全属性：

```
# 禁用用户
enabled: false

# 邮箱验证
emailVerified: true

# 必需操作
requiredActions: ["UPDATE_PASSWORD", "VERIFY_EMAIL"]
```

## Grafana 安全加固

### 1. 认证配置

```ini
[auth]
# 禁用匿名访问
disable_login_form = false
disable_signout_menu = false

# 允许 OAuth 自动登录
oauth_auto_login = false

# 禁用用户注册（通过 Keycloak 管理）
[auth.generic_oauth]
allow_sign_up = true
```

### 2. Cookie 安全

```ini
[session]
# 仅通过 HTTPS 传输 Cookie
cookie_secure = true

# SameSite 属性
cookie_samesite = strict

# Cookie 名称
cookie_name = grafana_session
```

### 3. 安全头

```ini
[security]
# 内容安全策略
content_security_policy = true
content_security_policy_template = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';"

# 禁用嵌入
allow_embedding = false

# 严格传输安全
strict_transport_security = true
strict_transport_security_max_age_seconds = 31536000
strict_transport_security_preload = true
strict_transport_security_subdomains = true

# X-Content-Type-Options
x_content_type_options = true

# X-XSS-Protection
x_xss_protection = true
```

### 4. 数据库安全

```ini
[database]
# 使用 SSL 连接
type = postgres
ssl_mode = require

# 连接池配置
max_idle_conn = 10
max_open_conn = 100
conn_max_lifetime = 14400
```

### 5. API 安全

```ini
[api]
# 启用 API 密钥
key = true

# 限制 API 访问
[auth.proxy]
enabled = false

[auth.basic]
enabled = false
```

### 6. 快照和共享

```ini
[snapshots]
# 禁用外部快照
external_enabled = false

[public_dashboards]
# 禁用公开仪表板
enabled = false
```

### 7. 文件系统安全

```ini
[paths]
# 数据目录
data = /var/lib/grafana

# 插件目录
plugins = /var/lib/grafana/plugins

# 配置目录
provisioning = /etc/grafana/provisioning
```

设置正确的权限：

```bash
chown -R grafana:grafana /var/lib/grafana
chmod 750 /var/lib/grafana
chmod 640 /etc/grafana/grafana.ini
```

## 网络安全

### 1. 防火墙规则

```bash
# 仅开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

sudo ufw enable
```

### 2. 网络隔离

使用 Docker 网络隔离：

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 内部网络，不暴露到外部

services:
  keycloak:
    networks:
      - frontend
      - backend
  
  postgres:
    networks:
      - backend  # 仅内部网络
```

### 3. 反向代理安全

```nginx
# 限制请求大小
client_max_body_size 10m;

# 限制请求速率
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
limit_req zone=auth burst=10 nodelay;

# 隐藏版本信息
server_tokens off;
```

## 监控和告警

### 1. 登录监控

配置 Keycloak 事件监听器：

```java
// 自定义事件监听器
public class SecurityEventListener implements EventListenerProvider {
    @Override
    public void onEvent(Event event) {
        if (event.getType() == EventType.LOGIN_ERROR) {
            // 发送告警
            alertService.send("Login failed: " + event.getUserId());
        }
    }
}
```

### 2. 异常检测

使用 Grafana 监控异常登录：

```sql
-- 查询失败登录
SELECT 
    time,
    user_id,
    ip_address,
    error
FROM keycloak_events
WHERE type = 'LOGIN_ERROR'
  AND time > now() - interval '1 hour'
ORDER BY time DESC;
```

### 3. 告警规则

```yaml
# Prometheus 告警规则
groups:
  - name: security
    rules:
      - alert: HighLoginFailureRate
        expr: rate(keycloak_login_failures_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High login failure rate detected"
          
      - alert: UnauthorizedAccess
        expr: increase(keycloak_admin_login_failures_total[1h]) > 5
        for: 0m
        labels:
          severity: critical
```

## 安全审计清单

### 部署前检查

- [ ] 启用 HTTPS
- [ ] 配置强密码策略
- [ ] 启用暴力破解防护
- [ ] 配置会话超时
- [ ] 限制重定向 URI
- [ ] 禁用不必要功能
- [ ] 配置安全头
- [ ] 启用审计日志
- [ ] 配置防火墙
- [ ] 设置文件权限

### 定期审计

- [ ] 检查用户权限
- [ ] 审查审计日志
- [ ] 更新 SSL 证书
- [ ] 更新软件版本
- [ ] 检查安全公告
- [ ] 测试备份恢复
- [ ] 审查客户端配置

## 下一步

- [高可用部署](./ha-deployment) - 大规模部署方案
- [备份恢复](./backup-restore) - 数据备份和恢复
