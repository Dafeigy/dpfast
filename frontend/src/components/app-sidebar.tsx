import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  ScrollTextIcon,
  TerminalSquareIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-1">
          {state === "collapsed" ? (
            <SidebarTrigger
              className="size-8 bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              aria-label="展开侧边栏"
              title="展开侧边栏"
            >
              <ChevronRightIcon />
            </SidebarTrigger>
          ) : (
            <>
              <SidebarMenu className="min-w-0 flex-1">
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" tooltip="日志控制台" asChild>
                    <a href="/">
                      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <TerminalSquareIcon className="size-4" />
                      </span>
                      <span className="font-medium">日志控制台</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarTrigger aria-label="收起侧边栏" title="收起侧边栏">
                <ChevronLeftIcon />
              </SidebarTrigger>
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>服务</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="请求日志">
                  <ScrollTextIcon />
                  <span>请求日志</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Swagger" asChild>
                  <a href="/docs" target="_blank" rel="noreferrer">
                    <BookOpenIcon />
                    <span>接口文档</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLogout}
        >
          <LogOutIcon />
          <span className="group-data-[collapsible=icon]:hidden">退出</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
