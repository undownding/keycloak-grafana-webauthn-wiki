# WebAuthn 配置

本章节介绍如何在 Keycloak 中配置 WebAuthn 双因素认证。

## 启用 Required Action

进入 **Authentication** → **Required actions**：

找到 **WebAuthn Register** 和 **WebAuthn Register Passwordless**：
- 启用 **Enabled**
- 可选：启用 **Set as default action**（新用户必须注册）

## 配置 Authentication Flow

### 方式一：WebAuthn 作为 2FA（推荐）

进入 **Authentication** → **Flows** → **browser**（复制并编辑）：

**创建自定义 Flow：**
1. 点击 **Copy** → 命名为 `browser-webauthn`
2. 在 **Forms** 子流程中添加：
   - **WebAuthn Authenticator**（放在 Username Password Form 之后）

**Flow 结构：**
```
browser-webauthn
├── Cookie (Alternative)
├── Kerberos (Alternative)
└── Forms (Sub-Flow)
    ├── Username Password Form (Required)
    ├── WebAuthn Authenticator (Required)  <-- 添加这一行
    └── OTP Form (Alternative)
```

**绑定 Flow：**
进入 **Authentication** → **Bindings**：
- **Browser flow**: 选择 `browser-webauthn`
- 点击 **Save**

### 方式二：Passwordless WebAuthn（无密码登录）

#### 1. 创建 Passwordless Flow

进入 **Authentication** → **Flows** → **Create flow**：

```
Name: browser-passwordless
Description: Passwordless login with WebAuthn
```

**添加执行器：**
1. **Add execution** → **Cookie** → **Alternative**
2. **Add step** → **Username Form** → **Required**
3. **Add step** → **WebAuthn Passwordless Authenticator** → **Required**

#### 2. 配置 WebAuthn Policy

进入 **Authentication** → **Policies** → **WebAuthn Passwordless Policy**：

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **Enable Passkeys** | ON | 启用 Passkey 支持 |
| **User Verification Requirement** | REQUIRED | 需要用户验证（PIN/生物识别） |
| **Require Resident Key** | ON | 需要驻留密钥 |

#### 3. 绑定 Flow

进入 **Authentication** → **Bindings**：
- **Browser flow**: 选择 `browser-passwordless`

## 用户注册 WebAuthn 凭证

### 首次登录时注册

1. 用户访问 Grafana 并点击 **Sign in with Keycloak**
2. 输入用户名密码登录 Keycloak
3. 系统提示注册 WebAuthn 凭证
4. 插入 YubiKey 或选择 Passkey
5. 按照浏览器提示完成注册
6. 返回 Grafana

### 用户自行添加（Account Console）

1. 用户登录 Keycloak Account Console：
   `https://keycloak.example.com:8443/realms/grafana/account`

2. 进入 **Signing in** → **WebAuthn** → **Set up**

3. 插入 YubiKey 或选择 Passkey

4. 输入凭证名称（如 "YubiKey 5 NFC"）

5. 完成注册

### 管理员强制注册

1. 进入 **Users** → 选择用户 → **Details**
2. **Required user actions** → 添加 **WebAuthn Register**
3. 用户下次登录时必须注册 WebAuthn

## WebAuthn Policy 配置详解

### 标准 WebAuthn Policy

进入 **Authentication** → **Policies** → **WebAuthn Policy**：

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| **Signature Algorithm** | 签名算法 | ES256 |
| **Attestation Conveyance Preference** | 认证声明偏好 | direct |
| **Authenticator Attachment** | 认证器附件 | not specified |
| **Require Resident Key** | 需要驻留密钥 | OFF |
| **User Verification Requirement** | 用户验证要求 | REQUIRED |
| **Timeout** | 超时时间（毫秒） | 60000 |

### Passwordless WebAuthn Policy

进入 **Authentication** → **Policies** → **WebAuthn Passwordless Policy**：

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| **Enable Passkeys** | 启用 Passkey 支持 | ON |
| **Require Resident Key** | 需要驻留密钥 | ON |
| **User Verification Requirement** | 用户验证要求 | REQUIRED |

## 支持的硬件密钥

- **YubiKey 5 系列** - YubiKey 5 NFC, 5 Nano, 5C, 5Ci
- **YubiKey Bio 系列** - 支持指纹识别
- **其他 FIDO2 密钥** - 任何符合 FIDO2 标准的设备
- **平台认证器** - Windows Hello, Touch ID, Android 生物识别

## 故障排除

### WebAuthn 注册失败

**症状**: 提示 "WebAuthn not supported"

**解决**:
1. 确保使用 HTTPS
2. 检查浏览器是否支持 WebAuthn
3. 确保 YubiKey 已插入

### Passkey 自动填充不工作

**症状**: 没有看到 Passkey 自动填充提示

**解决**:
1. 确保 Keycloak 版本 >= 26.3.0
2. 在 WebAuthn Passwordless Policy 中启用 **Enable Passkeys**
3. 检查浏览器是否支持 Conditional UI

## 下一步

- [FIDO2 硬件密钥](./fido2-hardware-keys) - 使用 YubiKey 等硬件密钥
- [Passkey 配置](./passkey) - 配置 Passkey 自动填充
- [Grafana 集成](./grafana) - 配置 OIDC 连接
