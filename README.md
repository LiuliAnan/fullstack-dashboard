# 全栈 Dashboard 应用

基于 **Next.js 16 + MUI 9 + NestJS 11 + PostgreSQL/pgvector** 的全栈项目，实现 JWT 认证、用户和公司管理、CSV 数据导入，以及可交互的数据可视化 Dashboard。

---

## 技术栈

| 层级 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Next.js | 16.2.10 |
| UI 组件库 | MUI (Material UI) | 9.2.0 |
| HTTP 客户端 | axios | 1.x |
| 后端框架 | NestJS | 11.x |
| ORM | TypeORM | 1.x |
| 数据库 | PostgreSQL 16 | Docker |
| 向量扩展 | pgvector | Docker 镜像内置，迁移自动启用 |
| 缓存基础设施 | Redis 7 | Docker（已准备，当前业务未接入缓存） |
| 图表 | Chart.js + react-chartjs-2、D3 | 4.x / 5.x / 7.x |
| 认证 | JWT (passport-jwt) | 24h 有效期 |
| 密码加密 | bcrypt | salt rounds = 10 |
| CSV 解析 | csv-parse | |
| 包管理器 | npm | |

---

## 功能特性

- **认证**：注册 / 登录 / JWT 鉴权
- **用户管理**：表格展示、姓名搜索、role 多选过滤、添加/编辑/删除、批量删除、分页
- **公司管理**：可折叠表格、公司名搜索、level 多选过滤、盈利效率着色、分页
- **数据可视化 Dashboard**：4 张数据卡、level 环形图、成立年份累计折线图
- **Company Data Explorer**：Bar/Bubble Tab、动态条形图、D3 可缩放层级气泡图、组合过滤、多选 Chip、双端范围 Slider 和 Tooltip
- **RESTful API**：认证、User/Company CRUD、分页筛选、Dashboard 聚合及条形图组合检索
- **API 文档**：Swagger UI + OpenAPI JSON
- **数据导入**：启动时自动从 CSV 导入 2000 条公司 + 关系数据
- **可扩展导航栏**：Tab 数组定义，新增页面只需加一行

---

## 项目结构

```
project1/
├── .gitignore
├── compose.yaml                     # PostgreSQL/pgvector + Redis
├── README.md
│
├── backend/                          # NestJS 后端 (:3001)
│   ├── .env.example                  # 环境变量模板
│   ├── data/                         # CSV 数据（已包含，上传 git）
│   │   ├── companies_0708.csv
│   │   └── relationships_0708.csv
│   ├── package.json
│   └── src/
│       ├── main.ts                   # 启动入口 (CORS + ValidationPipe)
│       ├── app.module.ts             # 根模块
│       ├── config/database.config.ts # TypeORM 配置
│       ├── user/                     # 用户模块
│       │   ├── user.entity.ts        # user 表
│       │   ├── user-profile.entity.ts# user_profile 表（1:1）
│       │   ├── user.module.ts
│       │   ├── user.controller.ts    # POST /api/auth/signup
│       │   ├── user-manage.controller.ts # /api/users CRUD
│       │   ├── user.service.ts       # 认证 + CRUD 业务
│       │   └── dto/                  # sign-up / login / create-user / update-user
│       ├── auth/                     # 认证模块
│       │   ├── auth.controller.ts    # POST /api/auth/login, GET /api/auth/me
│       │   ├── auth.service.ts
│       │   └── strategies/jwt.strategy.ts
│       ├── company/                  # 公司模块
│       │   ├── company.entity.ts     # company 表
│       │   ├── relationship.entity.ts# relationship 表
│       │   ├── company.module.ts
│       │   ├── company.controller.ts # /api/companies CRUD
│       │   ├── company.service.ts    # CRUD + 联表 + 盈利效率
│       │   ├── seed.service.ts       # CSV 启动时自动导入
│       │   └── dto/                  # create-company / update-company
│       ├── dashboard/                # 数据可视化模块
│       │   ├── dashboard.module.ts
│       │   ├── dashboard.controller.ts # Dashboard、Bar、Bubble API
│       │   ├── dto/bar-chart-query.dto.ts
│       │   ├── dto/bubble-chart-query.dto.ts
│       │   └── dashboard.service.ts  # 聚合、组合过滤与层级树构建
│       ├── migrations/               # 建表、约束、pgvector 扩展
│       └── common/guards/jwt-auth.guard.ts
│
└── frontend/                         # Next.js 前端 (:3000)
    ├── .env.local
    └── src/
        ├── app/
        │   ├── layout.tsx            # 根布局 (MUI 主题)
        │   ├── page.tsx              # -> redirect /login
        │   ├── (auth)/               # login / signup
        │   └── (dashboard)/          # dashboard / company / order / user
        ├── components/
        │   ├── SignUpForm.tsx / LoginForm.tsx
        │   ├── NavBar.tsx / AuthGuard.tsx
        │   ├── UserTable.tsx / UserToolbar.tsx / UserFormDialog.tsx
        │   ├── CompanyTable.tsx / CompanyToolbar.tsx
        │   ├── DashboardStatsCards.tsx / DashboardLevelChart.tsx / DashboardFoundedTrend.tsx
        │   ├── DashboardCompanyBarChart.tsx # Bar/Bubble Tab 与共享过滤面板
        │   ├── DashboardCompanyBubbleChart.tsx # D3 可缩放层级气泡图
        │   └── providers/MuiThemeProvider.tsx
        ├── lib/
        │   ├── api-client.ts         # Axios 封装 (token 拦截器)
        │   ├── auth.ts               # token 管理
        │   ├── constants.ts          # 共享常量 (role/status/level)
        │   ├── format.ts            # 大数字换算 (K/M/B)
        │   ├── profit-color.ts       # 盈利效率着色函数
        │   └── dashboard-mock.ts     # Dashboard mock 数据（开发用）
        └── types/api.ts
```

