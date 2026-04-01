# Keycloak 基础配置

本章节介绍 Keycloak 的基础配置步骤。

## 创建 Realm

1. 登录 Keycloak Admin Console
2. 点击左上角下拉菜单 → **Create realm**
3. 输入 Realm 名称：`grafana`
4. 点击 **Create**

## 创建角色

进入 **Realm Roles** → **Create role**：

| 角色名 | 说明 |
|--------|------|
| `admin` | Grafana 管理员 |
| `editor` | Grafana 编辑者 |
| `viewer` | Grafana 查看者 |
| `grafanaadmin` | Grafana 服务器管理员（可选） |

## 创建用户

进入 **Users** → **Add user**：

```
Username: john.doe
Email: john.doe@example.com
First name: John
Last name: Doe
```

### 设置密码

- 进入用户详情 → **Credentials** → **Set password**
- 输入临时密码
- 关闭 **Temporary** 开关（如果需要永久密码）

### 分配角色

- **Role mapping** → **Assign role** → 选择 `admin` 或其他角色

## 创建 Client

进入 **Clients** → **Create client**：

**General settings：**
- **Client type**: OpenID Connect
- **Client ID**: `grafana`
- **Name**: Grafana OAuth
- **Description**: Grafana Dashboard

**Capability config：**
- **Client authentication**: ON
- **Authorization**: OFF
- **Standard flow**: ON
- **Direct access grants**: ON
- **Service accounts roles**: OFF

**Login settings：**
- **Root URL**: `https://grafana.example.com`
- **Home URL**: `https://grafana.example.com`
- **Valid redirect URIs**: `https://grafana.example.com/login/generic_oauth`
- **Valid post logout redirect URIs**: `https://grafana.example.com/login`
- **Web origins**: `https://grafana.example.com`

点击 **Save**

## 获取 Client Secret

进入 **Credentials** 标签页：
- **Client Authenticator**: Client Id and Secret
- 复制 **Client secret** 值（用于 Grafana 配置）

## 配置 Client Scopes

进入 **Client scopes** 标签页：

**Assigned Default Client Scopes：**
- email
- offline_access
- profile
- roles

## 添加 Mappers

### 角色映射器

进入 **Mappers** → **Add mapper** → **By configuration** → **User Realm Role**：

```
Name: Realm Roles
Mapper Type: User Realm Role
Token Claim Name: roles
Multivalued: ON
Add to ID token: ON
Add to access token: ON
Add to userinfo: ON
```

### 组映射器（可选，用于团队同步）

```
Name: Group Mapper
Mapper Type: Group Membership
Token Claim Name: groups
Full group path: OFF
Add to ID token: ON
Add to access token: OFF
Add to userinfo: ON
```

## 下一步

- [WebAuthn 设置](./webauthn) - 配置硬件密钥认证
- [Grafana 集成](./grafana) - 配置 OIDC 连接
