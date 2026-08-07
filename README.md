# 全栈 Dashboard 应用

基于 **Next.js 16 + MUI 9 + NestJS 11 + PostgreSQL** 的全栈项目，实现了用户注册/登录认证、可扩展导航栏，以及用户管理和公司管理两个数据表格页面（含 CSV 数据导入）。

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
| 认证 | JWT (passport-jwt) | 24h 有效期 |
| 密码加密 | bcrypt | salt rounds = 10 |
| CSV 解析 | csv-parse | |
| 包管理器 | npm | |

---

## 功能特性

- **认证**：注册 / 登录 / JWT 鉴权
- **用户管理**：表格展示、姓名搜索、role 多选过滤、添加/编辑/删除、批量删除、分页
- **公司管理**：可折叠表格、公司名搜索、level 多选过滤、盈利效率着色、分页
- **数据可视化 Dashboard**：4 张数据卡（大数字换算）、环形图（level 占比+交互）、折线图（累积增长趋势+交互）
- **数据导入**：启动时自动从 CSV 导入 2000 条公司 + 关系数据
- **可扩展导航栏**：Tab 数组定义，新增页面只需加一行

---

## 项目结构

```
project1/
├── .gitignore
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
│       │   ├── dashboard.controller.ts # GET /api/dashboard
│       │   └── dashboard.service.ts  # 聚合计算（数据卡+level分布+年份趋势）
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

- Node.js >= 18
- PostgreSQL 运行中（Docker 或本地安装）
- npm

### 1. 配置数据库

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
```

### 2. CSV 数据（已包含）

`backend/data/` 目录已包含 `companies_0708.csv` 和 `relationships_0708.csv`，后端首次启动时自动导入 2000 条公司 + 2000 条关系数据，无需手动操作。

### 3. 启动后端

```bash
cd backend
npm install
npm run start:dev
```

后端启动在 **http://localhost:3001**，自动建表 + 导入 CSV 数据。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动在 **http://localhost:3000**。

---

## API 文档

### 认证接口 `/api/auth`

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/signup | 注册 |
| POST | /api/auth/login | 登录（返回 JWT） |
| GET | /api/auth/me | 获取当前用户（需 token） |

### 用户管理接口 `/api/users`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/users?role=Admin,Manager&search=张 | 列表（role 多选过滤 + 姓名搜索） |
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
| GET | /api/companies?level=1,2&search=Doyle | 列表（level 多选过滤 + 公司名搜索，含盈利效率） |
| GET | /api/companies/:code | 单个公司 |
| POST | /api/companies | 创建公司 |
| PATCH | /api/companies/:code | 更新公司 |
| DELETE | /api/companies/:code | 删除公司 |

> 盈利效率 = `annual_revenue / employees`，后端计算后返回 `profit_efficiency` 字段。

### Dashboard 接口 `/api/dashboard`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/dashboard | 一次返回所有可视化数据（后端计算聚合） |

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
| `/dashboard` | 仪表盘 | 是 | 数据卡 + 环形图 + 折线图（Chart.js 可视化） |
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