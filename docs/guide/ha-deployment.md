# 高可用部署

本章节介绍 Keycloak 和 Grafana 的高可用部署方案。

## 架构设计

### 高可用架构

```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    │  (HAProxy)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Keycloak 1 │  │ Keycloak 2 │  │ Keycloak 3 │
    │  (Active)  │  │  (Active)  │  │  (Active)  │
    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────┴──────┐
                    │  PostgreSQL │
                    │   Cluster   │
                    │  (Patroni)  │
                    └─────────────┘
                           │
                    ┌──────┴──────┐
                    │    etcd     │
                    │   (Raft)    │
                    └─────────────┘
```

## Keycloak 高可用

### 1. 数据库高可用

使用 Patroni + etcd 部署 PostgreSQL 集群：

```yaml
# docker-compose-ha.yml
version: '3.8'

services:
  etcd1:
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      ETCD_NAME: etcd1
      ETCD_INITIAL_ADVERTISE_PEER_URLS: http://etcd1:2380
      ETCD_INITIAL_CLUSTER: etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
      ETCD_INITIAL_CLUSTER_TOKEN: etcd-cluster
      ETCD_INITIAL_CLUSTER_STATE: new
      ETCD_LISTEN_PEER_URLS: http://0.0.0.0:2380
      ETCD_LISTEN_CLIENT_URLS: http://0.0.0.0:2379
      ETCD_ADVERTISE_CLIENT_URLS: http://etcd1:2379

  etcd2:
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      ETCD_NAME: etcd2
      ETCD_INITIAL_ADVERTISE_PEER_URLS: http://etcd2:2380
      ETCD_INITIAL_CLUSTER: etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
      ETCD_INITIAL_CLUSTER_TOKEN: etcd-cluster
      ETCD_INITIAL_CLUSTER_STATE: new
      ETCD_LISTEN_PEER_URLS: http://0.0.0.0:2380
      ETCD_LISTEN_CLIENT_URLS: http://0.0.0.0:2379
      ETCD_ADVERTISE_CLIENT_URLS: http://etcd2:2379

  etcd3:
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      ETCD_NAME: etcd3
      ETCD_INITIAL_ADVERTISE_PEER_URLS: http://etcd3:2380
      ETCD_INITIAL_CLUSTER: etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380
      ETCD_INITIAL_CLUSTER_TOKEN: etcd-cluster
      ETCD_INITIAL_CLUSTER_STATE: new
      ETCD_LISTEN_PEER_URLS: http://0.0.0.0:2380
      ETCD_LISTEN_CLIENT_URLS: http://0.0.0.0:2379
      ETCD_ADVERTISE_CLIENT_URLS: http://etcd3:2379

  postgres-primary:
    image: bitnami/postgresql-repmgr:16
    environment:
      POSTGRESQL_POSTGRES_PASSWORD: adminpassword
      POSTGRESQL_USERNAME: keycloak
      POSTGRESQL_PASSWORD: password
      POSTGRESQL_DATABASE: keycloak
      REPMGR_PASSWORD: repmgrpassword
      REPMGR_PRIMARY_HOST: postgres-primary
      REPMGR_PRIMARY_PORT: 5432
      REPMGR_PARTNER_NODES: postgres-primary:5432,postgres-standby:5432
      REPMGR_NODE_NAME: postgres-primary
      REPMGR_NODE_NETWORK_NAME: postgres-primary
      REPMGR_PORT_NUMBER: 5432
      REPMGR_CONNECT_TIMEOUT: 5
      REPMGR_RECONNECT_ATTEMPTS: 3
      REPMGR_RECONNECT_INTERVAL: 5

  postgres-standby:
    image: bitnami/postgresql-repmgr:16
    environment:
      POSTGRESQL_POSTGRES_PASSWORD: adminpassword
      POSTGRESQL_USERNAME: keycloak
      POSTGRESQL_PASSWORD: password
      POSTGRESQL_DATABASE: keycloak
      REPMGR_PASSWORD: repmgrpassword
      REPMGR_PRIMARY_HOST: postgres-primary
      REPMGR_PRIMARY_PORT: 5432
      REPMGR_PARTNER_NODES: postgres-primary:5432,postgres-standby:5432
      REPMGR_NODE_NAME: postgres-standby
      REPMGR_NODE_NETWORK_NAME: postgres-standby
      REPMGR_PORT_NUMBER: 5432
      REPMGR_CONNECT_TIMEOUT: 5
      REPMGR_RECONNECT_ATTEMPTS: 3
      REPMGR_RECONNECT_INTERVAL: 5
```

### 2. Keycloak 集群配置

```yaml
services:
  keycloak1:
    image: quay.io/keycloak/keycloak:26.3.0
    command: start --optimized
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres-primary:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_HOSTNAME: keycloak.example.com
      KC_CACHE: ispn
      KC_CACHE_STACK: tcp
      JAVA_OPTS_APPEND: >
        -Djgroups.bind_addr=global
        -Djgroups.tcp.address=keycloak1
        -Djgroups.tcp.port=7800
    ports:
      - "8080:8080"
      - "7800:7800"

  keycloak2:
    image: quay.io/keycloak/keycloak:26.3.0
    command: start --optimized
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres-primary:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: password
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_HOSTNAME: keycloak.example.com
      KC_CACHE: ispn
      KC_CACHE_STACK: tcp
      JAVA_OPTS_APPEND: >
        -Djgroups.bind_addr=global
        -Djgroups.tcp.address=keycloak2
        -Djgroups.tcp.port=7800
        -Djgroups.initial_hosts=keycloak1[7800],keycloak2[7800]
    ports:
      - "8081:8080"
      - "7801:7800"
```

