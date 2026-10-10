# 免费阅读 MVP：Workers + Neon

这套适配保留原 React Router 页面、公开 API 路由及 publication 查询。两个 Worker 分别负责 SSR/静态资源和 API；网页通过服务绑定发送 HTTP 请求，数据库与密钥只在 API。API 不对 workers.dev 或域名公开，只能由网页服务绑定调用。运营文案已获确认，web.json现配置唯一公开自定义域名aihot.lol；两个Worker的workers.dev均关闭。

仅部署阅读、搜索、主题、模型榜、RSS/API/MCP 和文字反馈。Node 管理后台、常驻采集、模型任务、图片附件不作为当前云服务运行；原 Node/Docker 入口保持可用。品牌、主题以及当前公开文章的分享图/海报在 Node 构建时生成，内容修改或撤回后必须重新构建和部署；本次没有自动发布任务。

## 准备与构建

使用 Node24.11+、`npm ci`。创建独立 PG17 Neon 数据库，保留 TLS 直连地址，将数据库 URL 放在本机私密配置或 CI 私密环境中。不要在聊天、仓库或命令参数中放连接密码。只有新项目空库才可以运行 `scripts/initialize-neon-mvp.ts`；已有库用原迁移流程，初始化脚本会拒绝覆盖。

初始化的确认字段为 `AIHOT_NEON_PROJECT=aihot-lol`、`AIHOT_NEON_HOST=<该项目的确切Neon主机>`；脚本检查数据库名为 `aibrief`、TLS 打开、公有表为空，再迁移、导入候选来源及核验样本。它不会采集或调用模型。原 `seed-mvp.ts` 仍只接受本机 `*_mvp`。

创建名为 aihot-lol 的 Hyperdrive，连接这一独立项目，关闭查询缓存，让原 publication 的可见性和绝对缓存期限保持一致。设置 `AIHOT_HYPERDRIVE_ID`。后台私密环境提供随机 `SESSION_SECRET`、`IMG_PROXY_SIGN_SECRET`；开发时可用被忽略的 `.data/cloudflare-secrets.env`，构建会将其复制到 API 的 `.dev.vars`，生产用 Wrangler secret bulk 上传。网页无数据库或会话密钥。

构建需要 `DATABASE_URL`（只为从 publication 读取分享素材）、`SITE_URL=https://aihot.lol`、`AIHOT_HYPERDRIVE_ID`。从已有私密 env 文件加载并传给子进程，或者由托管环境注入，不把这些值写进公开脚本。

```sh
npm run build:cloudflare
npm run typecheck
npm run typecheck:cloudflare
npm run test:cloudflare
```

生成目录 `.data/cloudflare-build/` 不进入 Git，每次完整重建以删除旧分享素材。停止正在监视该目录的 Wrangler dev，再重建并重新启动；构建中间文件不是可运行版本。配置模板位于 `api.json` 和 `web.json`；生成配置的入口是 `build.ts`。

构建工具在 Node 下运行真实 Fastify 路由初始化，捕获编译器的有限输入，输出静态函数。Workers 端只查找这些静态函数，不启用 `unsafe_eval`；增加或变更路由后必须重建。未捕获输入会明确报错。API 在请求内启动 Fastify 的 boot queue，SQL/缓存/有限 MCP 响应读取都保持在请求范围内；结束后关闭连接。Postgres 的数组类型发现保持开启，不能按无数组示例设成 `fetch_types:false`。

## 验证与公开发布

先部署 API（没有公开目标），再验证网页。首次私有验收时从生成的网页配置移除routes，保持workers_dev=false；用官方 `wrangler dev --remote` 的签名预览验证 Cloudflare 实际运行与 Hyperdrive。生成配置默认带有aihot.lol的公开域名，正常deploy会更新公开站点；本地代理 URL 仅用于验证。

```sh
npx wrangler secret bulk .data/cloudflare-secrets.env -c .data/cloudflare-build/api/wrangler.json
npx wrangler deploy -c .data/cloudflare-build/api/wrangler.json
npx wrangler deploy -c .data/cloudflare-build/web/wrangler.json
npx wrangler dev --remote -c .data/cloudflare-build/web/wrangler.json --port 8790
node deploy/cloudflare/check.ts http://localhost:8790
```

`check.ts` 包含37项公开 smoke、并发读取、两路搜索、60条模型、关闭的管理地址/编码变体，以及文字反馈/拒绝附件检查。它会写一条不含个人信息的验证反馈。原 smoke 默认仍包含 Node 管理页；公开阅读部署用 `--public-only`，不把关闭管理页误判为故障。

原搜索容量阀保持生效：同时启动过多同词搜索可能返回503及 Retry-After（本机直连Neon的六路搜索曾触发短排队超时）。这是容量提示，不应在测试或部署中关闭；普通两路搜索和十二路非搜索读取需要成功。

运营者确认 `site/pages/privacy.md` 与 `terms.md` 后，在生成的网页配置添加唯一的自定义域名路由，然后部署。不要添加 API 的公开路由或更改其他站点 DNS。

```json
"routes": [{ "pattern": "aihot.lol", "custom_domain": true }]
```

验证 `https://aihot.lol` 的 TLS、静态资源、所有公开 smoke、导航和反馈，再记录版本。Workers/Hyperdrive/Neon 均按现有免费额度规划；配额耗尽可能拒绝请求，不自动升级。包大小以 `wrangler deploy --dry-run` 的 gzip 数值判断；云端 HTTP 成功不等于已验证高负载或长期配额。
