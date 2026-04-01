# 故障排除

常见问题及解决方案。

## WebAuthn 相关问题

### WebAuthn 注册失败

**症状**: 提示 "WebAuthn not supported" 或注册超时

**可能原因及解决方案**:

1. **未使用 HTTPS**
   ```
   错误: The operation is insecure
   ```
   **解决**: WebAuthn 必须在 HTTPS 环境下工作。请配置 SSL 证书。

2. **浏览器不支持**
   ```
   错误: WebAuthn is not supported in this browser
   ```
   **解决**: 升级浏览器到最新版本。支持的浏览器：
   - Chrome 67+
   - Firefox 60+
   - Safari 13+
   - Edge 79+

3. **YubiKey 未识别**
   ```
   错误: No authenticator found
   ```
   **解决**: 
   - 确保 YubiKey 已插入 USB 接口
   - 检查设备管理器是否识别
   - 尝试其他 USB 端口

### Passkey 自动填充不工作

**症状**: 没有看到 Passkey 自动填充提示

**解决**:
1. 确保 Keycloak 版本 >= 26.3.0
2. 检查浏览器是否支持 Conditional UI
3. 确认用户已注册 Passkey
4. 检查 WebAuthn Policy 中是否启用 **Enable Passkeys**

## Keycloak 相关问题

### 无法访问 Keycloak Admin Console

**症状**: 访问 https://keycloak.example.com:8443 超时

**排查步骤**:

```bash
# 1. 检查容器状态
docker-compose ps keycloak

# 2. 查看日志
docker-compose logs keycloak

# 3. 检查端口
curl -v https://localhost:8443

# 4. 检查防火墙
sudo ufw status
```

**常见原因**:
- 容器未启动: `docker-compose up -d keycloak`
- 端口被占用: 检查 8443 端口
- 证书问题: 检查 certs 目录权限

### 数据库连接失败

**症状**: Keycloak 日志显示数据库连接错误

```
ERROR: Failed to connect to database
```

**解决**:
```bash
# 1. 检查 PostgreSQL 状态
docker-compose ps postgres
docker-compose logs postgres

# 2. 验证连接信息
docker-compose exec postgres pg_isready -U keycloak

# 3. 重置数据库（会丢失数据）
docker-compose down -v
docker-compose up -d
```

### Client Secret 错误

**症状**: Grafana 登录提示 "invalid_client"

**解决**:
1. 进入 Keycloak Admin Console
2. Clients → grafana → Credentials
3. 复制 Client Secret
4. 更新 `.env` 文件中的 `KEYCLOAK_CLIENT_SECRET`
5. 重启 Grafana: `docker-compose restart grafana`

## Grafana 相关问题

### OIDC 登录失败

**症状**: Keycloak 认证成功但 Grafana 显示 "Login Failed"

**排查步骤**:

1. **检查 Grafana 日志**
   ```bash
   docker-compose logs grafana
   ```

2. **验证配置**
   ```bash
   # 检查环境变量
docker-compose exec grafana env | grep GF_AUTH
   ```

3. **检查回调 URL**
   - Keycloak Client 中的 **Valid redirect URIs** 必须包含：
     - `https://grafana.example.com/login/generic_oauth`

4. **验证 OIDC 端点**
   ```bash
   curl https://keycloak.example.com:8443/realms/grafana/.well-known/openid-configuration
   ```

### 角色映射不生效

**症状**: 用户登录后没有正确的 Grafana 角色

**排查**:

1. **检查 Keycloak 角色分配**
   - Users → 用户名 → Role mapping
   - 确认用户分配了 `admin`, `editor` 或 `viewer` 角色

2. **检查 Mapper 配置**
   - Client → grafana → Mappers
   - 确认有 "Realm Roles" Mapper
   - Token Claim Name: `roles`
   - Add to ID token: ON

3. **调试 JWT Token**
   ```bash
   # 获取 token
curl -X POST https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/token \
     -d "client_id=grafana" \
     -d "client_secret=SECRET" \
     -d "username=user" \
     -d "password=pass" \
     -d "grant_type=password"
   
   # 解码 token (使用 jwt.io 或命令行)
   echo "TOKEN" | cut -d. -f2 | base64 -d
   ```

4. **调整 role_attribute_path**
   ```ini
   # grafana.ini
   role_attribute_path = contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'
   ```

### Session 超时过快

**症状**: 用户频繁需要重新登录

**解决**:
```ini
# grafana.ini
[auth]
login_maximum_inactive_lifetime_duration = 7d
login_maximum_lifetime_duration = 30d

[auth.generic_oauth]
use_refresh_token = true
```

## 网络相关问题

### 容器间无法通信

**症状**: Grafana 无法连接到 Keycloak

**排查**:
```bash
# 1. 检查网络
docker network ls
docker network inspect keycloak-network

# 2. 测试连通性
docker-compose exec grafana ping keycloak

# 3. 检查 DNS
docker-compose exec grafana nslookup keycloak
```

### SSL 证书错误

**症状**: 浏览器显示 "Your connection is not private"

**解决**:

1. **测试环境** - 导入 CA 证书
   ```bash
   # macOS
   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/ca.crt.pem
   
   # Ubuntu
   sudo cp certs/ca.crt.pem /usr/local/share/ca-certificates/
   sudo update-ca-certificates
   
   # Windows
   # 双击 ca.crt.pem → 安装证书 → 本地计算机 → 受信任的根证书颁发机构
   ```

2. **生产环境** - 使用有效证书
   ```bash
   # Let's Encrypt
   certbot certonly --standalone -d keycloak.example.com
   ```

## 性能相关问题

### Keycloak 响应缓慢

**优化建议**:

1. **增加内存**
   ```yaml
   services:
     keycloak:
       deploy:
         resources:
           limits:
             memory: 4G
   ```

2. **启用缓存**
   ```bash
   # 检查缓存统计
   docker-compose exec keycloak curl http://localhost:9000/metrics
   ```

3. **数据库优化**
   ```sql
   -- 连接池配置
   ALTER SYSTEM SET max_connections = 200;
   ```

### Grafana 加载缓慢

**优化**:

1. **启用 Redis 会话缓存**（已默认启用）
2. **数据库优化**
   ```ini
   # grafana.ini
   [database]
   max_idle_conn = 10
   max_open_conn = 100
   ```

## 调试技巧

### 启用调试日志

**Keycloak**:
```bash
# 进入容器
docker-compose exec keycloak bash

# 启用调试
/opt/keycloak/bin/kc.sh start --log-level=DEBUG
```

**Grafana**:
```ini
# grafana.ini
[log]
level = debug
```

### 网络抓包

```bash
# 安装 tcpdump
docker-compose exec keycloak apt-get update && apt-get install -y tcpdump

# 抓包
docker-compose exec keycloak tcpdump -i any -w /tmp/capture.pcap port 8443

# 复制到本地
docker cp keycloak:/tmp/capture.pcap ./
```

## 获取帮助

如果以上方法无法解决问题：

1. **查看官方文档**
   - [Keycloak 文档](https://www.keycloak.org/documentation)
   - [Grafana 文档](https://grafana.com/docs/)

2. **提交 Issue**
   - [GitHub Issues](https://github.com/undownding/keycloak-grafana-webauthn-wiki/issues)

3. **社区支持**
   - [Keycloak Discourse](https://keycloak.discourse.group/)
   - [Grafana Community](https://community.grafana.com/)
