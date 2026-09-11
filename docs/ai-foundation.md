# AI 核心能力：配置与验收

## 范围

在已有 NestJS `ai-agent` 模块内扩展四类数据 CRUD、用户/租户隔离及 Redis 服务；保留原前端聊天体验和历史消息。不开发意图识别、自动业务写操作、完整 LangGraph 编排或模型调用缓存。

## 启动

1. 启动 Docker Desktop，在项目根目录执行 `docker compose up -d`。
2. `cd backend`，执行 `npm ci`。根据 `.env.example` 在本地 `.env` 配置数据库、Redis、模型和 AI 权限。不要提交密钥。
3. 执行 `npm run build`，再执行 `npm run start:prod`（开发可用 `npm run start:dev`）。启动自动执行 TypeORM 迁移，不使用 synchronize。
4. 前端执行 `npm ci` 和 `npm run dev`，打开 http://localhost:3000；Swagger 为 http://localhost:3001/api/docs。

## 租户及管理员

```dotenv
AI_DEFAULT_TENANT=default
AI_TENANT_USERS={}
AI_ADMIN_USER_IDS=
AI_SESSION_TTL_SECONDS=7200
AI_CHAT_TTL_SECONDS=600
AI_TASK_TTL_SECONDS=7200
AI_CHAT_CACHE_ENABLED=true
AI_CACHE_CHAT_ENABLED=true
AI_CACHE_COMPANY_ENABLED=true
AI_CACHE_COMPANY_TTL_SECONDS=600
```

本地默认单租户，不自动授予任何人 AI 审计管理权限。多租户示例（用户 ID 必须实际存在）：

```dotenv
AI_TENANT_USERS={"101":"tenant_a","102":"tenant_a","103":"tenant_b"}
AI_ADMIN_USER_IDS=102,103
```

非空映射表示启用严格成员模式，未配置的用户返回 403。服务端每次鉴权后按可信用户 ID 获取当前 AI 租户；请求体不允许指定所有者或租户，客户端租户请求头不起作用。业务 profile 的 Admin 字段不自动授予 AI 管理权限，避免通过业务用户管理接口自行提权。

管理员仅可查看其租户的全部审计；对会话、记忆和任务仍执行本人权限。跨租户、跨用户的记录 ID 统一返回 404。列表的 userId 过滤不能扩大访问范围。

这是当前无租户业务表项目的服务端配置映射方案，不是租户管理平台。改变映射不会自动搬迁旧数据；需经明确授权执行 AI 数据迁移。正式接入组织/IAM 时，应替换映射解析器，不应接受未经校验的客户端 tenantId。

## 数据库

迁移：`backend/src/migrations/2026090900000-AiFoundation.ts`。

| 表 | 字段/约束 | 索引与关联 |
|---|---|---|
| ai_chat_session | UUID id；非空 tenant_id/user_id；title 120；provider 30；model 80 可空；active/closed；version；时间戳 | 用户 FK；tenant_id/user_id/updated_at；id/tenant_id/user_id 唯一约束 |
| ai_user_memory | UUID id；kind 40；key 120；value JSONB；可空 session_id/expires_at；version；时间戳 | 用户 FK；tenant/user/kind/key 唯一；tenant/user/updated_at 索引；同租户同用户会话复合 FK |
| ai_task_record | UUID id；type 80；pending/running/completed/failed/cancelled；progress 0–100；input/result JSONB；错误摘要；version；执行时间 | 用户 FK；tenant/user/status/created_at 索引；同租户同用户会话复合 FK |
| ai_operation_audit | UUID id；tenant_id；所属用户和操作者；action/resource/resource_id；success/failure；request_id；脱敏 details；correction/deleted_at；created_at | 用户及操作者 FK，删除用户时置空、保留日志；tenant/user/created_at 及 tenant/resource/resource_id 索引 |

四张核心表之外继续保留已有 `ai_chat_messages`。旧 `ai_chat_sessions` 通过改名迁移，旧 ID、消息和外键保留。默认给历史会话补入 `AI_DEFAULT_TENANT`，迁移时若配置了用户映射则按映射回填。

原 `user`、`user_profile`、`company`、`relationship` 表结构不变。用户删除会级联删除自己的会话、记忆和任务；审计记录不级联删除。会话删除会清理消息，并将关联记忆和任务的 session_id 置空。

回滚会删除本次新增的记忆、任务和审计表，并将会话表恢复旧名称；已有新数据时必须先备份，不能将回滚当作普通重启。

## API

统一前缀 `/api/ai-agent`，全部经过 JWT 和 AI 租户校验。

