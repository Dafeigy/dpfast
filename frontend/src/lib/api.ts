import type { LogPage } from "@/lib/types"

export class UnauthorizedError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (response.status === 401) throw new UnauthorizedError()
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json() as Promise<T>
}

export const api = {
  login(password: string) {
    return request<{ status: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    })
  },
  logout() {
    return request<{ status: string }>("/api/v1/auth/logout", {
      method: "POST",
    })
  },
  session() {
    return request<{ status: string }>("/api/v1/auth/session")
  },
  logs(filters: {
    page: number
    search: string
    level: string
    method: string
    path: string
    errorCode: string
    status: string
    dateFrom: string
    dateTo: string
  }) {
    const params = new URLSearchParams({
      page: String(filters.page),
      page_size: "25",
    })
    if (filters.search) params.set("search", filters.search)
    if (filters.level !== "all") params.set("level", filters.level)
    if (filters.method !== "all") params.set("method", filters.method)
    if (filters.path !== "all") params.set("path", filters.path)
    if (filters.errorCode) params.set("error_code", filters.errorCode)
    if (filters.status !== "all") params.set("status", filters.status)
    if (filters.dateFrom) params.set("created_from", `${filters.dateFrom}T00:00:00`)
    if (filters.dateTo) params.set("created_to", `${filters.dateTo}T23:59:59.999999`)
    return request<LogPage>(`/api/v1/logs?${params}`)
  },
}
