import * as React from "react"
import { LockKeyholeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"

export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: () => void
}) {
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError("")
    try {
      await api.login(password)
      onAuthenticated()
    } catch {
      setError("密码错误")
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm"
      >
        <div className="space-y-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LockKeyholeIcon className="size-4" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">日志控制台</h1>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">管理员密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={pending || !password}
        >
          {pending ? "验证中" : "登录"}
        </Button>
      </form>
    </main>
  )
}
