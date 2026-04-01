#!/bin/bash
# 生成自签名 SSL 证书脚本
# 用于测试环境，生产环境请使用 Let's Encrypt 或其他 CA

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/../certs"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== SSL 证书生成工具 ===${NC}"
echo ""

# 创建证书目录
mkdir -p "$CERTS_DIR"
cd "$CERTS_DIR"

# 获取域名
read -p "请输入 Keycloak 域名 [keycloak.example.com]: " KEYCLOAK_DOMAIN
KEYCLOAK_DOMAIN=${KEYCLOAK_DOMAIN:-keycloak.example.com}

read -p "请输入 Grafana 域名 [grafana.example.com]: " GRAFANA_DOMAIN
GRAFANA_DOMAIN=${GRAFANA_DOMAIN:-grafana.example.com}

echo ""
echo -e "${YELLOW}正在生成 SSL 证书...${NC}"
echo ""

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
CN = $KEYCLOAK_DOMAIN

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $KEYCLOAK_DOMAIN
DNS.2 = $GRAFANA_DOMAIN
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

# 生成证书签名请求
openssl req -new -key server.key.pem -out server.csr.pem -config server.conf

# 生成服务器证书
openssl x509 -req -in server.csr.pem -CA ca.crt.pem -CAkey ca.key.pem \
    -CAcreateserial -out server.crt.pem -days 365 -sha256 \
    -extensions v3_req -extfile server.conf

# 设置权限
chmod 600 server.key.pem
chmod 644 server.crt.pem

# 清理临时文件
rm -f server.csr.pem server.conf ca.srl

echo ""
echo -e "${GREEN}=== 证书生成完成 ===${NC}"
echo ""
echo "证书文件位置: $CERTS_DIR"
echo ""
echo "文件列表:"
ls -la "$CERTS_DIR"
echo ""
echo -e "${YELLOW}注意: 请将 ca.crt.pem 添加到系统信任存储以消除浏览器警告${NC}"
echo ""
echo "Windows 导入 CA 证书:"
echo "  1. 双击 ca.crt.pem"
echo "  2. 选择 '安装证书'"
echo "  3. 选择 '本地计算机'"
echo "  4. 选择 '将所有的证书都放入下列存储'"
echo "  5. 选择 '受信任的根证书颁发机构'"
echo ""
echo "macOS 导入 CA 证书:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ca.crt.pem"
echo ""
echo "Linux 导入 CA 证书:"
echo "  sudo cp ca.crt.pem /usr/local/share/ca-certificates/local-ca.crt"
echo "  sudo update-ca-certificates"
