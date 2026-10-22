# Agent 文档索引

本文件是仓库内 Agent 的首要文档入口。只加载与当前任务相关的文档，修改实现时同步更新对应文档。

| 任务类型 | 必读文档 | 作用 |
| --- | --- | --- |
| 架构、部署、跨端改动 | [architecture.md](architecture.md) | 系统边界、容器拓扑、并发和安全设计 |
| FastAPI、数据库、日志接口 | [backend-development.md](backend-development.md) | 后端目录、编码约束、测试和迁移规范 |
| React、ShadCN、页面交互 | [frontend-development.md](frontend-development.md) | 前端第一原则、组件和页面规范 |
| 日志字段、脱敏、保留周期 | [logging.md](logging.md) | 当前日志数据契约及可配置项 |

## 快速定位

- API 入口：`backend/src/app/main.py`
- API 路由：`backend/src/app/api/`
- 日志中间件：`backend/src/app/logs/middleware.py`
- 日志批量写入：`backend/src/app/logs/writer.py`
- 数据库迁移：`backend/migrations/`
- 前端入口：`frontend/src/App.tsx`
- 日志页面：`frontend/src/components/logs-page.tsx`
- 日志表格和详情：`frontend/src/components/logs-table.tsx`
- 公共 Compose：`compose.yaml`
- 开发覆盖：`compose.dev.yaml`

## 修改同步规则

- 环境变量变更：同步 `.env.example` 和相关文档。
- 数据模型变更：增加 Alembic 迁移，不修改已发布迁移。
- API 契约变更：同步前端类型和调用层。
- ShadCN 组件变更：在 `frontend` 目录执行官方 CLI 命令，并保留命令来源。

