# MicroServices Template

FastAPI、React、ShadCN、PostgreSQL 与 Docker Compose 组成的日志持久化服务模板。

## 开发启动

```bash
copy .env.example .env
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

- 前端：http://localhost:5173
- API：http://localhost:8000
- Swagger：http://localhost:8000/docs

规范与架构入口见 [docs/INDEX.md](docs/INDEX.md)。

