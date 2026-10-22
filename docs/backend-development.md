# 后端开发规范

## 模板范围

本仓库是通用服务模板，只预置常见 GET 和 POST 请求样例：

- `GET /api/v1/mock/ping`
- `POST /api/v1/mock/echo`

除日志查询和认证必需接口外，不主动扩展 PUT、PATCH、DELETE、复杂业务领域、任务队列或第三方服务。新增能力必须由具体项目需求驱动。

## 技术约束

- Python 3.12+
- FastAPI
- Pydantic Settings
- SQLAlchemy 2.x Async
- asyncpg
- Alembic
- pytest
- Ruff

## 目录职责

```text
src/app/api/       HTTP 路由与请求响应模型
src/app/core/      配置和安全能力
src/app/db/        Engine、Session 和 ORM Base
src/app/logs/      日志模型、中间件、查询模型和批量写入
migrations/        Alembic 迁移
tests/             不依赖外部 PG 的单元与接口测试
```

## API 规范

- 业务 API 使用 `/api/v1` 前缀。
- 路由函数使用 `async def`；禁止在事件循环中直接执行阻塞 I/O。
- 请求和响应使用 Pydantic 模型；禁止直接返回 ORM 对象。
- 列表接口必须分页，并设置明确的最大页大小。
- 预期错误使用 FastAPI `HTTPException`，不得返回伪成功状态。
- 每个响应由日志中间件附加 `X-Request-ID`。
- 新增接口后保证其可在 `/docs` 中验证。

## 数据库规范

- 使用 `AsyncSession`，不得在业务代码中创建临时 Engine。
- Schema 变更必须新增 Alembic migration。
- 应用启动不自动执行 migration，由 Compose `migrate` 服务负责。
- 查询字段按实际过滤条件添加 B-tree 索引；JSONB 结构化查询使用 GIN 索引。
- 禁止在请求链路中逐条同步写日志。

## 配置规范

- 配置只通过 `app.core.config.Settings` 读取。
- 密码、签名密钥和数据库地址不得写入源码。
- 严禁在日志、异常信息和调试输出中记录环境变量原值、密钥或其他敏感配置；不得整体输出 `Settings`、`os.environ`、`.env` 内容或配置对象。确需记录配置状态时，只能输出不含敏感信息的布尔状态或经明确白名单筛选的非敏感字段。
- 新配置必须加入 `.env.example`。
- 本机无 PostgreSQL 时，可设置 `LOG_PERSISTENCE_ENABLED=false` 开发 Mock API；日志查询仍需要数据库。

## 安全规范

- 使用常量时间比较验证 `ADMIN_PASSWORD`。
- 管理会话必须存放在 HttpOnly Cookie。
- Authorization、Cookie、password、token、secret 和 API key 字段必须脱敏。
- 不记录日志查询接口，防止日志读取响应再次产生递归日志。
- 生产环境必须更换默认密码和 `AUTH_SECRET`。

## 测试与检查

```bash
cd backend
python -m pip install -e ".[dev]"
pytest
ruff check .
```

测试默认关闭 PG 日志持久化，因此可在未安装 PostgreSQL 的环境运行。数据库迁移与并发行为必须在带 PostgreSQL 的集成环境验证。

