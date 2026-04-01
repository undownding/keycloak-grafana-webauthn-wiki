# 前置要求

在开始部署之前，请确保满足以下要求。

## 系统要求

### 硬件

| 资源 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 20 GB | 50 GB SSD |
| 网络 | 100 Mbps | 1 Gbps |

### 软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Docker | 20.10+ | 容器运行时 |
| Docker Compose | 2.0+ | 编排工具 |
| OpenSSL | 1.1.1+ | SSL 证书生成 |
| Git | 2.0+ | 版本控制 |

## 域名和 DNS

### 域名要求

你需要准备以下域名：

- `keycloak.example.com` - Keycloak 身份提供商
- `grafana.example.com` - Grafana 监控平台

### DNS 配置

在你的 DNS 服务商处添加 A 记录：

```
keycloak.example.com    A    YOUR_SERVER_IP
grafana.example.com     A    YOUR_SERVER_IP
```

## SSL 证书

### 测试环境

使用自签名证书：

```bash
./scripts/generate-certs.sh
```

### 生产环境

推荐使用 Let's Encrypt：

```bash
# 使用 Certbot
certbot certonly --standalone -d keycloak.example.com -d grafana.example.com
```

## 浏览器要求

WebAuthn 需要现代浏览器支持：

| 浏览器 | 最低版本 | 说明 |
|--------|----------|------|
| Chrome | 67+ | 完全支持 |
| Firefox | 60+ | 完全支持 |
| Safari | 13+ | 完全支持 |
| Edge | 79+ | 完全支持 |

## 硬件密钥

支持的 FIDO2/WebAuthn 设备：

- **YubiKey 5 系列** - YubiKey 5 NFC, 5 Nano, 5C, 5Ci
- **YubiKey Bio 系列** - 支持指纹识别
- **其他 FIDO2 密钥** - 任何符合 FIDO2 标准的设备
- **平台认证器** - Windows Hello, Touch ID, Android 生物识别

## 网络要求

### 端口

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | HTTP | 自动重定向到 HTTPS |
| 443 | HTTPS | 主要访问端口 |
| 8443 | Keycloak HTTPS | 直接访问（可选） |
| 3000 | Grafana HTTP | 直接访问（可选） |

### 防火墙

确保以下端口对外开放：

```bash
# UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 环境准备

### 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh

# CentOS/RHEL
sudo yum install -y docker

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 安装 Docker Compose

```bash
# 使用官方安装脚本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 验证安装

```bash
docker --version
docker-compose --version
```

## 下一步

环境准备完成后，继续阅读：

- [快速开始](./getting-started) - 5 分钟快速部署
- [架构概述](./architecture) - 了解系统架构