### 3. 负载均衡器配置

```yaml
# haproxy.cfg
global
    maxconn 4096

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    option httpchk GET /health/ready

frontend keycloak_frontend
    bind *:8443 ssl crt /etc/ssl/certs/keycloak.pem
    default_backend keycloak_backend

backend keycloak_backend
    balance roundrobin
    option httpchk GET /health/ready
    server keycloak1 keycloak1:8080 check
    server keycloak2 keycloak2:8080 check
    server keycloak3 keycloak3:8080 check
```

## Grafana 高可用

### 1. 共享存储

使用 NFS 或对象存储共享 Grafana 数据：

```yaml
services:
  grafana1:
    image: grafana/grafana:latest
    volumes:
      - grafana-storage:/var/lib/grafana
    environment:
      GF_DATABASE_TYPE: postgres
      GF_DATABASE_HOST: grafana-postgres:5432
      GF_DATABASE_NAME: grafana
      GF_DATABASE_USER: grafana
      GF_DATABASE_PASSWORD: password
      GF_SESSION_PROVIDER: redis
      GF_SESSION_PROVIDER_CONFIG: addr=redis:6379

  grafana2:
    image: grafana/grafana:latest
    volumes:
      - grafana-storage:/var/lib/grafana
    environment:
      GF_DATABASE_TYPE: postgres
      GF_DATABASE_HOST: grafana-postgres:5432
      GF_DATABASE_NAME: grafana
      GF_DATABASE_USER: grafana
      GF_DATABASE_PASSWORD: password
      GF_SESSION_PROVIDER: redis
      GF_SESSION_PROVIDER_CONFIG: addr=redis:6379

volumes:
  grafana-storage:
    driver: nfs
    driver_opts:
      share: nfs-server:/grafana
```

### 2. 会话共享

使用 Redis 存储会话：

```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  redis-sentinel1:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf

  redis-sentinel2:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
```

### 3. 数据库高可用

```yaml
services:
  grafana-postgres-primary:
    image: bitnami/postgresql-repmgr:16
    environment:
      POSTGRESQL_DATABASE: grafana
      REPMGR_NODE_NAME: grafana-postgres-primary

  grafana-postgres-standby:
    image: bitnami/postgresql-repmgr:16
    environment:
      POSTGRESQL_DATABASE: grafana
      REPMGR_NODE_NAME: grafana-postgres-standby
```

## Kubernetes 高可用

### 1. Keycloak StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: keycloak
spec:
  serviceName: keycloak
  replicas: 3
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
          value: jdbc:postgresql://postgres-cluster:5432/keycloak
        - name: KC_CACHE
          value: ispn
        - name: KC_CACHE_STACK
          value: kubernetes
        ports:
        - containerPort: 8080
        - containerPort: 7800
          name: jgroups
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
spec:
  selector:
    app: keycloak
  ports:
  - port: 8080
  clusterIP: None  # Headless service for StatefulSet
```

### 2. Grafana Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        env:
        - name: GF_DATABASE_TYPE
          value: postgres
        - name: GF_DATABASE_HOST
          value: grafana-postgres:5432
        - name: GF_SESSION_PROVIDER
          value: redis
        - name: GF_SESSION_PROVIDER_CONFIG
          value: addr=redis-cluster:6379
        volumeMounts:
        - name: grafana-storage
          mountPath: /var/lib/grafana
  volumes:
  - name: grafana-storage
    persistentVolumeClaim:
      claimName: grafana-pvc
```

### 3. Ingress 配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak
  annotations:
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
spec:
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

## 健康检查

### Keycloak 健康端点

```bash
# 就绪检查
curl http://keycloak:8080/health/ready

# 存活检查
curl http://keycloak:8080/health/live

# 指标
curl http://keycloak:9000/metrics
```

### Grafana 健康端点

```bash
# 健康检查
curl http://grafana:3000/api/health

# 指标
curl http://grafana:3000/metrics
```

## 故障转移测试

### 1. 数据库故障转移

```bash
# 停止主数据库
docker-compose stop postgres-primary

# 检查备库是否提升为主库
docker-compose logs postgres-standby

# 验证 Keycloak 仍然可用
curl http://keycloak:8080/health/ready
```

### 2. Keycloak 节点故障

```bash
# 停止一个 Keycloak 节点
docker-compose stop keycloak1

# 验证其他节点仍然可用
curl http://keycloak2:8080/health/ready
```

## 监控

### Prometheus 配置

```yaml
scrape_configs:
  - job_name: 'keycloak'
    static_configs:
      - targets: ['keycloak1:9000', 'keycloak2:9000', 'keycloak3:9000']
    metrics_path: /metrics

  - job_name: 'grafana'
    static_configs:
      - targets: ['grafana1:3000', 'grafana2:3000']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### 告警规则

```yaml
groups:
  - name: ha
    rules:
      - alert: KeycloakNodeDown
        expr: up{job="keycloak"} == 0
        for: 1m
        labels:
          severity: critical
          
      - alert: PostgresReplicationLag
        expr: pg_replication_lag > 1000
        for: 5m
        labels:
          severity: warning
```

## 最佳实践

1. **奇数节点**: Keycloak 和数据库使用奇数节点（3、5）
2. **跨可用区**: 节点分布在不同可用区
3. **自动故障转移**: 配置自动故障检测和转移
4. **定期测试**: 定期进行故障转移演练
5. **监控告警**: 全面的监控和告警机制
6. **备份策略**: 定期备份，异地存储

## 下一步

- [备份恢复](./backup-restore) - 数据备份和恢复策略