---

## 快速开始

### 前置条件

- Node.js >= 20（Next.js 16 推荐）
- Docker Desktop（推荐，用于 PostgreSQL/pgvector 和 Redis）
- npm

### 1. 配置数据库

启动 PostgreSQL/pgvector 和 Redis：

```bash
docker compose up -d
docker compose ps
```

容器使用持久化卷 `env_postgres_data` 和 `env_redis_data`，重启或重建容器不会删除数据。

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=devuser
DB_PASSWORD=devpass
DB_DATABASE=week1_env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. CSV 数据（已包含）

`backend/data/` 目录已包含 `companies_0708.csv` 和 `relationships_0708.csv`，后端首次启动时自动导入 2000 条公司 + 2000 条关系数据，无需手动操作。

### 3. 启动后端

```bash
cd backend
npm install
npm run start:dev
```

后端启动在 **http://localhost:3001**。启动时 TypeORM 自动执行迁移完成建表、约束和 pgvector 扩展配置；空数据库会自动导入 CSV。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动在 **http://localhost:3000**。

常用地址：

| 服务 | 地址 |
|---|---|
| 登录 | http://localhost:3000/login |
| Dashboard | http://localhost:3000/dashboard |
| Swagger UI | http://localhost:3001/api/docs |
| OpenAPI JSON | http://localhost:3001/api/docs-json |

### 5. 运行自动化测试

后端 E2E（注册事务、JWT、分页筛选、Dashboard、批量删除）：

```bash
cd backend
npm run test:e2e -- --runInBand
```

前端 Dashboard 纯计算测试：

```bash
cd frontend
npm run test:dashboard
```

生产构建：

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

> 当前生产构建与自动化测试均通过。项目仍有既存 ESLint/Prettier 告警，详见“已知说明”。

---

## API 文档

启动后端后访问 Swagger UI：`http://localhost:3001/api/docs`。OpenAPI JSON 位于 `http://localhost:3001/api/docs-json`。受保护接口可在 Swagger 的 **Authorize** 中填写登录返回的 JWT。

当前 18 条后端接口已经全部纳入 Swagger，包含请求 DTO、字段校验约束、JWT 安全标记、路径/查询参数、成功响应及常见 400/401/404/409 异常响应。相关交付物：

- `docs/openapi.json`：从运行中的 NestJS 服务导出的 OpenAPI 3 文档
- `output/pdf/swagger.pdf`：12 页 A4 Swagger 打印版
- `postman/reports/screenshots/swagger-ui.png`：Swagger UI 截图

重新导出并校验文档：

```bash
cd backend
node scripts/export-openapi.mjs ../docs/openapi.json
```

### Postman 自动化接口测试

`postman/api.postman_collection.json` 覆盖全部 18 条 API，共 90 个测试请求、450 条自动断言，平均每条接口 5 个场景。测试范围包括连通性与状态码、空值与非法格式、JWT 权限、返回 JSON 内容与结构、业务值、响应时间，以及测试数据的 CRUD 创建和清理。

```bash
cd postman
npm install
npm test
```

Postman 桌面版可直接导入 collection 与 `local.postman_environment.json`。Newman 报告位于：

