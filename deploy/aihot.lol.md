# aihot.lol 正式运行配置

## 已完成

2026-10-10最新进展：用户选择免费Workers＋Neon路线，独立Neon已初始化，Cloudflare API/Web已私有上传并验证。公开域名未绑定，等待用户确认实际条款与隐私文案。实现与命令见[Cloudflare适配](cloudflare/README.md)，完整证据/版本/下一步见[PHASE_05_STATUS](../docs/codex/mvp/PHASE_05_STATUS.md)。以下早期评估作为历史背景，不代表目前仍在选择托管平台。

- 代码在用户仓库 https://github.com/ryannxn717-beep/AIHOT 。
- 独立导航/首页、搜索/分类、详情/原文、主题分组、收藏及来源说明。AI 动态与主题有下拉入口，出海建站和 SEO 内容未开放。
- 模型榜读取 LiveBench 核验快照，60 个配置、8 个维度；支持排序和搜索，尚未自动同步。
- 保留上游 API、Worker、PostgreSQL 和统一发布层；默认全文关闭。
- 用户提供的域名为aihot.lol。尚未改DNS或启动生产环境。

来源统计缺失时，页面使用不带数量的说明；本项目已停用原ABOUT.sourcesFallback的猜测数量。上游docs/deploy.md中的历史升级记录保留，仅描述原框架历史。

## 原框架运行基线

沿用原项目Docker Compose：PostgreSQL17、一次性setup、API、Worker、Web，加Caddy管理HTTPS。已有域名可通过Cloudflare管理DNS，服务器需能运行这些进程和持久化数据库。

更简单的本地方案是只启动API与Web、人工整理内容；自动采集与模型关闭时适合验证阅读流程。此方案已运行，但不代表网站在公网持续更新。用户现已请求Cloudflare部署；迁移到Workers/托管数据库会改变原项目的任务和数据库运行方式，尚未实施。

## Cloudflare 部署核验（2026-10-10）

浏览器指定域名入口跳转Cloudflare登录页，但随后发现本机已有Wrangler OAuth登录，已通过官方CLI刷新并核验账户与用户给定账户相同，无需重新登录。最新CLI将OAuth凭据迁入系统钥匙串；只通过官方auth命令在内存中取得凭据用于官方API读取，不打印或存入项目。没有改DNS、购买服务或创建Cloudflare生产资源；后来创建的独立Neon项目见下文。

官方API只读核验：aihot.lol属于该账户且状态active；未发现本站对应Worker；Hyperdrive配置列表为空。最初订阅API因权限不足返回403；随后用用户指定Chrome查看Containers页，页面明确要求升级Workers付费计划。用户选择保持免费，不开通Containers。没有读取或复用其他项目的密钥。

当前代码a5fbd7ca2735901136107f43ccd37a3182a35775的GitHub Check工作流已通过，check和docker两个job均success：https://github.com/ryannxn717-beep/AIHOT/actions/runs/38012855913 。本地后端735项、Web67项、smoke38项通过，实际云端上线检查尚未进行。

原应用不是静态文件包：网页SSR通过HTTP读取Node API，API和常驻Worker依赖PostgreSQL与任务队列。仅上传apps/web/build/client到Pages会缺失页面服务、资讯API和采集流程，不能算完整部署。Cloudflare支持React Router应用，但这不代表现有自定义Node服务器、后台进程和本地持久化会直接迁移。

可选方案：

| 方案 | 最小改动与依赖 | 当前条件 |
|---|---|---|
| Cloudflare域名/CDN + 云服务器Docker（推荐保留上游引擎） | 原Docker Compose运行API、Worker、Web、PostgreSQL，Cloudflare管理DNS/HTTPS入口 | 需要可用服务器及用户授权的访问方式；目前未提供 |
| Cloudflare Containers + 持久化PostgreSQL | 给现有镜像增加Cloudflare路由和进程编排，确认后台持续运行与停止行为，连接独立持久化数据库 | 已确认需要升级Workers付费计划，用户选择保持免费，因此不采用 |
| Workers/Pages + D1重写 | 替换PostgreSQL查询、pg-boss队列、模型任务和文件处理 | 不是本次部署的最小方案，不自行重写 |

