# 备份与恢复

本章节介绍 Keycloak 和 Grafana 的数据备份与恢复策略。

## 备份策略

### 备份类型

| 类型 | 频率 | 保留时间 | 说明 |
|------|------|----------|------|
| 全量备份 | 每日 | 30 天 | 完整数据备份 |
| 增量备份 | 每小时 | 7 天 | 数据库 WAL 归档 |
| 配置备份 | 每次变更 | 90 天 | 配置文件导出 |
| 异地备份 | 每日 | 1 年 | 远程存储备份 |

## Keycloak 备份

### 数据库备份

#### 自动备份脚本

```bash
#!/bin/bash
# backup-keycloak.sh

set -e

BACKUP_DIR="/backup/keycloak/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30
DB_NAME="keycloak"
DB_USER="keycloak"
S3_BUCKET="s3://your-backup-bucket/keycloak"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "Starting Keycloak backup at $(date)"

# 1. 数据库备份
echo "Backing up database..."
docker-compose exec -T postgres pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F custom \
    -f /tmp/keycloak.dump

docker cp "$(docker-compose ps -q postgres):/tmp/keycloak.dump" "$BACKUP_DIR/"

# 2. Keycloak 配置导出
echo "Exporting Keycloak configuration..."
docker-compose exec -T keycloak /opt/keycloak/bin/kc.sh export \
    --dir /tmp/keycloak-export \
    --realm grafana

docker cp "$(docker-compose ps -q keycloak):/tmp/keycloak-export" "$BACKUP_DIR/"

# 3. 压缩备份
echo "Compressing backup..."
tar czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"

# 4. 上传到 S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR.tar.gz" "$S3_BUCKET/"

# 5. 清理本地备份
rm -rf "$BACKUP_DIR" "$BACKUP_DIR.tar.gz"

# 6. 清理旧备份
echo "Cleaning up old backups..."
find /backup/keycloak -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
aws s3 ls "$S3_BUCKET/" | awk '{print $4}' | while read -r file; do
    aws s3api head-object --bucket your-backup-bucket --key "keycloak/$file" | \
    jq -r '.LastModified' | \
    xargs -I {} date -d {} +%s | \
    xargs -I {} bash -c 'if (( $(date +%s) - {} > 30 * 86400 )); then aws s3 rm "'$S3_BUCKET'/'$file'"; fi'
done

echo "Backup completed at $(date)"
```

#### 定时任务

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /path/to/backup-keycloak.sh >> /var/log/backup-keycloak.log 2>&1
```

### 配置导出

#### 导出特定 Realm

```bash
# 导出单个 realm
docker-compose exec keycloak /opt/keycloak/bin/kc.sh export \
    --dir /tmp/export \
    --realm grafana \
    --users same_file

# 复制到本地
docker cp "$(docker-compose ps -q keycloak):/tmp/export" ./keycloak-export/
```

#### 导出所有 Realms

```bash
docker-compose exec keycloak /opt/keycloak/bin/kc.sh export \
    --dir /tmp/export-all \
    --users different_files
```

## Grafana 备份

### 数据库备份

```bash
#!/bin/bash
# backup-grafana.sh

BACKUP_DIR="/backup/grafana/$(date +%Y%m%d_%H%M%S)"
DB_NAME="grafana"
DB_USER="grafana"

mkdir -p "$BACKUP_DIR"

# 数据库备份
docker-compose exec -T grafana-postgres pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F custom \
    -f /tmp/grafana.dump

docker cp "$(docker-compose ps -q grafana-postgres):/tmp/grafana.dump" "$BACKUP_DIR/"

# 配置文件备份
cp -r grafana/provisioning "$BACKUP_DIR/"
cp grafana/grafana.ini "$BACKUP_DIR/" 2>/dev/null || true

# 仪表板 JSON 导出（可选）
# 需要 Grafana API Key
GRAFANA_API_KEY="your-api-key"
curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
     http://grafana:3000/api/search | \
     jq -r '.[].uid' | \
     while read uid; do
         curl -H "Authorization: Bearer $GRAFANA_API_KEY" \
              "http://grafana:3000/api/dashboards/uid/$uid" > "$BACKUP_DIR/dashboard-$uid.json"
     done

# 压缩并上传
tar czf "$BACKUP_DIR.tar.gz" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"
aws s3 cp "$BACKUP_DIR.tar.gz" s3://your-backup-bucket/grafana/

# 清理
rm -rf "$BACKUP_DIR" "$BACKUP_DIR.tar.gz"
```

### 快照备份

```bash
# 创建 Docker 卷快照
docker run --rm \
    -v keycloak-grafana-webauthn-wiki_postgres_data:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/postgres-snapshot-$(date +%Y%m%d).tar.gz -C /data .
```

## 恢复流程

### Keycloak 恢复

#### 数据库恢复

```bash
#!/bin/bash
# restore-keycloak.sh

BACKUP_FILE="$1"
DB_NAME="keycloak"
DB_USER="keycloak"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

echo "Starting Keycloak restore from $BACKUP_FILE"

# 1. 停止 Keycloak
docker-compose stop keycloak

