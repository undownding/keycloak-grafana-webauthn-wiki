# 角色映射详解

本章节详细介绍 Keycloak 和 Grafana 之间的角色映射配置。

## 角色体系

### Grafana 角色层级

```
GrafanaAdmin (服务器管理员)
    └── Admin (组织管理员)
            └── Editor (编辑者)
                    └── Viewer (查看者)
```

### Keycloak 角色设计

建议在 Keycloak 中创建以下角色：

| Keycloak 角色 | 映射到 Grafana | 用途 |
|---------------|----------------|------|
| `grafanaadmin` | GrafanaAdmin | 平台管理员 |
| `admin` | Admin | 项目管理员 |
| `editor` | Editor | 开发人员 |
| `viewer` | Viewer | 只读用户 |

## 基础角色映射

### 单角色映射

最简单的角色映射配置：

```ini
[auth.generic_oauth]
role_attribute_path = contains(roles[*], 'admin') && 'Admin' || 'Viewer'
```

解释：
- 如果用户有 `admin` 角色 → Grafana `Admin`
- 否则 → Grafana `Viewer`

### 多级角色映射

完整的角色映射配置：

```ini
[auth.generic_oauth]
role_attribute_path = contains(roles[*], 'grafanaadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor' || 'Viewer'
```

解释：
- `grafanaadmin` → `GrafanaAdmin`
- `admin` → `Admin`
- `editor` → `Editor`
- 其他 → `Viewer`

## JMESPath 表达式

### 基础语法

```ini
# 检查数组中是否包含元素
contains(roles[*], 'admin')

# 逻辑或
contains(roles[*], 'admin') || contains(roles[*], 'editor')

# 逻辑与
contains(roles[*], 'admin') && contains(roles[*], 'editor')
```

### 复杂表达式

```ini
# 多条件判断
role_attribute_path = contains(roles[*], 'superadmin') && 'GrafanaAdmin' || contains(roles[*], 'admin') && contains(groups[*], 'devops') && 'Admin' || contains(roles[*], 'developer') && 'Editor' || 'Viewer'
```

### 使用 groups 属性

```ini
# 基于组的角色映射
role_attribute_path = contains(groups[*], 'grafana-admins') && 'Admin' || contains(groups[*], 'grafana-editors') && 'Editor' || 'Viewer'
```

## Keycloak Mapper 配置

### Realm Roles Mapper

1. 进入 **Clients** → **grafana** → **Mappers**
2. **Add mapper** → **By configuration** → **User Realm Role**

```
Name: Realm Roles
Mapper Type: User Realm Role
Token Claim Name: roles
Multivalued: ON
Add to ID token: ON
Add to access token: ON
Add to userinfo: ON
```

### Client Roles Mapper

如果角色定义在 Client 中：

```
Name: Client Roles
Mapper Type: User Client Role
Client ID: grafana
Token Claim Name: roles
Multivalued: ON
Add to ID token: ON
Add to access token: ON
Add to userinfo: ON
```

### Group Membership Mapper

```
Name: Group Mapper
Mapper Type: Group Membership
Token Claim Name: groups
Full group path: OFF
Add to ID token: ON
Add to access token: OFF
Add to userinfo: ON
```

## 高级角色映射

### 基于属性的角色映射

在 Keycloak 中设置用户属性：

1. 进入 **Users** → 选择用户 → **Attributes**
2. 添加属性：`grafana_role = admin`

Grafana 配置：

```ini
[auth.generic_oauth]
role_attribute_path = attributes.grafana_role || 'Viewer'
```

### 多组织角色映射

Grafana 支持多个组织的不同角色：

```ini
[auth.generic_oauth]
role_attribute_strict = false
```

在 Keycloak 中配置复合角色：

```
org1-admin (复合角色)
├── org1-admin-role
└── grafana-role: Admin

org2-editor (复合角色)
├── org2-editor-role
└── grafana-role: Editor
```

### 动态角色映射

使用 Keycloak 的 Script Mapper：

```javascript
// 根据用户属性动态分配角色
var role = 'Viewer';
if (user.getAttributes().get('department').contains('engineering')) {
    role = 'Editor';
}
if (user.getAttributes().get('title').contains('manager')) {
    role = 'Admin';
}
exports = role;
```

## 角色分配策略

### 按部门分配

| 部门 | Keycloak 组 | Grafana 角色 |
|------|-------------|--------------|
| 运维部 | ops-team | Admin |
| 开发部 | dev-team | Editor |
| 测试部 | qa-team | Editor |
| 产品部 | product-team | Viewer |

### 按项目分配

```
Project A
├── project-a-admin → Admin
├── project-a-editor → Editor
└── project-a-viewer → Viewer

Project B
├── project-b-admin → Admin
└── project-b-viewer → Viewer
```

## 验证角色映射

### 1. 检查 Keycloak 配置

```bash
# 获取 token
curl -X POST https://keycloak.example.com:8443/realms/grafana/protocol/openid-connect/token \
  -d "client_id=grafana" \
  -d "client_secret=SECRET" \
  -d "username=testuser" \
  -d "password=testpass" \
  -d "grant_type=password"
```

### 2. 解码 JWT Token

在 https://jwt.io 解码 id_token，检查 payload：

```json
{
  "roles": ["admin", "editor"],
  "groups": ["ops-team", "project-a"],
  "preferred_username": "testuser"
}
```

### 3. 验证 Grafana 角色

登录 Grafana 后：

1. 进入 **Administration** → **Users**
2. 查看用户的角色分配
3. 检查是否为预期角色

## 故障排除

### 角色不生效

**检查清单**:
1. ✅ Keycloak 中用户已分配角色
2. ✅ Mapper 配置正确（Token Claim Name: roles）
3. ✅ Mapper 添加到 ID token
4. ✅ Grafana role_attribute_path 语法正确
5. ✅ Grafana 已重启

### 调试日志

启用 Grafana 调试日志：

```ini
[log]
level = debug

[auth.generic_oauth]
# 添加调试信息
```

查看日志：

```bash
docker-compose logs grafana | grep -i "oauth\|role"
```

## 最佳实践

1. **使用 Realm Roles**：比 Client Roles 更易管理
2. **使用组管理**：将角色分配给组，用户加入组
3. **最小权限原则**：默认给 Viewer，按需提升
4. **定期审计**：检查用户角色分配是否合理
5. **文档化**：记录角色映射规则和用途

## 下一步

- [团队同步](./team-sync) - Grafana Enterprise 团队同步配置
- [用户管理](./user-management) - 管理用户和角色分配
