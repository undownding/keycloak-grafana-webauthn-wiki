import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "Keycloak + Grafana WebAuthn",
  description: "Keycloak + Grafana + WebAuthn/Passkey 完整配置指南",
  lang: 'zh-CN',
  lastUpdated: true,
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { 
        text: '指南', 
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '架构概述', link: '/guide/architecture' },
          { text: '前置要求', link: '/guide/prerequisites' },
          { text: 'Keycloak 基础配置', link: '/guide/keycloak' },
          { text: 'WebAuthn 设置', link: '/guide/webauthn' },
          { text: 'Passkey 配置', link: '/guide/passkey' },
          { text: 'FIDO2 硬件密钥', link: '/guide/fido2-hardware-keys' },
          { text: '用户管理', link: '/guide/user-management' },
          { text: 'Grafana OIDC 配置', link: '/guide/grafana' },
          { text: '角色映射', link: '/guide/role-mapping' },
          { text: '团队同步', link: '/guide/team-sync' },
          { text: '安全加固', link: '/guide/security' },
          { text: '高可用部署', link: '/guide/ha-deployment' },
          { text: '备份恢复', link: '/guide/backup-restore' }
        ]
      },
      { 
        text: '部署', 
        items: [
          { text: 'Docker Compose', link: '/deploy/docker-compose' },
          { text: 'Kubernetes', link: '/deploy/kubernetes' },
          { text: '生产环境', link: '/deploy/production' },
          { text: '环境变量', link: '/deploy/environment' },
          { text: 'SSL 证书', link: '/deploy/ssl' },
          { text: '反向代理', link: '/deploy/reverse-proxy' }
        ]
      },
      { text: '故障排除', link: '/troubleshooting' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '架构概述', link: '/guide/architecture' },
            { text: '前置要求', link: '/guide/prerequisites' }
          ]
        },
        {
          text: 'Keycloak 配置',
          items: [
            { text: '基础配置', link: '/guide/keycloak' },
            { text: 'WebAuthn 设置', link: '/guide/webauthn' },
            { text: 'Passkey 配置', link: '/guide/passkey' },
            { text: 'FIDO2 硬件密钥', link: '/guide/fido2-hardware-keys' },
            { text: '用户管理', link: '/guide/user-management' }
          ]
        },
        {
          text: 'Grafana 集成',
          items: [
            { text: 'OIDC 配置', link: '/guide/grafana' },
            { text: '角色映射', link: '/guide/role-mapping' },
            { text: '团队同步', link: '/guide/team-sync' }
          ]
        },
        {
          text: '高级',
          items: [
            { text: '安全加固', link: '/guide/security' },
            { text: '高可用部署', link: '/guide/ha-deployment' },
            { text: '备份恢复', link: '/guide/backup-restore' }
          ]
        }
      ],
      '/deploy/': [
        {
          text: '部署',
          items: [
            { text: 'Docker Compose', link: '/deploy/docker-compose' },
            { text: 'Kubernetes', link: '/deploy/kubernetes' },
            { text: '生产环境', link: '/deploy/production' }
          ]
        },
        {
          text: '配置',
          items: [
            { text: '环境变量', link: '/deploy/environment' },
            { text: 'SSL 证书', link: '/deploy/ssl' },
            { text: '反向代理', link: '/deploy/reverse-proxy' }
          ]
        }
      ],
      '/troubleshooting': [
        {
          text: '故障排除',
          items: [
            { text: '常见问题', link: '/troubleshooting' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/undownding/keycloak-grafana-webauthn-wiki' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024'
    },

    editLink: {
      pattern: 'https://github.com/undownding/keycloak-grafana-webauthn-wiki/edit/main/docs/:path'
    },

    search: {
      provider: 'local'
    }
  }
}))

