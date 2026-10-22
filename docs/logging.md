# 日志设计

## 保留与清理

- `LOG_RETENTION_DAYS`：保存天数，默认 30。
- `LOG_CLEANUP_INTERVAL_SECONDS`：清理周期，默认 86,400 秒。
- 清理任务删除 `created_at` 早于保留截止时间的记录。

## 正文保存

请求和响应正文都会保存。为保证 100 并发下内存有界，单侧正文由 `LOG_BODY_MAX_BYTES` 限制，默认 262,144 字节；超过限制时保存前缀并设置对应 `*_truncated` 字段。

- JSON 正文序列化后保存。
- 文本正文按 UTF-8 保存，URL 编码表单解析并脱敏后保存。
- multipart 表单只保存正文总字节数，避免文件和敏感字段直接入库。
- 二进制正文只保存字节数占位，不写原始二进制。
- 敏感键递归替换为 `[REDACTED]`。

## 当前字段

| 字段 | 用途 |
| --- | --- |
| `id` | UUID 主键 |
| `created_at` | 带时区时间 |
| `level` | INFO、WARNING、ERROR |
| `service` / `environment` | 服务和环境标识 |
| `request_id` | 请求关联 ID |
| `method` / `path` | HTTP 方法和路径 |
| `query_params` | 查询参数 JSONB |
| `request_headers` | 脱敏后的请求头 JSONB |
| `request_body` | 请求正文 |
| `request_body_truncated` | 请求正文截断标记 |
| `status_code` | HTTP 状态码 |
| `duration_ms` | 请求耗时 |
| `response_headers` | 响应头 JSONB |
| `response_body` | 响应正文 |
| `response_body_truncated` | 响应正文截断标记 |
| `client_ip` / `user_agent` | 客户端信息 |
| `message` | 可搜索摘要 |
| `exception` | 异常堆栈 |
| `context` | 扩展 JSONB 上下文 |

## 默认排除

`LOG_EXCLUDED_PATH_PREFIXES=/api/v1/logs,/health`

- 排除日志查询接口，防止查询结果再次写成巨大的新日志。
- 排除健康检查，避免无业务价值的数据持续增长。

## 写入参数

| 配置 | 默认值 | 说明 |
| --- | ---: | --- |
| `LOG_QUEUE_SIZE` | 10000 | 进程内有界队列容量 |
| `LOG_BATCH_SIZE` | 100 | 单批写入上限 |
| `LOG_FLUSH_INTERVAL_SECONDS` | 0.5 | 批次最长等待时间 |
| `LOG_PERSISTENCE_ENABLED` | true | 是否启用 PG 写入 |

## 后续验证项

- 确认是否保留全部请求头和响应头。
- 确认正文默认上限是否需要提高。
- 确认需新增的业务关联字段和脱敏键。
- 压测后评估是否按月分区。
- 根据日志量评估全文搜索索引或专用日志系统。

