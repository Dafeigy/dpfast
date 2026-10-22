# 前端开发规范

1. 不要自己额外补充说明信息，保持极简设计风格。
2. 严格使用 `npx shadcn@latest add <component>` 添加 ShadCN 组件，不自行编写 ShadCN 替代组件。
3. 页面组件只负责编排，基础交互和样式优先复用 `src/components/ui/` 中由 CLI 生成的组件。
4. 图标统一使用 Lucide，不使用 Emoji 作为界面图标。
5. API 调用集中在 `src/lib/api.ts`，接口类型集中在 `src/lib/types.ts`。
6. 不在浏览器存储管理员密码、会话 Token 或日志正文缓存。
7. 列表必须使用服务端分页；不得一次拉取全部日志。
8. 交互必须支持键盘、可见焦点、明确 Label 和加载/错误状态。
9. 页面需在 375、768、1024 和 1440 像素宽度下无水平溢出。
10. 新增依赖、组件或路由后更新本文档或 `docs/INDEX.md`。

## 技术栈

- React + TypeScript + Vite
- Tailwind CSS
- ShadCN Nova / Radix
- Lucide Icons

## 组件添加

在 `frontend` 目录执行：

```bash
npx shadcn@latest add <component>
```

当前 AppShell 起点来自：

```bash
npx shadcn@latest add dashboard-01
```

该命令已生成 Sidebar、Table、Sheet、Input、Select、Badge、Skeleton 等基础组件。业务组件可以组合这些组件，但不得复制实现一个同名 UI 基础组件。

## 页面结构

- `App.tsx`：会话检查和 AppShell。
- `login-page.tsx`：管理员密码登录。
- `logs-page.tsx`：筛选、查询、刷新和分页状态。
- `logs-table.tsx`：日志表格与右侧 Sheet 详情。
- `app-sidebar.tsx`：日志与 Swagger 导航。

## 文案规则

- 界面只展示完成当前操作所需的信息。
- 不添加欢迎语、产品口号、教程、统计卡片或解释段落。
- 错误文案简短且可执行。
- 详情正文使用等宽字体并允许换行、滚动。

