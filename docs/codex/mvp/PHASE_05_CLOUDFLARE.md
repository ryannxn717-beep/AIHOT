# P0 免费 Cloudflare MVP 部署

## Spec 与第一性原理

目标：按用户已批准的 Workers＋Neon 路线，让 https://aihot.lol 可访问现有阅读 MVP；不购买付费计划。运营名称为用户指定的“AI hot”，展示品牌继续为“AI 简报”，公开邮箱待补充。

事实：现有 React Router SSR 仅通过 HTTP 读 Fastify API；公开出口都依赖 publication 层；PostgreSQL 使用事务和 pg_trgm。Neon 新项目 aihot-lol 是独立、未导入应用数据的 PG17 免费项目。原后台和采集任务需要 Node 进程，sharp 为原生模块，本地持久文件不能放进 Workers 临时文件系统。

最小方案：保留现有页面、公开 API 路由、publication SQL 和 PostgreSQL schema；增加 Cloudflare 专用网页入口及公开 API 入口，用 Hyperdrive 和请求范围数据库连接运行。只部署阅读、RSS/API/MCP 和文字反馈；常驻采集、模型、Node 管理后台及图片附件处理不作为本次公开 MVP 运行服务。原 Node 部署代码保持可用。不能伪造日报、热点或用静态样本取代 Neon 数据库查询。

更简单的 Render 免费 Node 方案因休眠和抓取限制未被选择；付费 Containers 被用户明确拒绝；静态 client 上传无法提供真实 API，拒绝。关键 publication 查询、SSR 或免费 CPU/大小限制无法满足时，先记录实际失败证据再调整，不声称上线。

验收：Neon 中仅新项目完成 schema/样本初始化；主页、全部资讯、搜索、详情、主题、模型榜、日报空状态、关于/日志/反馈有真实 HTTP/SSR 行为；禁用栏目不开放；私密凭据不进入前端/仓库/日志；匿名接口仅公开内容；域名 HTTPS、页面导航及资源加载成功。上线仍只有五条样本和人工模型榜，不达到规模/自动更新最终验收。

## 依赖顺序与验证

- [x] P0.1 运行兼容性探针：Wrangler 本地实际 workerd 启动公开 API 与 SSR；验证 bundle 大小，记录原生依赖边界。
- [x] P0.2 数据库隔离：抽出原连接配置，Cloudflare 入口使用 AsyncLocalStorage 按请求绑定连接；并发上下文、异常结束和数值类型先写失败测试后实现。
- [x] P0.3 API 适配：复用公开路由及统一 publication；打包所需 JSON/条款/品牌文件；文字反馈有验证和数据库限流，明确拒绝未开放图片附件；公开管理路径拒绝访问。
- [x] P0.4 SSR 适配：静态资产、原重定向表、服务绑定 HTTP、缓存与 Cookie 边界；原 Node 模式保持原行为。用真实页面测试和 smoke 验证。
- [x] P0.5 新 Neon 初始化：私密读取连接配置；只允许明确项目主机且检查库无应用表；迁移后导入核验样本，禁止覆盖既有内容。SSL/事务/搜索验证。
- [x] P0.6 独立审查：检查公开范围、凭据、并发连接、免费限制和 diff；完成类型/构建/相关后端与 Web 测试。
- [ ] P0.7 免费资源部署：创建本站 Hyperdrive 和 Workers，先签名私有云端预览 smoke，再绑定 aihot.lol；不更改无关 DNS/资源，不开通收费。验证 HTTPS、页面、反馈与导航，记录部署版本。
- [x] P0.8 开源交付：更新部署说明、HANDOFF、状态证据；push 用户 main 并核验 SHA。代码提交71b2a8c；GitHub Actions运行38051213297的check与docker均success。

## 失败模式与验证边界

请求间共享 TCP 连接会造成 workerd 跨请求 I/O 错误，必须在每个请求上下文创建/结束连接；共享缓存只能保存可重复使用的值，不能保留其他请求未结束的 Promise。文件只读配置随 bundle 发布，临时目录不能保存反馈附件。免费配额耗尽会拒绝请求，不能自动升级。上线前必须实测 CPU/包大小；仅本地 green 不代表云端可运行。运营邮箱尚未提供，不编造邮箱，反馈及仓库 Issues 作为当前联系入口。

实际阶段状态、证据与剩余公开发布确认见 PHASE_05_STATUS.md。
