# Keycloak + Grafana + WebAuthn/Passkey 配置指南

本仓库提供完整的 **Keycloak + Grafana + WebAuthn/Passkey** 部署配置和文档。

## 项目结构

```
.
├── docker-compose.yml          # Docker Compose 配置文件
├── .env.example                # 环境变量示例
├── scripts/
│   └── generate-certs.sh       # SSL 证书生成脚本
├── nginx/                      # Nginx 反向代理配置
│   ├── nginx.conf
│   └── conf.d/
│       ├── keycloak.conf
│       └── grafana.conf
├── grafana/                    # Grafana 配置
│   └── provisioning/
├── docs/                       # VitePress 文档
│   ├── .vitepress/
│   ├── guide/
│   └── deploy/
├── package.json                # Node.js 依赖
└── README.md                   # 本文件
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/undownding/keycloak-grafana-webauthn-wiki.git
cd keycloak-grafana-webauthn-wiki
```

### 2. 安装依赖

```bash
# 使用 bun
bun install

# 或使用 npm
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置你的域名和密码
```

### 4. 生成 SSL 证书

```bash
./scripts/generate-certs.sh
```

### 5. 启动服务

```bash
docker-compose up -d
```

### 6. 访问服务

- **Keycloak**: https://keycloak.example.com:8443
  - 默认账号: `admin` / `admin`
- **Grafana**: https://grafana.example.com
  - 通过 Keycloak OIDC 登录

## 文档

完整文档请访问：

```bash
# 本地预览
bun run docs:dev

# 构建
bun run docs:build
```

## 功能特性

- 🔐 **WebAuthn/FIDO2** - 硬件密钥认证 (YubiKey 等)
- 🔑 **Passkey** - 无密码登录支持
- 🚀 **OIDC/OAuth2** - 标准身份协议
- 🛡️ **双因素认证** - 密码 + WebAuthn
- 📊 **Grafana 集成** - 角色映射和团队同步
- 🐳 **Docker 部署** - 一键启动
- 🔒 **SSL/TLS** - HTTPS 安全传输

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 4GB 可用内存
- 域名（用于 HTTPS）

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](LICENSE)
