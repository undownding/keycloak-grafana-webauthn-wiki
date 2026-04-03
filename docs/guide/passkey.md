# Passkey 配置

本章节介绍如何在 Keycloak 中配置 Passkey 无密码登录。

## 什么是 Passkey

Passkey 是基于 FIDO2/WebAuthn 标准的无密码认证方式，支持：
- 跨设备同步（iCloud Keychain、Google Password Manager 等）
- 生物识别验证（指纹、面部识别）
- 防钓鱼攻击

## 前提条件

- Keycloak 版本 >= 26.3.0
- 启用 HTTPS
- 现代浏览器支持（Chrome 108+, Safari 16+, Edge 108+）

## 启用 Passkey

### 1. 配置 WebAuthn Passwordless Policy

进入 **Authentication** → **Policies** → **WebAuthn Passwordless Policy**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Enable Passkeys** | ON | 启用 Passkey 支持 |
| **Require Resident Key** | ON | 需要驻留密钥（discoverable credentials） |
| **User Verification Requirement** | REQUIRED | 需要用户验证 |

### 2. 创建 Passkey Authentication Flow

进入 **Authentication** → **Flows** → **Create flow**：

```
Name: browser-passkey
Description: Passkey authentication with Conditional UI
```

**添加执行器：**

1. **Add execution** → **Cookie** → **Alternative**
2. **Add execution** → **Passkey Conditional UI Authenticator** → **Alternative**
3. **Add step** → **Username Form** → **Required**
4. **Add step** → **WebAuthn Passwordless Authenticator** → **Required**

**Flow 结构：**
```
browser-passkey
├── Cookie (Alternative)
├── Passkey Conditional UI Authenticator (Alternative)  <-- 自动填充
├── Username Form (Required)
└── WebAuthn Passwordless Authenticator (Required)
```

### 3. 绑定 Flow

进入 **Authentication** → **Bindings**：
- **Browser flow**: 选择 `browser-passkey`
- 点击 **Save**

## Passkey 自动填充（Conditional UI）

### 工作原理

当用户在登录页面点击用户名输入框时，浏览器会自动提示可用的 Passkey：

```
┌─────────────────────────────────────┐
│  用户名: [________________] ▼       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔑 使用 Passkey 登录         │   │
│  │    iCloud Keychain           │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 浏览器支持

| 浏览器 | 最低版本 | 支持平台 |
|--------|----------|----------|
| Chrome | 108+ | Windows, macOS, Android |
| Safari | 16+ | macOS, iOS |
| Edge | 108+ | Windows, macOS |
| Firefox | 122+ | Windows, macOS |

## 用户注册 Passkey

### 方式一：首次登录时注册

1. 用户访问 Grafana 并点击 **Sign in with Keycloak**
2. 输入用户名
3. 系统提示创建 Passkey
4. 使用生物识别验证（指纹/面部识别）
5. Passkey 创建成功，自动登录

### 方式二：通过 Account Console 注册

1. 访问 `https://keycloak.example.com:8443/realms/grafana/account`
2. 进入 **Signing in** → **Passkey** → **Set up**
3. 选择 "创建 Passkey"
4. 按照浏览器提示完成注册

### 方式三：管理员强制注册

1. 进入 **Users** → 选择用户 → **Details**
2. **Required user actions** → 添加 **WebAuthn Register Passwordless**
3. 用户下次登录时必须注册 Passkey

## 管理 Passkey

### 查看用户 Passkey

1. 进入 **Users** → 选择用户
2. **Credentials** 标签页
3. 查看 **WebAuthn credentials** 列表

### 删除 Passkey

1. 在 **Credentials** 标签页找到 WebAuthn 凭证
2. 点击 **Delete** 删除特定凭证
3. 或点击 **Delete all credentials** 删除所有凭证

## 混合认证配置

### 同时支持密码和 Passkey

创建 Flow：

```
browser-hybrid
├── Cookie (Alternative)
├── Passkey Conditional UI Authenticator (Alternative)
└── Forms (Sub-Flow)
    ├── Username Password Form (Required)
    └── WebAuthn Authenticator (Alternative)  <-- 可选的 2FA
```

### 仅支持 Passkey（最高安全性）

```
browser-passwordless-only
├── Cookie (Alternative)
├── Passkey Conditional UI Authenticator (Alternative)
├── Username Form (Required)
└── WebAuthn Passwordless Authenticator (Required)
```

**注意**: 此配置下用户无法使用密码登录，请确保所有用户都已注册 Passkey。

## 故障排除

### Passkey 自动填充不出现

**检查清单**:
1. ✅ Keycloak 版本 >= 26.3.0
2. ✅ WebAuthn Passwordless Policy 中 **Enable Passkeys** = ON
3. ✅ Flow 中包含 **Passkey Conditional UI Authenticator**
4. ✅ 用户已注册 Passkey
5. ✅ 浏览器支持 Conditional UI
6. ✅ 使用 HTTPS

### 跨设备同步问题

**iCloud Keychain**: 
- 确保 Apple ID 已登录
- 设置 → Apple ID → iCloud → 密码与钥匙串 → 开启

**Google Password Manager**:
- Chrome 设置 → 自动填充 → 密码管理器
- 确保已登录 Google 账号

**Windows Hello**:
- 设置 → 账户 → 登录选项 → Windows Hello

### 生物识别验证失败

**解决**:
1. 确保设备支持生物识别
2. 在系统设置中注册指纹/面部识别
3. 重新创建 Passkey

## 安全建议

1. **启用 User Verification**: 始终要求生物识别或 PIN
2. **配置备份认证方式**: 防止设备丢失导致无法登录
3. **定期审核凭证**: 检查并删除不再使用的 Passkey
4. **启用审计日志**: 监控 Passkey 注册和使用情况

## 下一步

- [FIDO2 硬件密钥](./fido2-hardware-keys) - 使用 YubiKey 等硬件密钥
- [用户管理](./user-management) - 管理用户和凭证
- [Grafana 集成](./grafana) - 配置 OIDC 连接
