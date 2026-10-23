import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { LogItem, LogPage } from "@/lib/types"

function levelClassName(level: string) {
  if (level === "ERROR") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
  }
  if (level === "WARNING") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/40 dark:text-yellow-300"
  }
  return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300"
}

function displayBody(value: string | null) {
  if (!value) return "—"
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function detailText(value: unknown) {
  if (typeof value === "string" || value === null) return displayBody(value)
  return JSON.stringify(value, null, 2)
}

function DetailBlock({ title, value }: { title: string; value: unknown }) {
  const [copied, setCopied] = React.useState(false)
  const text = detailText(value)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("已复制")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("复制失败")
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`复制${title}`}
          title={`复制${title}`}
          onClick={copy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs leading-5 break-all whitespace-pre-wrap">
        {text}
      </pre>
    </section>
  )
}

export function LogsTable({
  data,
  loading,
  hasLoaded,
  newItemIds,
  page,
  onPageChange,
}: {
  data: LogPage
  loading: boolean
  hasLoaded: boolean
  newItemIds: string[]
  page: number
  onPageChange: (page: number) => void
}) {
  const [selected, setSelected] = React.useState<LogItem | null>(null)

  return (
    <>
      <div
        className="relative overflow-hidden rounded-lg border bg-background"
        aria-busy={loading}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>时间</TableHead>
              <TableHead>级别</TableHead>
              <TableHead>方法</TableHead>
              <TableHead>路径</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">耗时</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasLoaded ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.items.length ? (
              data.items.map((item) => (
                <TableRow
                  key={item.id}
                  tabIndex={0}
                  className={`cursor-pointer ${
                    newItemIds.includes(item.id)
                      ? "animate-in duration-300 fade-in-0 slide-in-from-top-2"
                      : ""
                  }`}
                  onClick={() => setSelected(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                      setSelected(item)
                  }}
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Intl.DateTimeFormat("zh-CN", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(item.created_at))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={levelClassName(item.level)}
                    >
                      {item.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.method}
                  </TableCell>
                  <TableCell className="max-w-96 truncate font-mono text-xs">
                    {item.path}
                  </TableCell>
                  <TableCell>{item.status_code}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.duration_ms.toFixed(2)} ms
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  暂无日志
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {data.total} 条</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            上一页
          </Button>
          <span className="min-w-16 text-center">
            {page} / {Math.max(data.pages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selected && (
            <div className="space-y-6 px-4 pb-6">
              <SheetHeader className="px-0">
                <SheetTitle className="font-mono text-base">
                  {selected.method} {selected.path}
                </SheetTitle>
                <SheetDescription>{selected.request_id}</SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">状态</p>
                  <p>{selected.status_code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">耗时</p>
                  <p>{selected.duration_ms.toFixed(2)} ms</p>
                </div>
                <div>
                  <p className="text-muted-foreground">服务</p>
                  <p>{selected.service}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">环境</p>
                  <p>{selected.environment}</p>
                </div>
              </div>
              <Separator />
              <DetailBlock title="查询参数" value={selected.query_params} />
              <DetailBlock title="请求头" value={selected.request_headers} />
              <DetailBlock
                title={`请求正文${selected.request_body_truncated ? "（已截断）" : ""}`}
                value={selected.request_body}
              />
              <DetailBlock title="响应头" value={selected.response_headers} />
              <DetailBlock
                title={`响应正文${selected.response_body_truncated ? "（已截断）" : ""}`}
                value={selected.response_body}
              />
              {selected.exception && (
                <DetailBlock title="异常" value={selected.exception} />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
