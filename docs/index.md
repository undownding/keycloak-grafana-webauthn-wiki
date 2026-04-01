# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Keycloak + Grafana"
  text: "WebAuthn/Passkey 配置指南"
  tagline: 完整的企业级身份认证与监控系统部署文档
  image:
    src: /logo.svg
    alt: Keycloak Grafana WebAuthn
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 架构概述
      link: /guide/architecture
    - theme: alt
      text: GitHub
      link: https://github.com/undownding/keycloak-grafana-webauthn-wiki

features:
  - icon: 🔐
    title: WebAuthn/Passkey 支持
    details: 完整的 YubiKey 和 Passkey 配置指南，支持无密码登录和双因素认证
  - icon: 🚀
    title: 一键部署
    details: 提供 Docker Compose 配置文件，快速搭建生产级环境
  - icon: 📊
    title: Grafana 集成
    details: 详细的 OIDC OAuth2 配置，支持角色映射和团队同步
  - icon: 🛡️
    title: 企业级安全
    details: 包含 HTTPS 配置、安全加固、审计日志等最佳实践
  - icon: 📖
    title: 详细文档
    details: 从基础概念到高级配置，覆盖部署全流程
  - icon: 🔧
    title: 故障排除
    details: 常见问题解决方案和调试技巧

---

## 项目简介

本项目提供 **Keycloak + Grafana + WebAuthn/Passkey** 的完整配置指南，帮助您：

- 🔐 实现基于硬件密钥的企业级身份认证
- 📊 构建安全的监控可视化平台
- 🚀 使用 Docker 快速部署生产环境
- 🛡️ 遵循安全最佳实践

## 快速导航

| 章节 | 内容 |
|------|------|
| [快速开始](/guide/getting-started) | 5 分钟快速部署 |
| [架构设计](/guide/architecture) | 系统架构和认证流程 |
| [Keycloak 配置](/guide/keycloak) | 身份提供商详细配置 |
| [Grafana 集成](/guide/grafana) | 监控平台 OIDC 配置 |
| [WebAuthn 设置](/guide/webauthn) | 硬件密钥和 Passkey 配置 |
| [部署指南](/deploy/docker-compose) | Docker 生产部署 |
| [故障排除](/troubleshooting) | 常见问题解决 |

## 技术栈

- **Keycloak** - 开源身份和访问管理
- **Grafana** - 开源监控可视化平台
- **WebAuthn/FIDO2** - W3C 标准无密码认证
- **Docker** - 容器化部署
- **VitePress** - 静态文档站点

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件