| 资源 | 方法/路径 | 说明 |
|---|---|---|
| 会话 | POST/GET `/sessions`；GET/PATCH/DELETE `/sessions/:id` | 列表分页；详情带消息；关闭会话清缓存 |
| 记忆 | POST/GET `/memories`；GET/PATCH/DELETE `/memories/:id` | 列表排除过期记忆；按 ID 仍可管理过期记录 |
| 任务 | POST/GET `/tasks`；GET/PATCH/DELETE `/tasks/:id` | 校验状态流转；完成时进度为 100 |
| 审计 | POST/GET `/audits`；GET/PATCH/DELETE `/audits/:id` | 管理员写入；普通用户只读自己的日志 |
| 临时状态 | GET/PUT `/tasks/:id/state` | PUT `{state:{...},ttlSeconds:7200}`；过期后 state=null |
| 业务工具 | POST `/tools/companies/filter` | 复用 DashboardService.getCompaniesByFilter，不重新编写业务查询 |
| 对话 | POST `/chat` | 保持现有消息返回结构，新增 cacheHit 和可选 toolResult |

分页参数：`page` 默认 1，`pageSize` 默认 20、最大 100，可选 `userId`；响应 `{items,total,page,pageSize}`。旧会话列表由数组改为分页对象，当前前端使用按 ID 恢复，不受影响。

审计 CRUD 为受控实现：普通用户不能创建、修改或删除；管理员创建记录标记 `manual.` 前缀；PATCH/DELETE 必须提供 `{reason:"原因"}`。PATCH 只修改 correction，DELETE 只设置 deleted_at，原始事件不被覆盖或物理删除，并生成一条新的变更审计。软删除记录仍可查询以保留证据。此设计不是独立的防篡改合规审计系统。

模型和聊天内容不写入审计详情；敏感字段与常见 API key 格式脱敏。禁止把完整凭据或原始聊天复制到审计备注。

## 调用既有 Service

本周通过工具接口和显式参数验证既有 Service 的接入，保持原有聊天界面。普通文本聊天不自动执行公司查询；不新增自然语言快捷匹配、聊天命令、查询按钮、来源卡片或新对话入口。

也可对 `/chat` 发送显式工具参数：

```json
{
  "sessionId": "会话 UUID",
  "message": "请总结中国供应公司的等级分布",
  "companyQuery": {
    "dimension": "level",
    "filter": { "country": ["China"] }
  }
}
```

后端只调用白名单中的公司聚合 Service，将返回结果作为数据交给模型解释。Mock 模型仅用于链路验证，不会真实分析结果；接口返回可核对的 toolResult。此处是显式 Service 调用，不宣称实现了自然语言意图识别或自主工具规划。

现有公司业务表是共享业务数据，不是租户私有数据；AI 记录与缓存按租户和用户隔离。若将来业务公司数据也需要租户私有化，需要另行设计业务权限/数据模型，不能仅靠 AI 缓存隔离实现。

## Redis

所有 AI Redis 操作集中在 `AiCacheService`。

| 前缀 | 实现 |
|---|---|
| ai:session: | tenant/user/session；最近 10 轮完整问答；默认 7200 秒；成功写入刷新 TTL；关闭/删除清理；未命中或故障从 PostgreSQL 最近消息恢复 |
| ai:chat_cache: | tenant/user/业务维度/哈希；默认 600 秒；相同问句还校验历史上下文、模型配置与业务版本；带附件不复用结果缓存 |
| ai:llm_cache: | 只定义前缀，未实现模型调用缓存 |
| ai:task_state: | tenant/user/task；state 与 checkpoints 分开保存；默认 7200 秒；可配置 TTL；必要状态存储不可用返回 503 |

10 轮指最多 20 条已完成的 user/assistant 消息，当前待回答问题另加。数据库持久化完整历史；一轮模型失败不会留下半轮记录。发送、关闭、更新、删除会话使用 PostgreSQL advisory transaction lock 串行化，锁等待超时返回 409；缓存附带版本，避免回滚后错误复用。并发安全不等于请求幂等：两次独立发送仍视为两条请求，客户端不要盲目自动重试已成功的发送。

聊天缓存使用业务维度版本进行失效。现有 Company/Relationship/User/Profile 的 TypeORM 写入在事务提交后触发失效；旧请求即使随后写回，也使用旧版本 Key，不能成为新查询结果。无事务写入立即失效。手工 SQL/外部导入绕过 TypeORM 时，调用统一 `invalidateBusiness` 或重启缓存使用方。Redis 连接恢复会换用新缓存 epoch，避免复用故障期间可能过时的结果；未实现持久化失效 outbox。

## Checkpointer

安装并基于 `@langchain/langgraph-checkpoint` 的 `BaseCheckpointSaver` 实现 `AiRedisCheckpointer`。通过 `AiCheckpointerService.forTask(context, taskId)` 获取实例，不开放未鉴权的 Redis/checkpoint 通用接口。

