# 用户管理

本章节介绍 Keycloak 中的用户管理操作。

## 创建用户

### 手动创建

1. 进入 **Users** → **Add user**
2. 填写用户信息：
   - **Username**: 用户名（必填）
   - **Email**: 邮箱地址
   - **First name**: 名字
   - **Last name**: 姓氏
3. 点击 **Create**

### 批量导入

1. 准备 JSON 文件：
```json
[
  {
    "username": "user1",
    "email": "user1@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "enabled": true,
    "credentials": [
      {
        "type": "password",
        "value": "tempPassword123",
        "temporary": true
      }
    ]
  }
]
```

2. 进入 **Users** → **Import user**
3. 上传 JSON 文件

## 设置密码

### 临时密码

1. 进入用户详情 → **Credentials** → **Set password**
2. 输入密码
3. 开启 **Temporary** 开关
4. 用户首次登录时需要修改密码

### 永久密码

1. 进入用户详情 → **Credentials** → **Set password**
2. 输入密码
3. 关闭 **Temporary** 开关

### 密码策略

进入 **Authentication** → **Policies** → **Password policy**：

| 策略 | 说明 |
|------|------|
| **Minimum length** | 最小长度 |
| **Digits** | 必须包含数字 |
| **Lowercase characters** | 必须包含小写字母 |
| **Uppercase characters** | 必须包含大写字母 |
| **Special characters** | 必须包含特殊字符 |
| **Not recently used** | 不能重复使用近期密码 |

## 分配角色

### Realm 角色

1. 进入用户详情 → **Role mapping** → **Assign role**
2. 选择要分配的角色（如 `admin`, `editor`, `viewer`）
3. 点击 **Assign**

### Client 角色

1. 进入用户详情 → **Role mapping**
2. 切换到 **Filter by clients**
3. 选择 Client 和对应角色

## 管理 WebAuthn 凭证

### 查看凭证

1. 进入用户详情 → **Credentials**
2. 查看 **WebAuthn credentials** 部分

### 删除凭证

1. 找到要删除的 WebAuthn 凭证
2. 点击 **Delete**
3. 确认删除

### 强制注册新凭证

1. 进入用户详情 → **Details**
2. **Required user actions** → 添加 **WebAuthn Register**
3. 用户下次登录时需要注册新的 WebAuthn 凭证

## 用户组管理

### 创建组

1. 进入 **Groups** → **Create group**
2. 输入组名（如 `grafana-admins`）
3. 点击 **Create**

### 添加用户到组

1. 进入组详情 → **Members** → **Add member**
2. 选择要添加的用户
3. 点击 **Add**

### 组角色映射

1. 进入组详情 → **Role mapping** → **Assign role**
2. 选择要分配给组的角色
3. 组内所有用户自动继承这些角色

## 用户导入/导出

### 导出用户

```bash
# 使用 Keycloak Admin CLI
/opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm grafana \
  --users same_file
```

### 导入用户

```bash
# 使用 Keycloak Admin CLI
/opt/keycloak/bin/kc.sh import \
  --dir /tmp/export
```

## 用户自助服务

### 启用用户注册

1. 进入 **Realm settings** → **Login**
2. 启用 **User registration**
3. 配置 **Default roles**（新用户自动分配的角色）

### 启用密码重置

1. 进入 **Realm settings** → **Login**
2. 启用 **Forgot password**
3. 配置 SMTP（邮件发送）

### Account Console

用户可以通过 Account Console 自助管理：
- URL: `https://keycloak.example.com:8443/realms/grafana/account`
- 功能：修改密码、管理 WebAuthn 凭证、查看会话等

## 会话管理

### 查看用户会话

1. 进入用户详情 → **Sessions**
2. 查看当前活跃的会话列表

### 注销用户

1. 进入用户详情 → **Sessions**
2. 点击 **Logout all sessions**

### 会话超时配置

进入 **Realm settings** → **Tokens**：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| **SSO Session Idle** | 30 分钟 | 会话空闲超时 |
| **SSO Session Max** | 10 小时 | 会话最大时长 |
| **Access Token Lifespan** | 5 分钟 | Access Token 有效期 |
| **Refresh Token Lifespan** | 30 天 | Refresh Token 有效期 |

## 审计日志

### 启用事件记录

1. 进入 **Events** → **Config**
2. 启用 **Save events**
3. 配置 **Expiration**（事件保留时间）

### 查看事件

1. 进入 **Events** → **User events**
2. 查看用户相关事件（登录、登出、密码修改等）

### 事件类型

| 事件类型 | 说明 |
|----------|------|
| **LOGIN** | 用户登录 |
| **LOGOUT** | 用户登出 |
| **REGISTER** | 用户注册 |
| **UPDATE_PASSWORD** | 密码修改 |
| **UPDATE_EMAIL** | 邮箱修改 |
| **UPDATE_PROFILE** | 资料修改 |

## 下一步

- [Grafana 集成](./grafana) - 配置 OIDC 连接
- [角色映射](./role-mapping) - 详细角色配置
