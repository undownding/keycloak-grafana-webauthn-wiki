# 架构概述

## 系统架构

```mermaid
graph TD
    User([用户/浏览器]) -->|HTTPS| Nginx["反向代理 (Nginx/Traefik)\nSSL终止 + 负载均衡"]

    subgraph KC_Box ["Keycloak (身份提供商)"]
        KC["WebAuthn / Passkey\nOAuth2/OIDC / LDAP"]
        PG[(PostgreSQL\n数据存储)]
    end

    subgraph GF_Box ["Grafana (监控平台)"]
        GF["Dashboard / Alerting\nOIDC Client"]
    end

    Nginx --> KC_Box
    Nginx --> GF_Box
    GF_Box -->|OIDC/OAuth2| KC_Box
```

## 认证流程

### WebAuthn 2FA 流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Grafana
    participant Keycloak
    participant YubiKey

    User->>Grafana: 1. 访问 Grafana
    Grafana->>Keycloak: 2. 重定向到 Keycloak
    Keycloak-->>User: 3. 登录页面
    User->>Keycloak: 4. 输入用户名密码
    Keycloak-->>User: 5. 验证密码，要求 WebAuthn
    User->>YubiKey: 6. 插入/触碰 YubiKey
    YubiKey-->>Keycloak: 7. WebAuthn 签名
    Keycloak-->>Grafana: 8. 返回 Token
    Grafana-->>User: 9. 登录成功
```

### Passwordless 流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Grafana
    participant Keycloak
    participant Passkey

    User->>Grafana: 1. 访问 Grafana
    Grafana->>Keycloak: 2. 重定向到 Keycloak
    User->>Keycloak: 3. 输入用户名
    Keycloak-->>User: 4. 提示选择 Passkey
    User->>Passkey: 5. 生物识别/PIN 验证
    Passkey-->>Keycloak: 6. Passkey 断言响应
    Keycloak-->>Grafana: 7. 返回 Token
    Grafana-->>User: 8. 登录成功
```

## 组件说明

### Keycloak

- **功能**: 身份和访问管理 (IAM)
- **协议**: OAuth 2.0, OIDC, SAML, LDAP
- **特性**: WebAuthn, Passkey, 2FA, SSO
- **端口**: 8443 (HTTPS)

### Grafana

- **功能**: 监控数据可视化
- **认证**: OIDC (通过 Keycloak)
- **特性**: Dashboard, Alerting, Team Sync
- **端口**: 3000

### PostgreSQL

- **功能**: Keycloak 数据持久化
- **数据**: 用户、角色、会话、凭证

### 反向代理 (Nginx/Traefik)

- **功能**: SSL 终止、负载均衡、路由
- **SSL**: Let's Encrypt 或自签名证书

## 安全考虑

### 传输安全

- 所有通信使用 HTTPS
- TLS 1.2+
- HSTS 启用

### 认证安全

- WebAuthn 防钓鱼
- 公钥加密
- 无共享密钥

### 会话安全

- JWT Token
- 刷新令牌
- 会话超时

## 扩展性

### 水平扩展

```mermaid
graph TD
    LB[Load Balancer] --> KC1[Keycloak 1]
    LB --> KC2[Keycloak 2]
    LB --> KC3[Keycloak 3]
    KC1 & KC2 & KC3 --> DB[(PostgreSQL Cluster)]
```

### 高可用

- Keycloak 多实例
- PostgreSQL 主从复制
- 共享缓存 (Infinispan)

## 下一步

- [前置要求](./prerequisites) - 准备部署环境
- [Keycloak 配置](./keycloak) - 配置身份提供商
- [部署指南](../deploy/docker-compose) - Docker 部署