- 实现 getTuple/list/put/putWrites/deleteThread，继承基础版本及 delta history 行为。
- 复用官方 MemorySaver 的序列化和检查点语义，将其快照持久化至统一 Redis 服务；不是只存在进程内的 MemorySaver。
- 绑定一个已授权任务，thread_id 必须等于任务 UUID；每次操作重新检查数据库权限，namespace 和 checkpoint ID 保留。
- 支持父检查点、中间写入及命名空间；Redis CAS 和任务锁防止并发覆盖。
- 单任务快照上限 4 MiB，默认 2 小时过期。过期后不能恢复完整图执行现场，数据库任务摘要不等于 checkpoint；未来长期任务需使用持久化 Checkpointer 策略。
- 本周完成接口适配及契约测试，没有实现或验收完整 LangGraph 工作流。

## 测试与交付

```powershell
cd backend
npm run build
npm run test:e2e -- --runInBand
npx eslint "src/ai-agent/**/*.ts" src/migrations/2026090900000-AiFoundation.ts test/ai-foundation.e2e-spec.ts

cd ../frontend
npm run lint
npm run build
npm run test:dashboard

cd ../postman
npx newman run ai.postman_collection.json
```

AI E2E 包括：迁移与回滚保留历史、业务列不变、JWT、DTO 校验、分页、四类 CRUD、同租户越权、跨租户管理员越权、复合外键、审计保留与脱敏、10 轮截断、真实 TTL 过期、缓存恢复、聊天缓存上下文隔离、开关、业务写入失效、并发消息、模型失败回滚、模拟 Redis 不可用降级及 Checkpointer 契约。测试创建独立用户/公司夹具并清理，不调用收费模型。

Postman 集合适用于本地单租户开发模式，44 个顺序请求，自动生成临时账号。真实跨租户和管理员场景由 E2E 覆盖，不将普通 Postman 请求数当作这些场景的测试结果。响应速度断言默认 5 秒，属于接口耗时检查，不是负载/容量测试。

本次实际验收结果：

| 检查 | 结果 |
|---|---|
| 后端生产构建 | 通过 |
| 后端 E2E | 45/45 通过（原有 14 项 + AI 基础能力 31 项） |
| AI 模块、迁移及新测试文件 ESLint | 通过 |
| 前端全项目 lint / 生产构建 | 通过 |
| Dashboard 计算测试 | 4/4 通过 |
| Postman / Newman | 44 请求、189 断言全部通过；本次本机 Mock 测试平均 16 ms、最大 109 ms，不代表生产负载能力 |
| OpenAPI 导出检查 | 43 个现有接口通过，含 AI Records 17、AI Tools 1、AI Agent 7 |
| Docker | PostgreSQL 和 Redis 均 healthy |
| 真实模型 + Service + 历史持久化 | 当前服务报告模型为 DeepSeek `deepseek-flash`，返回“公司总数为2000家。”，工具返回有效，重新加载得到 2 条消息；约 1.4 秒 |

### 本周需求逐项核对

| 需求 | 核对结论 |
|---|---|
| 4 张 AI 核心表、字段约束、索引、用户关联 | 已实现；迁移测试验证旧会话保留及原业务表列不变 |
| 独立 Entity、校验 DTO、CRUD、分页、用户筛选、ID 查询 | 已实现；审计采用管理员受控更正和软删除，保留原始事件 |
| JWT、用户/租户隔离、管理员审计查询 | 已实现；普通用户仅本人，管理员审计仅本租户；越权场景 E2E 通过 |
| Redis 统一入口和 4 类 Key 前缀 | 已实现；AI Redis 访问集中于 AiCacheService |
| 最近 10 轮、2 小时 TTL、追加、关闭清理、数据库兜底 | 已实现；截断、过期、关闭、并发和故障回退测试通过 |
| 聊天结果 10 分钟缓存、按业务配置、业务更新失效 | 已实现；同时校验上下文和模型，避免同问句错误复用；TypeORM 提交后失效 |
| 模型调用缓存 placeholder | 按要求仅预留前缀，不开发模型调用缓存 |
| 任务状态读写、TTL、LangGraph Checkpointer 兼容 | 已实现状态接口及 Checkpointer 契约测试，不包含完整图编排 |
| 调用现有封装 Service/API | 显式 companyQuery 和工具接口复用现有 Service；真实模型联调通过，不包含自动意图识别 |

可选真实模型验证：启动后端后执行 `node scripts/verify-ai-live.mjs`。该脚本使用服务端默认模型，会产生少量模型 API 费用；创建、删除独立测试账号，不打印密钥或 token。严格租户映射模式下需改为使用已配置成员，不能通过放开生产租户权限来运行测试。

按任务范围撤回额外添加的快捷问法及相关 UI；不以某句硬编码问法的回复作为 Agent 能力验收依据。验收以 CRUD、鉴权隔离、缓存行为、Checkpointer 契约及既有 Service 显式调用测试为准。

依赖审查另发现现有生产依赖链仍有 npm audit 告警（Multer/Nest 链、csv-parse、qs）。本次未执行可能破坏项目的 `npm audit fix --force`，不将功能验收结果表述为生产安全认证；上线前需要单独处理依赖升级与回归。
