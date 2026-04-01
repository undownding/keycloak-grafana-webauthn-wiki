# 团队同步

本章节介绍 Grafana Enterprise/Cloud 的团队同步功能。

## 什么是团队同步

团队同步（Team Sync）允许将 Keycloak 中的组（Groups）自动映射到 Grafana 的团队（Teams），实现：

- 自动将用户添加到对应团队
- 基于组的权限管理
- 减少手动维护工作量

## 前提条件

- Grafana Enterprise 或 Grafana Cloud
- Keycloak 组配置
- Group Membership Mapper

## Keycloak 配置

### 创建组

1. 进入 **Groups** → **Create group**
2. 创建以下组：
   - `grafana-team-frontend`
   - `grafana-team-backend`
   - `grafana-team-ops`

### 添加用户到组

1. 进入 **Users** → 选择用户
2. **Groups** → **Join Group**
3. 选择对应的组

### 配置 Group Mapper

1. 进入 **Clients** → **grafana** → **Mappers**
2. **Add mapper** → **By configuration** → **Group Membership**

```
Name: Group Mapper
Mapper Type: Group Membership
Token Claim Name: groups
Full group path: OFF
Add to ID token: ON
Add to access token: OFF
Add to userinfo: ON
```

## Grafana 配置

### 启用团队同步

编辑 `grafana.ini`：

```ini
[auth.generic_oauth]
# 启用团队同步
groups_attribute_path = groups

# 团队映射（可选）
team_ids_attribute_path = groups
```

或使用环境变量：

```bash
GF_AUTH_GENERIC_OAUTH_GROUPS_ATTRIBUTE_PATH=groups
```

### 创建团队

1. 登录 Grafana
2. 进入 **Administration** → **Teams** → **New Team**
3. 创建与 Keycloak 组对应的团队：
   - `team-frontend`
   - `team-backend`
   - `team-ops`

### 配置团队同步

1. 进入团队详情页
2. **External group sync** 标签页
3. 点击 **Add group**
4. 输入 Keycloak 组名（如 `grafana-team-frontend`）
5. 点击 **Save**

## 团队权限管理

### 文件夹权限

1. 进入 **Dashboards** → 选择文件夹
2. **Permissions** → **Add permission**
3. 选择 **Team** → 选择对应团队
4. 设置权限级别：
   - **Admin**: 完全控制
   - **Editor**: 编辑仪表板
   - **Viewer**: 只读访问

### 数据源权限

1. 进入 **Connections** → **Data sources**
2. 选择数据源 → **Permissions**
3. 添加团队权限

## 高级配置

### 组名映射

如果 Keycloak 组名和 Grafana 团队名不一致：

```ini
[auth.generic_oauth]
# 使用 JMESPath 转换组名
groups_attribute_path = groups | map(&replace(@, 'keycloak-prefix-', ''), @)
```

或使用 Grafana 的团队映射功能：

1. 进入 **Administration** → **Authentication** → **Keycloak**
2. **Team mapping** 部分
3. 添加映射规则：
   - Keycloak Group: `grafana-team-frontend`
   - Grafana Team: `frontend`

### 嵌套组支持

Keycloak 支持嵌套组，Grafana 会同步所有父组和子组成员。

示例结构：
```
grafana-users
├── grafana-team-frontend
│   └── user1
├── grafana-team-backend
│   └── user2
└── grafana-team-ops
    └── user3
```

配置：
```ini
[auth.generic_oauth]
# 包含完整路径
groups_attribute_path = groups
```

### 条件同步

只同步特定前缀的组：

```ini
[auth.generic_oauth]
# 只同步以 'grafana-' 开头的组
groups_attribute_path = groups[?starts_with(@, 'grafana-')] || [`no-groups`]
```

## 验证团队同步

### 1. 检查 Token

获取 JWT token 并检查 groups 声明：

```json
{
  "groups": [
    "grafana-team-frontend",
    "grafana-team-backend"
  ]
}
```

### 2. 查看 Grafana 团队

1. 用户登录 Grafana
2. 进入 **Administration** → **Users** → 选择用户
3. 查看 **Teams** 部分

### 3. 检查同步日志

```bash
docker-compose logs grafana | grep -i "team\|group"
```

## 故障排除

### 团队不同步

**检查清单**:
1. ✅ Grafana Enterprise 或 Cloud 版本
2. ✅ Group Mapper 配置正确
3. ✅ `groups_attribute_path` 配置正确
4. ✅ Keycloak 组名与 Grafana 团队映射正确
5. ✅ 用户已分配到 Keycloak 组

### 组名不匹配

**症状**: 用户登录后没有加入预期团队

**解决**:
1. 检查 Keycloak token 中的组名
2. 确认 Grafana 中的团队名
3. 在 Grafana 团队设置中添加正确的 Keycloak 组名

### 权限不生效

**症状**: 用户加入团队但无法访问资源

**解决**:
1. 检查文件夹/数据源权限配置
2. 确认团队权限级别正确
3. 清除浏览器缓存重新登录

## 最佳实践

1. **命名规范**: 使用统一的前缀（如 `grafana-team-`）
2. **层级设计**: 按项目或部门设计组结构
3. **最小权限**: 默认不给权限，按需分配
4. **定期审计**: 检查团队同步状态和权限分配
5. **文档化**: 记录组结构和权限映射关系

## 示例场景

### 多项目团队

**Keycloak 组结构**:
```
grafana-project-a
├── grafana-project-a-admin
└── grafana-project-a-dev

grafana-project-b
├── grafana-project-b-admin
└── grafana-project-b-dev
```

**Grafana 团队**:
- `project-a-admin` → 项目 A 管理员
- `project-a-dev` → 项目 A 开发者
- `project-b-admin` → 项目 B 管理员
- `project-b-dev` → 项目 B 开发者

### 部门权限

**Keycloak 组**:
- `grafana-dept-engineering`
- `grafana-dept-product`
- `grafana-dept-qa`

**Grafana 权限**:
- Engineering: 所有数据源编辑权限
- Product: 只读访问生产数据
- QA: 测试环境完全权限

## 下一步

- [安全加固](./security) - 安全配置最佳实践
- [高可用部署](./ha-deployment) - 大规模部署方案
