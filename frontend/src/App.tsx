import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { LoginPage } from "@/components/login-page"
import { LogsPage } from "@/components/logs-page"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { api, UnauthorizedError } from "@/lib/api"

export function App() {
  const [authenticated, setAuthenticated] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    api
      .session()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
  }, [])

  if (authenticated === null) return <div className="min-h-svh bg-background" />
  if (!authenticated)
    return <LoginPage onAuthenticated={() => setAuthenticated(true)} />

  async function logout() {
    await api.logout()
    setAuthenticated(false)
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar onLogout={logout} />
        <SidebarInset>
          <LogsPage
            onUnauthorized={(error) => {
              if (error instanceof UnauthorizedError) setAuthenticated(false)
            }}
          />
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  )
}

export default App
