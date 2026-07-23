# 全栈 Dashboard 应用

基于 **Next.js 16 + MUI 9 + NestJS 11 + PostgreSQL** 的全栈项目，实现了用户注册/登录认证和可扩展的导航栏 Dashboard。

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
| 包管理器 | npm | |

---

## 项目结构

```
project1/
├── .gitignore
│
├── backend/                          # NestJS 后端 (:3001)
│   ├── .env.example                  # 环境变量模板
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts                   # 启动入口 (CORS + ValidationPipe)
│       ├── app.module.ts             # 根模块
│       ├── config/
│       │   └── database.config.ts    # TypeORM 数据库配置
│       ├── user/                     # 用户模块
│       │   ├── user.module.ts
│       │   ├── user.controller.ts    # POST /api/auth/signup
│       │   ├── user.service.ts       # 注册业务逻辑
│       │   ├── user.entity.ts        # 用户表实体
│       │   └── dto/                  # 请求验证
│       │       ├── sign-up.dto.ts
│       │       └── login.dto.ts
│       ├── auth/                     # 认证模块
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts    # POST /api/auth/login, GET /api/auth/me
│       │   ├── auth.service.ts       # 登录验证 + JWT 生成
│       │   └── strategies/
│       │       └── jwt.strategy.ts   # JWT 验证策略
│       └── common/guards/
│           └── jwt-auth.guard.ts     # 路由守卫
│
└── frontend/                         # Next.js 前端 (:3000)
    ├── .env.local                    # NEXT_PUBLIC_API_URL
    ├── package.json
    ├── next.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx            # 根布局 (MUI 主题)
        │   ├── page.tsx              # → redirect /login
        │   ├── (auth)/               # 无需登录
        │   │   ├── login/page.tsx
        │   │   └── signup/page.tsx
        │   └── (dashboard)/          # 需要登录
        │       ├── layout.tsx        # NavBar + AuthGuard
        │       ├── dashboard/page.tsx
        │       ├── company/page.tsx
        │       ├── order/page.tsx
        │       └── user/page.tsx
        ├── components/
        │   ├── SignUpForm.tsx        # 注册表单
        │   ├── LoginForm.tsx         # 登录表单
        │   ├── NavBar.tsx            # 可扩展导航栏
        │   ├── AuthGuard.tsx         # 路由守卫
        │   └── providers/
        │       └── MuiThemeProvider.tsx
        ├── lib/
        │   ├── api-client.ts         # Axios 封装 (token 拦截器)
        │   └── auth.ts              # localStorage token 管理
        └── types/
            └── api.ts               # TypeScript 接口定义
```

---

## 快速开始

### 前置条件

- Node.js >= 18
- PostgreSQL 运行中（Docker 或本地安装）
- npm

### 1. 配置数据库

```bash
# 创建 .env 文件（参考 .env.example）
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，填入你的数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=devuser
DB_PASSWORD=devpass
DB_DATABASE=week1_env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### 2. 启动后端

```bash
cd backend
npm install
npm run start:dev
```

后端启动在 **http://localhost:3001**，TypeORM 自动创建 `user` 表。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动在 **http://localhost:3000**。

---

## API 文档

### POST /api/auth/signup — 注册

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "confirmPassword": "123456"
}
```

**响应：**

| 状态码 | 说明 | 响应体 |
|---|---|---|
| 201 | 注册成功 | `{ statusCode: 201, message: "User registered successfully", data: { id, email, createdAt } }` |
| 400 | 验证失败 | `{ statusCode: 400, message: string[], error: "Bad Request" }` |
| 409 | 邮箱已存在 | `{ statusCode: 409, message: "Email already registered", error: "Conflict" }` |

### POST /api/auth/login — 登录

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**响应：**

| 状态码 | 说明 | 响应体 |
|---|---|---|
| 200 | 登录成功 | `{ statusCode: 200, message: "Login successful", data: { accessToken, user: { id, email } } }` |
| 400 | 验证失败 | `{ statusCode: 400, message: string[], error: "Bad Request" }` |
| 401 | 邮箱或密码错误 | `{ statusCode: 401, message: "Invalid email or password", error: "Unauthorized" }` |

> 邮箱不存在和密码错误返回相同的信息，防止黑客枚举有效邮箱。

### GET /api/auth/me — 获取当前用户信息

**请求头：** `Authorization: Bearer <token>`

**响应：**

| 状态码 | 说明 | 响应体 |
|---|---|---|
| 200 | 成功 | `{ statusCode: 200, data: { id, email, createdAt } }` |
| 401 | 未登录或 token 过期 | `{ statusCode: 401, message: "Unauthorized", error: "Unauthorized" }` |

---

## 数据库表结构

### user 表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | SERIAL | PRIMARY KEY | 自增主键 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 用户邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 加密后的密码 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

---

## 前端路由

| 路径 | 页面 | 需要登录 | 布局 |
|---|---|---|---|
| `/` | 重定向到 /login | 否 | — |
| `/login` | 登录页 | 否 | (auth) |
| `/signup` | 注册页 | 否 | (auth) |
| `/dashboard` | 仪表盘 | 是 | (dashboard) |
| `/company` | 公司管理 | 是 | (dashboard) |
| `/order` | 订单管理 | 是 | (dashboard) |
| `/user` | 用户管理 | 是 | (dashboard) |

---

## 安全设计

- **密码加密**：使用 bcrypt（salt rounds = 10）存储密码哈希，不可逆
- **防邮箱枚举**：登录失败统一返回 "Invalid email or password"，不区分邮箱是否存在
- **JWT 认证**：24h 有效期，无状态，无需服务端存储 session
- **自动拦截**：401 响应自动清除 token 并跳转到登录页
- **输入验证**：前端 + 后端双重验证，`class-validator` 装饰器 + `ValidationPipe`

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