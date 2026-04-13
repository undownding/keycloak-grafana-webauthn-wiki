# Grafana OIDC 配置

本章节介绍如何配置 Grafana 通过 OIDC 连接 Keycloak。

## 基础配置

### 环境变量方式

```bash
# OIDC 基础配置
GF_AUTH_GENERIC_OAUTH_ENABLED=true
GF_AUTH_GENERIC_OAUTH_NAME=Keycloak
GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP=true
GF_AUTH_GENERIC_OAUTH_CLIENT_ID=grafana
GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET=your_client_secret

# OIDC 端点
GF_AUTH_GENERIC_OAUTH_AUTH_URL=https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/auth
GF_AUTH_GENERIC_OAUTH_TOKEN_URL=https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/token
GF_AUTH_GENERIC_OAUTH_API_URL=https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/userinfo

# 角色映射
GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH="contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'"
GF_AUTH_GENERIC_OAUTH_ALLOW_ASSIGN_GRAFANA_ADMIN=true

# 刷新令牌
GF_AUTH_GENERIC_OAUTH_USE_REFRESH_TOKEN=true

# 登录行为
GF_AUTH_OAUTH_AUTO_LOGIN=true
GF_AUTH_DISABLE_LOGIN_FORM=true
#GF_AUTH_DISABLE_SIGNOUT_MENU=false
```

### 配置文件方式

编辑 `grafana.ini`：

```ini
[auth.generic_oauth]
enabled = true
name = Keycloak
allow_sign_up = true
client_id = grafana
client_secret = your_client_secret
scopes = openid email profile offline_access roles

auth_url = https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/auth
token_url = https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/token
api_url = https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/userinfo

role_attribute_path = contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'
allow_assign_grafana_admin = true
use_refresh_token = true
```

## 角色映射详解

### JMESPath 语法

Grafana 使用 JMESPath 表达式从 JWT token 中提取角色：

```ini
# 基本角色映射
role_attribute_path = contains(roles[*], 'admin') && 'Admin' || 'Viewer'

# 多级角色映射
role_attribute_path = contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'
```

### 角色对应关系

| Keycloak 角色 | Grafana 角色 | 权限 |
|---------------|--------------|------|
| `grafanaadmin` | GrafanaAdmin | 服务器管理员 |
| `admin` | Admin | 组织管理员 |
| `editor` | Editor | 编辑者 |
| `viewer` | Viewer | 查看者（默认） |

### 调试角色映射

1. 获取 JWT token：
```bash
curl -X POST https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/token \
  -d "client_id=grafana" \
  -d "client_secret=SECRET" \
  -d "username=user" \
  -d "password=pass" \
  -d "grant_type=password"
```

2. 解码 token（在 https://jwt.io 粘贴 id_token）：
```json
{
  "roles": ["admin", "editor"],
  "email": "user@example.com",
  "preferred_username": "user"
}
```

## 单点登出（SSO Logout）

### 配置 Keycloak 登出

```ini
[auth.generic_oauth]
signout_redirect_url = https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/logout?post_logout_redirect_uri=https%3A%2F%2Fgrafana.example.com%2Flogin
```

### Keycloak Client 配置

1. 进入 **Clients** → **grafana** → **Settings**
2. 配置 **Valid post logout redirect URIs**：
   - `https://grafana.example.com/login`
3. 启用 **Front channel logout**

## 属性映射

### 用户名映射

```ini
[auth.generic_oauth]
login_attribute_path = preferred_username
# 或
login_attribute_path = sub
```

### 邮箱映射

```ini
[auth.generic_oauth]
email_attribute_path = email
```

### 显示名称映射

```ini
[auth.generic_oauth]
name_attribute_path = full_name
# 或组合字段
name_attribute_path = join(' ', [first_name, last_name])
```

## 高级配置

### 跳过 TLS 验证（仅测试环境）

```ini
[auth.generic_oauth]
tls_skip_verify_insecure = true
```

### 自定义登录按钮

```ini
[auth.generic_oauth]
name = "使用 Keycloak 登录"
icon = signin
```

### 自动登录

环境变量方式：

```bash
GF_AUTH_OAUTH_AUTO_LOGIN=true
```

配置文件方式：

```ini
[auth]
oauth_auto_login = true
```

### 禁用本地登录

启用 OIDC 单点登录后，可以禁用 Grafana 原生的用户名/密码登录表单，强制所有用户通过 Keycloak 认证。

环境变量方式：

```bash
GF_AUTH_DISABLE_LOGIN_FORM=true
GF_AUTH_DISABLE_SIGNOUT_MENU=false
```

配置文件方式：

```ini
[auth]
disable_login_form = true
disable_signout_menu = false
```

::: tip 提示
`disable_login_form` 设置为 `true` 后，登录页面将不再显示用户名/密码输入框，仅保留 OAuth 登录按钮。建议配合 `oauth_auto_login = true` 使用，实现完全无感的单点登录体验。
:::

## 验证配置

### 1. 重启 Grafana

```bash
docker-compose restart grafana
```

### 2. 检查日志

```bash
docker-compose logs grafana | grep -i oauth
```

### 3. 测试登录

1. 访问 Grafana 登录页面
2. 点击 "Sign in with Keycloak"
3. 重定向到 Keycloak 登录页面
4. 完成 WebAuthn/Passkey 认证
5. 返回 Grafana 并检查角色

## 故障排除

### "invalid_client" 错误

**原因**: Client Secret 不正确

**解决**:
1. 在 Keycloak 中重新生成 Client Secret
2. 更新 Grafana 配置
3. 重启 Grafana

### "invalid_redirect_uri" 错误

**原因**: 回调 URL 不匹配

**解决**:
1. 检查 Keycloak Client 的 **Valid redirect URIs**
2. 确保包含 `https://grafana.example.com/login/generic_oauth`

### 角色映射不生效

**原因**: JMESPath 表达式错误或 token 中无角色信息

**解决**:
1. 检查 Keycloak Mapper 配置
2. 验证 JWT token 内容
3. 调整 role_attribute_path 表达式

## 下一步

- [角色映射](./role-mapping) - 更详细的角色配置
- [团队同步](./team-sync) - Grafana Enterprise 团队同步