# 2. 恢复数据库
docker-compose up -d postgres
docker-compose exec postgres dropdb -U "$DB_USER" "$DB_NAME" || true
docker-compose exec postgres createdb -U "$DB_USER" "$DB_NAME"

docker cp "$BACKUP_FILE" "$(docker-compose ps -q postgres):/tmp/restore.dump"
docker-compose exec postgres pg_restore \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    /tmp/restore.dump

# 3. 启动 Keycloak
docker-compose up -d keycloak

# 4. 验证
echo "Waiting for Keycloak to start..."
sleep 30
curl -f http://localhost:8080/health/ready && echo "Restore successful!"
```

#### 配置恢复

```bash
# 导入 realm 配置
docker-compose exec keycloak /opt/keycloak/bin/kc.sh import \
    --dir /tmp/import \
    --override true

# 或导入单个文件
docker-compose exec keycloak /opt/keycloak/bin/kc.sh import \
    --file /tmp/import/grafana-realm.json
```

### Grafana 恢复

```bash
#!/bin/bash
# restore-grafana.sh

BACKUP_FILE="$1"

# 停止 Grafana
docker-compose stop grafana

# 恢复数据库
docker-compose up -d grafana-postgres
docker-compose exec grafana-postgres dropdb -U grafana grafana || true
docker-compose exec grafana-postgres createdb -U grafana grafana

docker cp "$BACKUP_FILE" "$(docker-compose ps -q grafana-postgres):/tmp/restore.dump"
docker-compose exec grafana-postgres pg_restore \
    -U grafana \
    -d grafana \
    /tmp/restore.dump

# 恢复配置文件
cp -r grafana/provisioning/* grafana/provisioning/ 2>/dev/null || true

# 启动 Grafana
docker-compose up -d grafana
```

## 灾难恢复计划

### RTO/RPO 目标

| 系统 | RTO (恢复时间目标) | RPO (恢复点目标) |
|------|-------------------|------------------|
| Keycloak | 30 分钟 | 1 小时 |
| Grafana | 15 分钟 | 1 小时 |

### 恢复流程

#### 场景 1: 数据库损坏

1. **检测**: 监控系统告警
2. **停止服务**: `docker-compose stop keycloak`
3. **恢复数据库**: 运行恢复脚本
4. **验证**: 检查服务健康状态
5. **通知**: 通知用户服务恢复

#### 场景 2: 完整环境丢失

1. **准备新环境**: 安装 Docker、Docker Compose
2. **克隆配置**: `git clone <repo>`
3. **恢复数据**: 从 S3 下载最新备份
4. **启动服务**: `docker-compose up -d`
5. **验证**: 全面功能测试

#### 场景 3: 配置错误

1. **回滚配置**: `git revert <commit>`
2. **重启服务**: `docker-compose restart`
3. **验证**: 检查配置是否正确

## 备份验证

### 定期恢复测试

```bash
#!/bin/bash
# test-restore.sh

# 每月执行一次恢复测试
TEST_DIR="/tmp/backup-test-$(date +%Y%m%d)"
mkdir -p "$TEST_DIR"

# 下载最新备份
LATEST_BACKUP=$(aws s3 ls s3://your-backup-bucket/keycloak/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://your-backup-bucket/keycloak/$LATEST_BACKUP" "$TEST_DIR/"

# 解压
tar xzf "$TEST_DIR/$LATEST_BACKUP" -C "$TEST_DIR/"

# 启动测试环境
docker-compose -f docker-compose.test.yml up -d postgres-test

# 恢复数据
docker cp "$TEST_DIR"/*/keycloak.dump "$(docker-compose ps -q postgres-test):/tmp/"
docker-compose -f docker-compose.test.yml exec postgres-test pg_restore \
    -U keycloak -d keycloak /tmp/keycloak.dump

# 验证
if docker-compose -f docker-compose.test.yml exec postgres-test psql \
    -U keycloak -d keycloak -c "SELECT count(*) FROM realm;"; then
    echo "Backup test PASSED"
else
    echo "Backup test FAILED"
fi

# 清理
docker-compose -f docker-compose.test.yml down -v
rm -rf "$TEST_DIR"
```

## 监控和告警

### 备份监控

```yaml
# Prometheus 告警
groups:
  - name: backup
    rules:
      - alert: BackupFailed
        expr: time() - backup_last_success_time > 86400
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Backup has not run in 24 hours"
          
      - alert: BackupSizeAnomaly
        expr: abs(backup_size_bytes - avg_over_time(backup_size_bytes[7d])) / avg_over_time(backup_size_bytes[7d]) > 0.5
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Backup size changed significantly"
```

### 备份日志

```bash
# 配置日志轮转
sudo tee /etc/logrotate.d/keycloak-backup <<EOF
/var/log/backup-keycloak.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

## 最佳实践

1. **3-2-1 备份策略**: 3 份备份，2 种介质，1 份异地
2. **定期测试**: 每月执行恢复演练
3. **加密备份**: 敏感数据加密存储
4. **访问控制**: 限制备份文件访问权限
5. **监控告警**: 备份失败立即通知
6. **文档化**: 详细记录恢复流程

## 下一步

- [安全加固](./security) - 安全配置最佳实践
- [高可用部署](./ha-deployment) - 高可用架构设计
