# SSL 证书配置

本章节介绍如何配置 SSL/TLS 证书。

## 自签名证书（测试环境）

### 生成证书

使用项目提供的脚本：

```bash
./scripts/generate-certs.sh
```

或手动生成：

```bash
# 创建目录
mkdir -p certs
cd certs

# 生成 CA 私钥
openssl genrsa -out ca.key.pem 4096

# 生成 CA 证书
openssl req -x509 -new -nodes -key ca.key.pem -sha256 -days 3650 \
    -out ca.crt.pem \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=Local CA"

# 生成服务器私钥
openssl genrsa -out server.key.pem 4096

# 创建配置文件
cat > server.conf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CN
ST = State
L = City
O = Organization
CN = keycloak.example.com

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = keycloak.example.com
DNS.2 = grafana.example.com
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

# 生成 CSR
openssl req -new -key server.key.pem -out server.csr.pem -config server.conf

# 生成证书
openssl x509 -req -in server.csr.pem -CA ca.crt.pem -CAkey ca.key.pem \
    -CAcreateserial -out server.crt.pem -days 365 -sha256 \
    -extensions v3_req -extfile server.conf

# 设置权限
chmod 600 server.key.pem
chmod 644 server.crt.pem
```

### 信任自签名证书

#### macOS

```bash
sudo security add-trusted-cert -d -r trustRoot \
    -k /Library/Keychains/System.keychain \
    certs/ca.crt.pem
```

#### Linux

```bash
sudo cp certs/ca.crt.pem /usr/local/share/ca-certificates/local-ca.crt
sudo update-ca-certificates
```

#### Windows

1. 双击 `ca.crt.pem`
2. 选择 "安装证书"
3. 选择 "本地计算机"
4. 选择 "将所有的证书都放入下列存储"
5. 选择 "受信任的根证书颁发机构"

## Let's Encrypt（生产环境）

### 使用 Certbot

```bash
# 安装 Certbot
sudo apt-get install certbot

# 生成证书（Standalone 模式）
sudo certbot certonly --standalone \
    -d keycloak.example.com \
    -d grafana.example.com

# 证书位置
# /etc/letsencrypt/live/keycloak.example.com/fullchain.pem
# /etc/letsencrypt/live/keycloak.example.com/privkey.pem
```

### 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 添加定时任务
sudo crontab -e

# 添加以下行（每天凌晨 2 点检查续期）
0 2 * * * /usr/bin/certbot renew --quiet
```

### Docker 中使用 Let's Encrypt

```yaml
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./certs:/etc/letsencrypt
      - ./certbot-data:/var/lib/letsencrypt
    command: certonly --standalone -d keycloak.example.com -d grafana.example.com
```

## 使用现有证书

如果你有现有的证书文件：

```bash
# 复制证书到项目目录
cp /path/to/your/certificate.crt certs/server.crt.pem
cp /path/to/your/private.key certs/server.key.pem

# 确保证书和私钥匹配
openssl x509 -noout -modulus -in certs/server.crt.pem | openssl md5
openssl rsa -noout -modulus -in certs/server.key.pem | openssl md5
```

## 证书格式转换

### PFX/P12 转 PEM

```bash
# 提取证书
openssl pkcs12 -in certificate.pfx -clcerts -nokeys -out server.crt.pem

# 提取私钥
openssl pkcs12 -in certificate.pfx -nocerts -nodes -out server.key.pem

# 提取 CA 证书（如果有）
openssl pkcs12 -in certificate.pfx -cacerts -nokeys -out ca.crt.pem
```

### DER 转 PEM

```bash
# 证书
openssl x509 -inform der -in certificate.cer -out server.crt.pem

# 私钥
openssl rsa -inform der -in privatekey.der -out server.key.pem
```

## 验证证书

### 检查证书信息

```bash
# 查看证书详情
openssl x509 -in certs/server.crt.pem -text -noout

# 检查证书有效期
openssl x509 -in certs/server.crt.pem -noout -dates

# 检查证书主题和 SAN
openssl x509 -in certs/server.crt.pem -noout -subject -ext subjectAltName
```

### 验证证书链

```bash
# 验证证书链完整性
openssl verify -CAfile certs/ca.crt.pem certs/server.crt.pem

# 验证证书和私钥匹配
openssl x509 -noout -modulus -in certs/server.crt.pem | openssl md5
openssl rsa -noout -modulus -in certs/server.key.pem | openssl md5
```

## 配置服务使用证书

### Keycloak

```yaml
services:
  keycloak:
    volumes:
      - ./certs/server.crt.pem:/opt/keycloak/conf/server.crt.pem:ro
      - ./certs/server.key.pem:/opt/keycloak/conf/server.key.pem:ro
    environment:
      KC_HTTPS_CERTIFICATE_FILE: /opt/keycloak/conf/server.crt.pem
      KC_HTTPS_CERTIFICATE_KEY_FILE: /opt/keycloak/conf/server.key.pem
```

### Nginx

```yaml
services:
  nginx:
    volumes:
      - ./certs/server.crt.pem:/etc/nginx/certs/server.crt.pem:ro
      - ./certs/server.key.pem:/etc/nginx/certs/server.key.pem:ro
```

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/certs/server.crt.pem;
    ssl_certificate_key /etc/nginx/certs/server.key.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
}
```

## 证书续期

### 手动续期

```bash
# 停止服务
docker-compose stop nginx

# 续期证书
certbot renew

# 重启服务
docker-compose start nginx
```

### 自动续期脚本

```bash
#!/bin/bash
# renew-certs.sh

# 停止使用证书的容器
docker-compose stop nginx keycloak

# 续期证书
certbot renew --quiet

# 重启容器
docker-compose start nginx keycloak

# 通知（可选）
echo "证书已续期: $(date)" | mail -s "SSL Certificate Renewed" admin@example.com
```

## 故障排除

### 证书不被信任

**症状**: 浏览器显示 "Your connection is not private"

**解决**:
1. 检查证书是否正确安装
2. 导入 CA 证书到系统信任存储
3. 确保证书链完整

### 证书过期

**症状**: 浏览器显示 "NET::ERR_CERT_DATE_INVALID"

**解决**:
```bash
# 检查证书有效期
openssl x509 -in certs/server.crt.pem -noout -dates

# 续期或重新生成证书
certbot renew
```

### 私钥不匹配

**症状**: 服务启动失败，提示私钥错误

**解决**:
```bash
# 验证证书和私钥匹配
openssl x509 -noout -modulus -in certs/server.crt.pem | openssl md5
openssl rsa -noout -modulus -in certs/server.key.pem | openssl md5

# 如果不匹配，重新生成或使用正确的密钥对
```

## 最佳实践

1. **使用正式证书**: 生产环境使用 Let's Encrypt 或商业 CA
2. **定期续期**: 设置自动续期，避免证书过期
3. **保护私钥**: 私钥文件权限设置为 600
4. **完整证书链**: 确保包含中间证书
5. **强加密算法**: 使用 RSA 2048+ 或 ECC 256+
6. **监控有效期**: 设置告警，提前 30 天通知续期

## 下一步

- [反向代理配置](./reverse-proxy) - Nginx/Traefik 详细配置
- [生产环境](./production) - 生产环境安全加固
