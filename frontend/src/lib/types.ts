export interface LogItem {
  id: string
  created_at: string
  level: string
  service: string
  environment: string
  request_id: string
  method: string
  path: string
  query_params: Record<string, unknown>
  request_headers: Record<string, unknown>
  request_body: string | null
  request_body_truncated: boolean
  status_code: number
  duration_ms: number
  response_headers: Record<string, unknown>
  response_body: string | null
  response_body_truncated: boolean
  client_ip: string | null
  user_agent: string | null
  message: string
  exception: string | null
  context: Record<string, unknown>
}

export interface LogPage {
  items: LogItem[]
  page: number
  page_size: number
  total: number
  pages: number
}
