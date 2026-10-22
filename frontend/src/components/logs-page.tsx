import * as React from "react"
import { RefreshCwIcon, SearchIcon } from "lucide-react"

import { LogsTable } from "@/components/logs-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { api } from "@/lib/api"
import type { LogPage } from "@/lib/types"

const emptyPage: LogPage = {
  items: [],
  page: 1,
  page_size: 25,
  total: 0,
  pages: 0,
}

export function LogsPage({
  onUnauthorized,
}: {
  onUnauthorized: (error: unknown) => void
}) {
  const [data, setData] = React.useState<LogPage>(emptyPage)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [submittedSearch, setSubmittedSearch] = React.useState("")
  const [level, setLevel] = React.useState("all")
  const [method, setMethod] = React.useState("all")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    let active = true
    api
      .logs({ page, search: submittedSearch, level, method })
      .then((result) => active && setData(result))
      .catch((requestError: unknown) => {
        if (!active) return
        onUnauthorized(requestError)
        setError("日志加载失败")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [level, method, onUnauthorized, page, refreshKey, submittedSearch])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setPage(1)
    setSubmittedSearch(search.trim())
    setRefreshKey((value) => value + 1)
  }

  function changePage(nextPage: number) {
    setLoading(true)
    setError("")
    setPage(nextPage)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="font-medium">请求日志</h1>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto"
          onClick={() => {
            setLoading(true)
            setError("")
            setRefreshKey((value) => value + 1)
          }}
          aria-label="刷新日志"
          disabled={loading}
        >
          <RefreshCwIcon className={loading ? "animate-spin" : ""} />
        </Button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="log-search">搜索</Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="log-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="消息、请求或响应正文"
              />
            </div>
          </div>
          <div className="space-y-2 sm:w-36">
            <Label>级别</Label>
            <Select
              value={level}
              onValueChange={(value) => {
                setLoading(true)
                setError("")
                setLevel(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:w-36">
            <Label>方法</Label>
            <Select
              value={method}
              onValueChange={(value) => {
                setLoading(true)
                setError("")
                setMethod(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">查询</Button>
        </form>

        {error ? (
          <div className="grid min-h-64 place-items-center rounded-lg border text-sm text-destructive">
            {error}
          </div>
        ) : (
          <LogsTable
            data={data}
            loading={loading}
            page={page}
            onPageChange={changePage}
          />
        )}
      </main>
    </div>
  )
}
