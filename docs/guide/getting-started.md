# 快速开始

本指南帮助您在 5 分钟内快速部署 Keycloak + Grafana + WebAuthn 环境。

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 4GB 可用内存
- 域名（用于 HTTPS）

## 一键部署

### 1. 克隆项目

```bash
git clone https://github.com/undownding/keycloak-grafana-webauthn-wiki.git
cd keycloak-grafana-webauthn-wiki
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置你的域名和密码
```

### 3. 生成 SSL 证书

```bash
./scripts/generate-certs.sh
```

### 4. 启动服务

```bash
docker-compose up -d
```

### 5. 访问服务

| 服务 | URL | 默认账号 |
|------|-----|----------|
| Keycloak | https://keycloak.example.com:8443 | admin / admin |
| Grafana | https://grafana.example.com | 通过 Keycloak 登录 |

## 初始配置

### 配置 Keycloak

1. 登录 Keycloak Admin Console
2. 创建 Realm: `grafana`
3. 创建 Client: `grafana`
4. 配置 WebAuthn Policy

详见 [Keycloak 配置](./keycloak)

### 配置 Grafana

1. 编辑 `grafana/grafana.ini`
2. 配置 OIDC 参数
3. 重启 Grafana

详见 [Grafana 集成](./grafana)

## 注册 WebAuthn 凭证

1. 访问 Keycloak Account Console
2. 进入 **Signing in** → **WebAuthn**
3. 插入 YubiKey 或选择 Passkey
4. 完成注册

## 下一步

- [架构概述](./architecture) - 了解系统架构
- [详细配置](./keycloak) - 完整的 Keycloak 配置
- [故障排除](../troubleshooting) - 常见问题解决
