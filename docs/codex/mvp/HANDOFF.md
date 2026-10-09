# MVP 运行与交接

## 当前状态

域名：aihot.lol（用户已购买）。开发站名：AI 简报。首版运行于 http://localhost:3000 。没有更改域名 DNS，没有部署生产站，也没有启用持续自动化。

上游 commit：8ef28ebcd167b311ffab8c0308181e2912262ae2；开发分支 feat/ai-brief-mvp。前端使用顶部导航、重点阅读和独立侧栏；手机保留真实搜索/筛选入口和底部导航。其他页面沿用上游可运行实现。

首版代码提交9b4a7ab与交接文档8f78903已上传至 https://github.com/ryannxn717-beep/AIHOT 的main；远程SHA核实一致。origin指向用户仓库，upstream保留原开源仓库。

后续内容发现阶段已完成本地实现和验证：主题默认只展示有内容的方向，可切换全部定义；关于页可搜索公开来源样本，统计不可用时明确提示，文案不承诺尚未运行的采集/每日出刊。最新证据为731项后端、56项Web和30项smoke全部通过，类型检查/构建通过；独立审查复审APPROVE。详见PHASE_02.md。生产准备文档在deploy/aihot.lol.md，配置模板不含密钥。

已向用户询问运行平台及模型服务/每日预算，尚未收到回答；可以继续本地开发，生产部署与真实模型调用须等待相应事实和配置。法律模板中的运营主体/联系方式也需上线前填写。

## 本机进程

- Node：应用自带 `/Users/mario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`，版本24.19.0。
- PostgreSQL17：只监听127.0.0.1:55432，数据在被忽略的 `.data/postgres/`；运行脚本 `.data/local-db.mjs`。
- 业务开发数据库 `aibrief_mvp`，测试数据库 `aibrief_test`。
- API：3001；Web：3000。Worker 暂未运行。
- `.env` 包含本地随机凭据，采集/模型/飞书/IndexNow均false。没有真实模型key。
- PostgreSQL备份工具位于 `.data/pgtools/native/postgresql-18.6.0-aarch64-apple-darwin/bin/`，仅用于本地备份相关测试；不改变生产依赖。

重启本机开发库：先确认55432没有本项目进程，再在仓库根目录运行 `node .data/local-db.mjs`。不要删除现有数据目录。该脚本和本机下载运行时均不属于产品源码；其他机器按下方标准运行方式准备 PostgreSQL 即可。

API和Web（仓库根目录，Node24已在PATH中）：

```sh
NODE_ENV=production node --env-file=.env apps/api/src/main.ts
NODE_ENV=production node --env-file=.env apps/web/server.ts
```

## 其他机器的标准本地运行

准备Node24.11+和PostgreSQL16/17，创建名为 `aibrief_mvp` 的本地库，复制 `.env.example` 为 `.env`，填好随机管理员与签名密钥。将DATABASE_URL设为该本地库，将SITE_URL设为http://localhost:3000、API_BASE_URL设为http://127.0.0.1:3001。明确将所有外发/付费开关设为false。

```sh
npm ci
node --env-file=.env scripts/migrate.ts
node --env-file=.env scripts/seed.ts
node --env-file=.env scripts/seed-mvp.ts
npm run build -w @aihot/web
```

然后分别启动API和Web。`seed-mvp.ts`仅接受本机`*_mvp`库，拒绝production模式；已有身份的文章在写入前跳过，新材料和人工发布在短事务中原子完成。

5条资料来自Hugging Face、GitHub Blog与Google DeepMind。摘要人工整理，发布时间来自原始RSS，来源地址由独立审查再次检查。主题标签采用上游分类词表；原文版权归原来源，默认仅展示摘要。

## 验证与审查

基线：上游731项数据库/独立测试通过；新增SSR测试先失败后通过。独立审查指出seed覆盖风险、UTC日期与“今日”标签问题，已用先失败后通过的回归验证修复：重跑导入保留既有正文、修订、归组和人工更正；重点日期使用beijingDate，标签改为重点阅读。

改动后的完整验证：类型检查和构建通过；731项后端测试、52项Web测试、30项整站smoke检查全部通过。手机390×844无横向溢出，人工验证搜索、分类、详情原文与收藏；桌面1280×720及手机截图保存在被忽略的 `.data/screenshots/`。独立review复审APPROVE（范围为本地MVP）。

浏览器回归测试的主页身份检查随新H1更新，保留原缓存、预取、离线返回、失败恢复等断言。第一次Web检查因本机缺少WebKit失败，下载测试依赖后完成全部52项。未运行真实模型、X或公众号服务，未做生产部署验证，未验证超过参考站的内容规模。

## 后续

1. 用户确定正式站名、信源、筛选口味、模型服务和预算；上线前确认条款/隐私模板。
2. 本机DNS把公开域名解析为198.18.* fake-IP，正常采集器会拒绝它。未关闭上游内网防护；本轮用开发者手动获取的公开RSS及人工核验资料导入。自动采集需在合法公网DNS/出站环境验证后再开启。
3. 部署需有能运行Node API、Worker和PostgreSQL的环境；Cloudflare中的已购域名本身不提供这些运行服务。生产SITE_URL届时才设置为https://aihot.lol。
4. 实测双方相同近30天窗口的去重有效内容和主题覆盖，再扩源和校准；当前5条阅读样本没有达到超过参考站的规模。

## 风险

本地管理员和签名凭据随机生成，不进入Git。基线错误日志曾包含开发库连接密码，已即时轮换；之后只输出脱敏错误摘要。未来采集服务、模型调用和托管成本未启用、未估计。