依据：[Cloudflare Containers存储与生命周期](https://developers.cloudflare.com/containers/faq/)、[Containers计费](https://developers.cloudflare.com/containers/platform/pricing/)、[Workers全栈应用](https://developers.cloudflare.com/workers/static-assets/routing/full-stack-application/)。Containers默认磁盘会在休眠后丢失，不能把原PostgreSQL数据目录直接当持久化数据库；Containers属于Workers付费计划并按运行资源计费，不自动开通收费服务。

用户已确认先上线样本MVP，再补正式内容及自动更新。栏目齐全不等于内容齐全：目前资讯仅5条人工样本，尚无已发布日报；没有达到近30天内容超过参考站的验收。模型密钥、预算和法律模板运营信息仍未提供，不能把现有开关关闭状态称为正式自动资讯服务。

## 独立 Neon 数据库与免费路线

用户指定Neon，可新建独立项目。已在同一Neon账号的个人空间创建 `aihot-lol`（不使用已有项目）；project `cool-bread-04447408`，默认branch `br-cool-pond-b5nken3k`/production，数据库 `aibrief`，PostgreSQL17，AWS US East2 (Ohio)，Free plan。创建界面确认只启用Postgres，其余Auth/Functions/Object storage/AI gateway未启用。尚未读取连接密码、执行应用迁移或导入样本。

项目入口：https://console.neon.tech/app/projects/cool-bread-04447408/branches/br-cool-pond-b5nken3k 。创建结果截图在被忽略的.data/screenshots/neon-aihot-lol-created.png。域名DNS未修改，网站尚未上线。

用户拒绝付费Containers后，按“先评估其他部署方式”评估以下路线，等待采用哪条的回答：

| 路线 | 改动与维护 | 限制与推翻条件 |
|---|---|---|
| Cloudflare Workers + Neon（推荐符合指定平台） | 保留前端布局和PostgreSQL内容模型，先验证React Router SSR、数据库访问、公开读取层、Node依赖与文件处理，再适配请求驱动API；常驻任务另行设计 | 不是原Docker镜像直接上传；免费配额内运行，不能保证原引擎全部依赖兼容。若关键读取、事务或SSR无法保留，重新选择托管方式，不悄悄砍掉核心功能 |
| Cloudflare域名/入口 + Render Free Node服务 + Neon（更简单） | 复用原Docker镜像，增加API/Web同容器启动与资源验证 | 无请求15分钟后休眠，唤醒约1分钟；文件系统临时。休眠时/robots.txt自动返回禁止抓取且不会唤醒。免费额度用尽可能停服，不适合作为正式内容站首选 |
| 付费Containers或直接上传静态client目录（拒绝） | 前者保留Node运行方式但需付费；后者没有原API和任务链路 | 不符合用户保持免费或保留核心行为的约束 |

依据：[Cloudflare连接Neon](https://developers.cloudflare.com/workers/databases/third-party-integrations/neon/)、[Workers全栈应用](https://developers.cloudflare.com/workers/static-assets/routing/full-stack-application/)、[Render Free限制](https://render.com/docs/free)。以上为平台能力和兼容性评估，不是已验证部署。Vercel也支持Fastify，但其Hobby限制个人非商业使用，不把它当作本站长期免费商用方案。

纯Workers路线的最小验证：本地Workers运行环境内真实SSR与HTTP API读取；独立Neon项目事务、分页/筛选/搜索、主题与模型榜；失败状态和匿名/管理员边界；线上HTTPS、Cookie、缓存、RSS/API/MCP及整站smoke。兼容性原型通过后才能确定最终移植范围，禁止先发布缺失API的静态页面来声称部署完成。首版不运行模型或持续采集，也不新增收费订阅或无授权定时自动化。

## 配置准备

参考 `deploy/aihot.lol.env.example`，在目标服务器的私密配置中填写随机管理员密码、签名密钥和数据库密码。完整 `.env` 不进入Git。不要把本机MVP数据库或开发凭据当作生产配置。

密钥配置好后，按原 `docs/deploy.md` 完成服务器准备。以下命令是待确认后的部署步骤，本阶段未执行：

```sh
docker compose config --quiet
docker compose --profile https build
docker compose --profile https up -d
node scripts/smoke.ts --base https://aihot.lol
```

启动前核对域名DNS指向已确认的服务器公网地址；HTTPS验证完成后再允许真实用户使用。界面、RSS、API和站点地图使用的绝对地址均由SITE_URL决定。生产Web不接收数据库和模型密钥。

## 上线前所需事实

| 项目 | 状态与所需信息 |
|---|---|
| 运行平台 | 已选Neon独立免费项目；Containers付费被用户拒绝，免费Workers适配与Render路线正在确认 |
| 模型服务 | 待确定OpenAI兼容服务、模型名称、每日费用预算；Key通过平台或本地私密配置提供 |
| 采集范围 | 现有18个上游示范源为候选；正式范围及重点/噪声口味由用户确认 |
| 品牌 | 独立开发名AI简报；aihot.lol为用户域名，未使用原站Logo |
| 法律文案 | site/pages/仍有运营主体/联系方式模板，生产上线前需实际填写并由用户确认 |
| 内容验收 | 双方相同近30天窗口、相同去重口径；当前5条样本尚未达到超过参考站的目标 |

## 采集验证

本机DNS将公开站点解析为198.18.* fake-IP，上游采集器会按地址防护拒绝。部署环境需验证正常公网DNS和信源读取，不放宽SSRF防护。先在关闭真实模型/付费采集的状态检查免费源，再用已确认预算的小批量处理验证分类、日期、重复和摘要。

采集和模型开启是生产运行配置的一部分。开启前先在后台配置付费请求上限，检查运行回执和错误处理；日报依赖已处理内容，不能只因配置了08:00就承诺每天已经出刊。

## 验证边界

本机没有Docker；GitHub原Docker构建/运行检查已通过，但不等于Cloudflare或Render部署通过。当前验证包括Node类型检查、Web构建、数据库/Web测试、本地smoke、真实浏览器交互、Cloudflare账户/域名核验和Neon项目创建结果。生产发布须在选定目标环境完成检查。
