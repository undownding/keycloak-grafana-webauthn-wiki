# 环境变量配置

本章节介绍所有可用的环境变量配置。

## Keycloak 环境变量

### 数据库配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KC_DB` | 数据库类型 | `postgres` |
| `KC_DB_URL` | 数据库连接 URL | - |
| `KC_DB_USERNAME` | 数据库用户名 | - |
| `KC_DB_PASSWORD` | 数据库密码 | - |
| `KC_DB_POOL_MIN_SIZE` | 最小连接池大小 | `5` |
| `KC_DB_POOL_MAX_SIZE` | 最大连接池大小 | `20` |

### 管理员配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KC_BOOTSTRAP_ADMIN_USERNAME` | 初始管理员用户名 | `admin` |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | 初始管理员密码 | - |

### 主机名配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KC_HOSTNAME` | Keycloak 主机名 | - |
| `KC_HOSTNAME_STRICT` | 严格主机名检查 | `false` |
| `KC_HOSTNAME_STRICT_HTTPS` | 严格 HTTPS | `false` |

### HTTP/HTTPS 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KC_HTTP_ENABLED` | 启用 HTTP | `false` |
| `KC_HTTPS_PORT` | HTTPS 端口 | `8443` |
| `KC_HTTPS_CERTIFICATE_FILE` | 证书文件路径 | - |
| `KC_HTTPS_CERTIFICATE_KEY_FILE` | 私钥文件路径 | - |

### 代理配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KC_PROXY_HEADERS` | 代理头类型 | - |
| `KC_PROXY_TRUSTED_ADDRESSES` | 可信代理地址 | - |

### 功能开关

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KC_FEATURES` | 启用功能 | - |
| `KC_FEATURES_DISABLED` | 禁用功能 | - |

### JVM 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `JAVA_OPTS` | JVM 选项 | - |
| `JAVA_OPTS_APPEND` | 追加 JVM 选项 | - |

## Grafana 环境变量

### 服务器配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_SERVER_ROOT_URL` | 根 URL | - |
| `GF_SERVER_SERVE_FROM_SUB_PATH` | 从子路径服务 | `false` |
| `GF_SERVER_HTTP_PORT` | HTTP 端口 | `3000` |

### 安全配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_SECURITY_ADMIN_USER` | 管理员用户名 | `admin` |
| `GF_SECURITY_ADMIN_PASSWORD` | 管理员密码 | `admin` |
| `GF_SECURITY_ALLOW_EMBEDDING` | 允许嵌入 | `false` |
| `GF_SECURITY_CSRF_ADDITIONAL_HEADERS` | CSRF 额外头 | - |

### 数据库配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_DATABASE_TYPE` | 数据库类型 | `sqlite` |
| `GF_DATABASE_HOST` | 数据库主机 | - |
| `GF_DATABASE_NAME` | 数据库名 | - |
| `GF_DATABASE_USER` | 数据库用户 | - |
| `GF_DATABASE_PASSWORD` | 数据库密码 | - |
| `GF_DATABASE_MAX_OPEN_CONN` | 最大连接数 | `100` |
| `GF_DATABASE_MAX_IDLE_CONN` | 最大空闲连接 | `100` |

### 会话配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_SESSION_PROVIDER` | 会话提供者 | `file` |
| `GF_SESSION_PROVIDER_CONFIG` | 会话配置 | - |
| `GF_SESSION_COOKIE_SECURE` | Cookie 安全 | `false` |
| `GF_SESSION_COOKIE_SAMESITE` | Cookie SameSite | `lax` |