- `postman/reports/newman-report.html`：可视化测试报告
- `postman/reports/newman-report.json`：机器可读完整结果
- `postman/reports/screenshots/newman-summary.png`：测试结果截图

最近一次本地回归结果（2026-08-26）：90/90 请求成功，450/450 断言通过，失败和跳过均为 0。测试脚本参考 [Postman 官方测试示例](https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-examples/)，接口文档基于 [Swagger/OpenAPI 文档](https://swagger.org.cn/docs/)。

### 认证接口 `/api/auth`

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/signup | 注册 |
| POST | /api/auth/login | 登录（返回 JWT） |
| GET | /api/auth/me | 获取当前用户（需 token） |

### 用户管理接口 `/api/users`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/users?role=Admin,Manager&search=张&page=1&pageSize=10 | 分页列表（role 多选过滤 + 姓名搜索） |
| GET | /api/users/:id | 单个用户 |
| POST | /api/users | 创建用户（含 profile） |
| PATCH | /api/users/:id | 更新用户 |
| DELETE | /api/users/:id | 删除单个 |
| DELETE | /api/users | 批量删除（body: `{ ids: [1,2,3] }`） |

**创建用户请求体：**
```json
{
  "name": "张三",
  "email": "zhangsan@test.com",
  "password": "123456",
  "role": "Admin",          // Admin / Manager / Editor / User
  "status": "active"        // active / banned / pending
}
```

### 公司管理接口 `/api/companies`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/companies?level=1,2&search=Doyle&page=1&pageSize=10 | 分页列表（level 多选过滤 + 公司名搜索，含盈利效率） |
| GET | /api/companies/:code | 单个公司 |
| POST | /api/companies | 创建公司 |
| PATCH | /api/companies/:code | 更新公司 |
| DELETE | /api/companies/:code | 删除公司 |

> 盈利效率 = `annual_revenue / employees`，后端计算后返回 `profit_efficiency` 字段。

User 和 Company 列表统一返回 `{ items, total, page, pageSize }`，`page` 从 1 开始，`pageSize` 最大为 100。

### Dashboard 接口 `/api/dashboard`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/dashboard | 一次返回所有可视化数据（后端计算聚合） |
| GET | /api/dashboard/barchart/options | 返回条形图等级、国家、城市选项及数值边界 |
| POST | /api/dashboard/barchart | 按维度分组并应用组合过滤器 |
| POST | /api/dashboard/bubblechart | 应用相同组合过滤器并返回公司层级嵌套结构 |

**响应结构：**
```json
{
  "stats": { "companyCount": 2000, "totalRevenue": 182779175, "countryCount": 8, "employeeCount": 699119 },
  "levelDistribution": [{ "level": 1, "count": 1, "percentage": 0.05 }, ...],
  "foundedTrend": [{ "year": 1900, "cumulative": 1 }, ...]
}
```

- **stats**：4 个汇总指标（COUNT / SUM / COUNT DISTINCT）
- **levelDistribution**：各 level 占比（GROUP BY level + 百分比计算）
- **foundedTrend**：按成立年份的累积公司数（GROUP BY year + 遍历累加）

**动态条形图请求：**

```json
{
  "dimension": "country",
  "filter": {
    "level": [1, 2, 3],
    "country": ["China", "United States"],
    "city": [],
    "founded_year": { "start": 1950, "end": 2023 },
    "annual_revenue": { "min": 0, "max": 1000000 },
    "employees": { "min": 0, "max": 5000 }
  }
}
```

`dimension` 仅允许 `level`、`country`、`city`。数组为空表示不限制；范围端点可单独省略。响应包含匹配总数，以及各分组的 `label`、`count` 和 `percentage`。

Bubble API 请求体只需要与 Bar API 相同的 `filter`。响应的 `hierarchy` 使用虚拟根节点 `ROOT` 和递归 `children` 表达公司层级。后端先确定真正符合条件的公司，再保留这些公司的完整祖先路径；祖先节点以 `matched: false` 标记，仅用于维持关系，`total` 只统计真正命中的公司，因此层级不会因过滤而断裂，节点编码也不会重复。

**层级气泡图响应示例：**

```json
{
  "total": 1,
  "hierarchy": {
    "name": "Company network",
    "code": "ROOT",
    "level": 0,
    "value": 0,
    "children": [
      {
        "name": "Example Company",
        "code": "C001",
        "level": 1,
        "country": "China",
        "city": "Beijing",
        "foundedYear": 2000,
        "annualRevenue": 500000,
        "employees": 120,
        "value": 1,
        "matched": true,
        "children": []
      }
    ]
  }
}
```

前端使用 D3 `hierarchy`、`pack` 和 `interpolateZoom` 绘制图表：点击父级气泡进入层级，点击背景或不可缩放的叶子区域返回总览；父级气泡 Hover 时显示加粗边框和公司详情 Tooltip。SVG 使用 `viewBox`、等比例布局与 `ResizeObserver`，浏览器页面缩放或容器宽度变化时会重新计算布局。

**动态条形图响应示例：**

```json
{
  "dimension": "country",
  "total": 214,
  "data": [
    { "label": "China", "count": 120, "percentage": 56.07476635514019 },
    { "label": "United States", "count": 94, "percentage": 43.925233644859816 }
  ]
}
```

---

## 数据库表结构

### user 表（认证）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| email | VARCHAR | NOT NULL, UNIQUE | 用户邮箱 |
| password_hash | VARCHAR | NOT NULL | bcrypt 加密密码 |
| created_at / updated_at | TIMESTAMP | DEFAULT NOW() | 时间戳 |

### user_profile 表（用户资料，1:1 关联 user）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| user_id | INTEGER | UNIQUE, FK->user | 关联 user.id |
| name | VARCHAR | NOT NULL | 姓名 |
| role | VARCHAR | NOT NULL | Admin/Manager/Editor/User |
| status | VARCHAR | NOT NULL | active/banned/pending |

### company 表（公司）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| company_code | VARCHAR | PRIMARY KEY | 公司编码（C0, C01...） |
| company_name | VARCHAR | NOT NULL | 公司名 |
| level | INTEGER | NOT NULL | 等级（1-4） |
| country / city | VARCHAR | | 国家 / 城市 |
| founded_year | INTEGER | | 成立年份 |
| annual_revenue | INTEGER | | 年盈利额 |
| employees | INTEGER | | 员工数量 |

### relationship 表（公司层级关系）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| company_code | VARCHAR | PRIMARY KEY, FK->company | 公司编码 |
| parent_company | VARCHAR | NULLABLE | 父公司编码（顶级公司为 NULL） |

---

## 前端路由

| 路径 | 页面 | 需要登录 | 功能 |
|---|---|---|---|
| `/` | 重定向 /login | 否 | - |
| `/login` `/signup` | 登录 / 注册 | 否 | 认证 |
| `/dashboard` | 仪表盘 | 是 | 数据卡 + 环形图 + 折线图 + 多维组合过滤条形图 |
| `/company` | 公司管理 | 是 | 可折叠表格 + 过滤搜索 + 盈利效率着色 |
| `/user` | 用户管理 | 是 | 表格 CRUD + 批量删除 + 过滤搜索 |
| `/order` | 订单管理 | 是 | 占位 |

---

## 安全设计

- **密码加密**：bcrypt（salt rounds = 10）存储哈希，不可逆
- **防邮箱枚举**：登录失败统一返回 "Invalid email or password"
- **JWT 认证**：24h 有效期，无状态
- **自动拦截**：401 响应自动清除 token 并跳转登录页
- **双重验证**：前端 + 后端（class-validator + ValidationPipe）
- **事务保证**：创建用户/公司时多表操作用事务，全成功或全回滚

---

## 可扩展导航栏

`NavBar.tsx` 的 Tab 定义在数组中，新增 Tab 只需添加一行：

```typescript
const NAV_TABS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Company',   path: '/company' },
  { label: 'Order',     path: '/order' },
  { label: 'User',      path: '/user' },
  // 新增：
  { label: 'Settings',  path: '/settings' },
];
```

然后在 `src/app/(dashboard)/` 下创建对应的页面目录和 `page.tsx` 即可。

---

## 已知说明

- Redis 容器和环境变量已经准备完成，但当前业务没有使用 Redis 缓存或会话。
- LangGraph 和大模型属于后续 Agent 功能选型，当前业务任务尚未集成 Agent 模块。
- Company Data Explorer 当前提供 `Bar chart` / `Bubble hierarchy` Tab；两个视图共享 level、country、city、成立年份、年收入和员工数量过滤状态。
- D3 层级气泡图参考 Observable Zoomable Circle Packing 的 pack 布局、焦点切换和插值缩放逻辑，并适配当前 MUI Dashboard 风格。
- 前端全项目 lint 为 0 错误、Dashboard 计算测试 4/4 通过、Next.js 生产构建通过；后端构建和 E2E 12/12 通过。
- `.env` 不提交到 Git；请从 `backend/.env.example` 复制并设置生产环境专用的 `JWT_SECRET`。
