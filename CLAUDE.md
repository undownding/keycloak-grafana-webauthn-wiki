# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A documentation wiki (in Chinese/zh-CN) for deploying **Keycloak + Grafana + WebAuthn/Passkey** authentication systems. The repo contains:

1. **VitePress documentation site** (`docs/`) — the primary content
2. **Docker Compose infrastructure** (`docker-compose.yml`) — deployment configs for Keycloak 26.3, Grafana, PostgreSQL, Redis, Nginx
3. **Nginx reverse proxy configs** (`nginx/`)
4. **SSL cert generation script** (`scripts/generate-certs.sh`)

## Commands

```bash
# Install dependencies (bun preferred, npm also works)
bun install

# Dev server for docs
bun run docs:dev

# Build static site
bun run docs:build

# Preview built site
bun run docs:preview

# Start infrastructure
docker-compose up -d
```

## Architecture

- **Docs engine**: VitePress with config at `docs/.vitepress/config.mts`. All content is Markdown under `docs/guide/` (Keycloak, WebAuthn, Grafana integration guides) and `docs/deploy/` (Docker, K8s, SSL, reverse proxy).
- **Docker stack**: 6 services — Keycloak (with PostgreSQL), Grafana (with its own PostgreSQL + Redis for sessions), and Nginx reverse proxy. Two isolated Docker networks: `keycloak-network` and `grafana-network`.
- **Auth flow**: Keycloak serves as OIDC identity provider with WebAuthn/Passkey features enabled (`KC_FEATURES: web-authn,passkeys`). Grafana connects via Generic OAuth using OIDC. Role mapping uses JMESPath expression on JWT claims.
- **Environment config**: All secrets and hostnames are parameterized via `.env` (see `.env.example`). Docker Compose uses `${VAR:-default}` fallbacks throughout.

## Key Files

- `docs/.vitepress/config.mts` — nav/sidebar structure, site metadata
- `docs/index.md` — homepage (VitePress frontmatter layout)
- `docker-compose.yml` — full stack definition
- `.env.example` — all configurable environment variables
- `nginx/conf.d/keycloak.conf`, `nginx/conf.d/grafana.conf` — reverse proxy rules

## Conventions

- Documentation language is **Chinese (zh-CN)**. Keep all wiki content in Chinese.
- Package manager is **bun** (lockfile: `bun.lock`).