### OIDC 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_AUTH_GENERIC_OAUTH_ENABLED` | 启用 OAuth | `false` |
| `GF_AUTH_GENERIC_OAUTH_NAME` | 显示名称 | - |
| `GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP` | 允许注册 | `true` |
| `GF_AUTH_GENERIC_OAUTH_CLIENT_ID` | Client ID | - |
| `GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET` | Client Secret | - |
| `GF_AUTH_GENERIC_OAUTH_SCOPES` | OAuth Scopes | - |
| `GF_AUTH_GENERIC_OAUTH_AUTH_URL` | 认证 URL | - |
| `GF_AUTH_GENERIC_OAUTH_TOKEN_URL` | Token URL | - |
| `GF_AUTH_GENERIC_OAUTH_API_URL` | API URL | - |
| `GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH` | 角色属性路径 | - |
| `GF_AUTH_GENERIC_OAUTH_ALLOW_ASSIGN_GRAFANA_ADMIN` | 允许分配管理员 | `false` |
| `GF_AUTH_GENERIC_OAUTH_USE_REFRESH_TOKEN` | 使用刷新令牌 | `false` |
| `GF_AUTH_GENERIC_OAUTH_SIGNOUT_REDIRECT_URL` | 登出重定向 URL | - |

### 日志配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_LOG_MODE` | 日志模式 | `console` |
| `GF_LOG_LEVEL` | 日志级别 | `info` |
| `GF_LOG_FILTERS` | 日志过滤器 | - |

### 监控配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GF_METRICS_ENABLED` | 启用指标 | `false` |
| `GF_METRICS_INTERVAL_SECONDS` | 指标间隔 | `10` |

## PostgreSQL 环境变量

### Keycloak 数据库

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_DB` | 数据库名 | `keycloak` |
| `POSTGRES_USER` | 用户名 | `keycloak` |
| `POSTGRES_PASSWORD` | 密码 | - |

### Grafana 数据库

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `POSTGRES_DB` | 数据库名 | `grafana` |
| `POSTGRES_USER` | 用户名 | `grafana` |
| `POSTGRES_PASSWORD` | 密码 | - |

## 完整示例

```bash
# Keycloak
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=secure_password
KC_BOOTSTRAP_ADMIN_USERNAME=admin
KC_BOOTSTRAP_ADMIN_PASSWORD=secure_admin_password
KC_HOSTNAME=keycloak.example.com
KC_HTTPS_CERTIFICATE_FILE=/opt/keycloak/conf/server.crt.pem
KC_HTTPS_CERTIFICATE_KEY_FILE=/opt/keycloak/conf/server.key.pem
KC_FEATURES=web-authn,passkeys

# Grafana
GF_SERVER_ROOT_URL=https://grafana.example.com
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=secure_password
GF_DATABASE_TYPE=postgres
GF_DATABASE_HOST=grafana-postgres:5432
GF_DATABASE_NAME=grafana
GF_DATABASE_USER=grafana
GF_DATABASE_PASSWORD=secure_password
GF_AUTH_GENERIC_OAUTH_ENABLED=true
GF_AUTH_GENERIC_OAUTH_NAME=Keycloak
GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP=true
GF_AUTH_GENERIC_OAUTH_CLIENT_ID=grafana
GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET=client_secret_here
GF_AUTH_GENERIC_OAUTH_SCOPES=openid email profile offline_access roles
GF_AUTH_GENERIC_OAUTH_AUTH_URL=https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/auth
GF_AUTH_GENERIC_OAUTH_TOKEN_URL=https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/token
GF_AUTH_GENERIC_OAUTH_API_URL=https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/userinfo
GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH="contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'"
GF_AUTH_GENERIC_OAUTH_ALLOW_ASSIGN_GRAFANA_ADMIN=true
GF_AUTH_GENERIC_OAUTH_USE_REFRESH_TOKEN=true

# PostgreSQL
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=secure_password
```

## 配置文件映射

### Keycloak

| 配置文件 | 容器路径 |
|----------|----------|
| `keycloak.conf` | `/opt/keycloak/conf/keycloak.conf` |
| 主题文件 | `/opt/keycloak/themes/` |
| 提供者 | `/opt/keycloak/providers/` |

### Grafana

| 配置文件 | 容器路径 |
|----------|----------|
| `grafana.ini` | `/etc/grafana/grafana.ini` |
| 数据源配置 | `/etc/grafana/provisioning/datasources/` |
| 仪表板配置 | `/etc/grafana/provisioning/dashboards/` |
| 插件 | `/var/lib/grafana/plugins/` |
