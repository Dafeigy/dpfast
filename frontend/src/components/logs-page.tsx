import * as React from "react"
import { ChevronDownIcon, ListFilterIcon, RefreshCwIcon, SearchIcon } from "lucide-react"

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
import { Toggle } from "@/components/ui/toggle"
import { api } from "@/lib/api"
import type { LogPage } from "@/lib/types"

const emptyPage: LogPage = {
  items: [],
  page: 1,
  page_size: 25,
  total: 0,
  pages: 0,
}

const httpCodeOptions: [string, string][] = [
  ["all", "全部"],
  ["200", "200 OK"],
  ["201", "201 Created"],
  ["204", "204 No Content"],
  ["301", "301 Moved Permanently"],
  ["302", "302 Found"],
  ["304", "304 Not Modified"],
  ["400", "400 Bad Request"],
  ["401", "401 Unauthorized"],
  ["403", "403 Forbidden"],
  ["404", "404 Not Found"],
  ["405", "405 Method Not Allowed"],
  ["408", "408 Request Timeout"],
  ["409", "409 Conflict"],
  ["422", "422 Unprocessable Content"],
  ["429", "429 Too Many Requests"],
  ["500", "500 Internal Server Error"],
  ["502", "502 Bad Gateway"],
  ["503", "503 Service Unavailable"],
  ["504", "504 Gateway Timeout"],
]

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
  const [path, setPath] = React.useState("all")
  const [errorCode, setErrorCode] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [error, setError] = React.useState("")
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [autoFetch, setAutoFetch] = React.useState(true)
  const [newItemIds, setNewItemIds] = React.useState<string[]>([])
  const animateNewItemsRef = React.useRef(false)
  const dataRef = React.useRef(data)
  const hasLoadedRef = React.useRef(false)

  React.useEffect(() => {
    dataRef.current = data
  }, [data])

  React.useEffect(() => {
    let active = true
    const shouldAnimateNewItems = animateNewItemsRef.current
    animateNewItemsRef.current = false
    api
      .logs({ page, search: submittedSearch, level, method, path, errorCode, status, dateFrom, dateTo })
      .then((result) => {
        if (!active) return
        if (shouldAnimateNewItems && hasLoadedRef.current) {
          const previousIds = new Set(
            dataRef.current.items.map((item) => item.id)
          )
          setNewItemIds(
            result.items
              .filter((item) => !previousIds.has(item.id))
              .map((item) => item.id)
          )
        } else {
          setNewItemIds([])
        }
        setData(result)
        hasLoadedRef.current = true
        setHasLoaded(true)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        onUnauthorized(requestError)
        setError("日志加载失败")
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [dateFrom, dateTo, errorCode, level, method, onUnauthorized, page, path, refreshKey, status, submittedSearch])

  React.useEffect(() => {
    if (!autoFetch) return

    const intervalId = window.setInterval(() => {
      animateNewItemsRef.current = true
      setLoading(true)
      setError("")
      setRefreshKey((value) => value + 1)
    }, 10_000)

    return () => window.clearInterval(intervalId)
  }, [autoFetch])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    animateNewItemsRef.current = false
    setPage(1)
    setSubmittedSearch(search.trim())
    setRefreshKey((value) => value + 1)
  }

  function changePage(nextPage: number) {
    setLoading(true)
    setError("")
    animateNewItemsRef.current = false
    setPage(nextPage)
  }

  function resetFilters() {
    setLevel("all")
    setMethod("all")
    setPath("all")
    setErrorCode("")
    setStatus("all")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
        <h1 className="font-medium">请求日志</h1>
        <Toggle
          variant="outline"
          pressed={autoFetch}
          onPressedChange={setAutoFetch}
          aria-label="Auto fetch"
          title="Auto fetch"
        >
          Auto fetch
        </Toggle>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto"
          onClick={() => {
            animateNewItemsRef.current = true
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
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="log-search">搜索</Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="log-search" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="消息、请求或响应正文" />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              aria-controls="log-filters"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((value) => !value)}
            >
              <ListFilterIcon />
              Filter
              <ChevronDownIcon className={`transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button type="submit" className="self-end">查询</Button>
          </div>
          <div
            id="log-filters"
            aria-hidden={!filtersOpen}
            inert={!filtersOpen}
            className={`grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] -translate-y-1 opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                <FilterSelect label="级别" value={level} onChange={setLevel} options={[["all", "全部"], ["INFO", "INFO"], ["WARNING", "WARNING"], ["ERROR", "ERROR"]]} />
                <FilterSelect label="方法" value={method} onChange={setMethod} options={[["all", "全部"], ["GET", "GET"], ["POST", "POST"]]} />
                <FilterSelect label="路由" value={path} onChange={setPath} options={[
                  ["all", "全部"], ["/", "GET /"], ["/health/live", "GET /health/live"], ["/health/ready", "GET /health/ready"],
                  ["/api/v1/auth/login", "POST /api/v1/auth/login"], ["/api/v1/auth/logout", "POST /api/v1/auth/logout"], ["/api/v1/auth/session", "GET /api/v1/auth/session"],
                  ["/api/v1/mock/ping", "GET /api/v1/mock/ping"], ["/api/v1/mock/echo", "POST /api/v1/mock/echo"],
                ]} />
                <FilterSelect label="HTTP Code" value={errorCode || "all"} onChange={(value) => setErrorCode(value === "all" ? "" : value)} options={httpCodeOptions} />
                <FilterSelect label="Status" value={status} onChange={setStatus} options={[["all", "全部"], ["success", "Success"], ["failure", "Failure"]]} />
                <DateFilter label="开始日期" value={dateFrom} max={dateTo || undefined} onChange={setDateFrom} />
                <DateFilter label="结束日期" value={dateTo} min={dateFrom || undefined} onChange={setDateTo} />
              </div>
            </div>
          </div>
        </form>

        {error && !hasLoaded ? (
          <div className="grid min-h-64 place-items-center rounded-lg border text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            {error && (
              <div
                role="status"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <LogsTable
              data={data}
              loading={loading}
              hasLoaded={hasLoaded}
              newItemIds={newItemIds}
              page={page}
              onPageChange={changePage}
            />
          </>
        )}
      </main>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DateFilter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`date-${label}`}>{label}</Label>
      <Input
        id={`date-${label}`}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
