# Kubernetes 部署

使用 Kubernetes 部署 Keycloak + Grafana + WebAuthn 环境。

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                      Ingress Controller                  │
│                    (Nginx/Traefik)                       │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────┐      ┌─────────────────────┐
│    Keycloak         │      │      Grafana        │
│   (Deployment)      │      │    (Deployment)     │
│                     │      │                     │
│  ┌───────────────┐  │      │  ┌───────────────┐  │
│  │   Keycloak    │  │      │  │    Grafana    │  │
│  │    Pods       │  │      │  │     Pods      │  │
│  │   (x2)        │  │      │  │    (x2)       │  │
│  └───────────────┘  │      │  └───────────────┘  │
│                     │      │                     │
└──────────┬──────────┘      └──────────┬──────────┘
           │                            │
           ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐
│   PostgreSQL        │      │   PostgreSQL        │
│  (StatefulSet)      │      │  (StatefulSet)      │
│                     │      │                     │
│  ┌───────────────┐  │      │  ┌───────────────┐  │
│  │  Keycloak DB  │  │      │  │  Grafana DB   │  │
│  │   (Primary)   │  │      │  │   (Primary)   │  │
│  └───────────────┘  │      │  └───────────────┘  │
└─────────────────────┘      └─────────────────────┘
```

## 前置要求

- Kubernetes 1.24+
- kubectl
- Helm 3.0+
- Ingress Controller (Nginx/Traefik)
- cert-manager（用于自动 SSL 证书）

## 部署步骤

### 1. 创建 Namespace

```bash
kubectl create namespace auth
kubectl create namespace monitoring
```

### 2. 部署 PostgreSQL

```yaml
# postgres-keycloak.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: keycloak-postgres
  namespace: auth
spec:
  serviceName: keycloak-postgres
  replicas: 1
  selector:
    matchLabels:
      app: keycloak-postgres
  template:
    metadata:
      labels:
        app: keycloak-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: keycloak
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: keycloak-db-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keycloak-db-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak-postgres
  namespace: auth
spec:
  selector:
    app: keycloak-postgres
  ports:
  - port: 5432
    targetPort: 5432
```

创建 Secret：

```bash
kubectl create secret generic keycloak-db-secret \
  --namespace auth \
  --from-literal=username=keycloak \
  --from-literal=password=$(openssl rand -base64 32)
```

部署：

```bash
kubectl apply -f postgres-keycloak.yaml
```

### 3. 部署 Keycloak

```yaml
# keycloak.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: auth
spec:
  replicas: 2
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:26.3.0
        args: ["start"]
        env:
        - name: KC_DB
          value: postgres
        - name: KC_DB_URL
          value: jdbc:postgresql://keycloak-postgres:5432/keycloak
        - name: KC_DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: keycloak-db-secret
              key: username
        - name: KC_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keycloak-db-secret
              key: password
        - name: KC_BOOTSTRAP_ADMIN_USERNAME
          valueFrom:
            secretKeyRef:
              name: keycloak-admin-secret
              key: username
        - name: KC_BOOTSTRAP_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: keycloak-admin-secret
              key: password
        - name: KC_HOSTNAME
          value: keycloak.example.com
        - name: KC_PROXY_HEADERS
          value: xforwarded
        - name: KC_HTTP_ENABLED
          value: "true"
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9000
          name: management
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 9000
          initialDelaySeconds: 60
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health/live
            port: 9000
          initialDelaySeconds: 60
          periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  namespace: auth
spec:
  selector:
    app: keycloak
  ports:
  - port: 8080
    targetPort: 8080
    name: http
  - port: 9000
    targetPort: 9000
    name: management
```

创建 Ingress：

```yaml
# keycloak-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak
  namespace: auth
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - keycloak.example.com
    secretName: keycloak-tls
  rules:
  - host: keycloak.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: keycloak
            port:
              number: 8080
```

### 4. 部署 Grafana

使用 Helm 部署：

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

创建 values 文件：

```yaml
# grafana-values.yaml
replicas: 2

env:
  GF_SERVER_ROOT_URL: https://grafana.example.com
  GF_AUTH_GENERIC_OAUTH_ENABLED: "true"
  GF_AUTH_GENERIC_OAUTH_NAME: "Keycloak"
  GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP: "true"
  GF_AUTH_GENERIC_OAUTH_CLIENT_ID: "grafana"
  GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET: "your-client-secret"
  GF_AUTH_GENERIC_OAUTH_SCOPES: "openid email profile offline_access roles"
  GF_AUTH_GENERIC_OAUTH_AUTH_URL: "https://keycloak.example.com/realms/grafana/protocol/openid-connect/auth"
  GF_AUTH_GENERIC_OAUTH_TOKEN_URL: "https://keycloak.example.com/realms/grafana/protocol/openid-connect/token"
  GF_AUTH_GENERIC_OAUTH_API_URL: "https://keycloak.example.com/realms/grafana/protocol/openid-connect/userinfo"
  GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH: "contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'"
  GF_AUTH_GENERIC_OAUTH_ALLOW_ASSIGN_GRAFANA_ADMIN: "true"
  GF_AUTH_GENERIC_OAUTH_USE_REFRESH_TOKEN: "true"

ingress:
  enabled: true
  ingressClassName: nginx
  hosts:
    - grafana.example.com
  tls:
    - secretName: grafana-tls
      hosts:
        - grafana.example.com
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"

persistence:
  enabled: true
  size: 10Gi

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi
```

部署：

```bash
helm install grafana grafana/grafana \
  --namespace monitoring \
  --values grafana-values.yaml
```

## 高可用配置

### Keycloak 高可用

```yaml
# 启用 Infinispan 缓存
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: keycloak
        env:
        - name: KC_CACHE
          value: ispn
        - name: KC_CACHE_STACK
          value: kubernetes
```

### PostgreSQL 高可用

使用 Patroni + etcd：

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install keycloak-postgres bitnami/postgresql-ha \
  --namespace auth \
  --set postgresql.replicaCount=3
```

## 监控

### 部署 Prometheus Operator

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring
```

### Keycloak 监控

```yaml
# ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: keycloak
  namespace: auth
spec:
  selector:
    matchLabels:
      app: keycloak
  endpoints:
  - port: management
    path: /metrics
```

## 备份

### 数据库备份

```yaml
# CronJob for backup
apiVersion: batch/v1
kind: CronJob
metadata:
  name: keycloak-backup
  namespace: auth
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h keycloak-postgres -U keycloak keycloak > /backup/keycloak-$(date +%Y%m%d).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: keycloak-db-secret
                  key: password
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## 故障排除

### Pod 无法启动

```bash
# 查看事件
kubectl describe pod -n auth <pod-name>

# 查看日志
kubectl logs -n auth <pod-name>
```

### 服务发现失败

```bash
# 检查 DNS
kubectl run -it --rm debug --image=busybox:1.28 --restart=Never -- nslookup keycloak-postgres.auth.svc.cluster.local
```

## 下一步

- [生产环境配置](./production) - 安全加固和优化
- [SSL 证书配置](./ssl) - HTTPS 详细配置
