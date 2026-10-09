# AI 简报 MVP Implementation Plan

**Goal:** 交付基于上游真实 API 的独立布局阅读 MVP，并说明信息获取的技术流程。

**Architecture:** 保留 Web → API → PostgreSQL，Worker 后台处理的原有边界。复用现有搜索、详情、收藏和主题；重点首页只读取已有 timeline 数据。

**Tech Stack:** Node 24、TypeScript、React Router SSR、React 19、Fastify、PostgreSQL 17、pg-boss、Tailwind CSS。

## P0：基线与边界

- [x] 克隆上游，独立 feature 分支，保留 MIT、NOTICE 和上游历史。
- [x] 安装 npm ci、创建仅本地开发数据库、迁移并导入示范源。
- [x] 基线 npm run typecheck。
- [x] 在 *_test 数据库执行原有 npm test，核对失败是否由本次改动引起。

## P0：原创首页与导航

文件：site/site.ts、apps/web/app/root.tsx、apps/web/app/components/shell/Masthead.tsx、apps/web/app/routes/home.tsx、apps/web/app/app.css。

- [x] 增加 apps/web/tests/mvp-home.test.ts：生产 SSR + 本地 API fixture，断言页面存在今日重点、顶部主导航，以及实际条目的详情链接；空库不会出现假重点内容；搜索入口为 /all。
- [x] 先运行 npm run build -w @aihot/web，然后 node --test apps/web/tests/mvp-home.test.ts，确认新增布局断言失败。
- [x] 修改站名/身份（临时开发名），源码地址指向用户仓库。
- [x] 将 Sidebar 改成水平导航实现（保留被其他组件引用的 useChangelogDot）；root shell 改成纵向页面。
- [x] 首页用 data.cards 中首条做重点阅读，其余作为相关入口；热点移至独立侧栏。保持原 Timeline 分页和筛选。
- [x] CSS 定义首屏、分栏、移动端顺序和可见焦点；不改变筛选评分或公开权限规则。
- [x] 再构建并运行 SSR 测试，确认通过。

## P0：真实内容与运行

- [x] 手动读取上游示范源中的免费公开 AI 资料，保存核验的原文、日期与摘要；开发数据库保留来源追踪，不声称使用模型自动生成。
- [x] 启动 API 和 Web；关闭采集、模型和推送安全阀。
- [x] 浏览器测试搜索、分类、详情和收藏，截图检查桌面和手机。

## P1：验证和交付

- [x] npm run typecheck。
- [x] npm test（临时数据库名必须以 _test 结尾；真实外部服务关闭）。
- [x] npm run build -w @aihot/web && node --test apps/web/tests/*.test.ts。
- [x] node scripts/smoke.ts --base http://localhost:3000。
- [x] 检查 diff、git check-ignore .env .data/，记录实际证据与局限。
- [x] 更新 HANDOFF.md 与技术流程说明；验证后提交并推送到用户指定 GitHub。

## 完成记录

P0/P1本地工作已完成：上游基线731/731；新增SSR先红后绿，最终3/3；类型检查和Web构建通过；后端731/731、Web52/52、smoke30/30；desktop/mobile截图及搜索、分类、详情、收藏人工检查通过。独立review首轮REJECT（seed修改既有材料、UTC日、今日标签），修复并回归后复审APPROVE。

执行方式：当前会话顺序实现，独立review子代理只读审查。文件重命名后引用全部更新，重点链接复用IntentLink与rememberPreview。原有浏览器测试的H1定位调整为新首页标题，业务断言保留。

所有本地实现/验证复选项由本完成记录确认。代码提交9b4a7ab已推送至用户仓库main，git ls-remote核实远程SHA与代码提交一致。未启用自动采集/真实模型或生产部署。

## 人类决定保留

站名、正式信源、精选口味、法律文案和付费预算由用户决定。GitHub 上传已在此前请求中授权；部署和持续自动化未授权。
