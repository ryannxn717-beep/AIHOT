# aihot.lol 正式运行配置

## 已完成

- 代码在用户仓库 https://github.com/ryannxn717-beep/AIHOT 。
- 独立导航/首页、搜索/分类、详情/原文、主题分组、收藏及来源说明。AI 动态与主题有下拉入口，出海建站和 SEO 内容未开放。
- 模型榜读取 LiveBench 核验快照，60 个配置、8 个维度；支持排序和搜索，尚未自动同步。
- 保留上游 API、Worker、PostgreSQL 和统一发布层；默认全文关闭。
- 用户提供的域名为aihot.lol。尚未改DNS或启动生产环境。

来源统计缺失时，页面使用不带数量的说明；本项目已停用原ABOUT.sourcesFallback的猜测数量。上游docs/deploy.md中的历史升级记录保留，仅描述原框架历史。

## 运行方案

沿用原项目Docker Compose：PostgreSQL17、一次性setup、API、Worker、Web，加Caddy管理HTTPS。已有域名可通过Cloudflare管理DNS，服务器需能运行这些进程和持久化数据库。

更简单的本地方案是只启动API与Web、人工整理内容；自动采集与模型关闭时适合验证阅读流程。此方案已运行，但不代表网站在公网持续更新。用户现已请求Cloudflare部署；迁移到Workers/托管数据库会改变原项目的任务和数据库运行方式，尚未实施。

## Cloudflare 部署核验（2026-10-10）

浏览器指定域名入口跳转Cloudflare登录页，但随后发现本机已有Wrangler OAuth登录，已通过官方CLI刷新并核验账户与用户给定账户相同，无需重新登录。最新CLI将OAuth凭据迁入系统钥匙串；只通过官方auth命令在内存中取得凭据用于官方API读取，不打印或存入项目。没有改DNS、购买服务或创建生产资源。

官方API只读核验：aihot.lol属于该账户且状态active；未发现本站对应Worker；Hyperdrive配置列表为空。订阅查询因现有权限不足返回403，Workers付费计划未知，不能把它当作免费或已付费。没有读取或复用其他项目的密钥。

当前代码a5fbd7ca2735901136107f43ccd37a3182a35775的GitHub Check工作流已通过，check和docker两个job均success：https://github.com/ryannxn717-beep/AIHOT/actions/runs/38012855913 。本地后端735项、Web67项、smoke38项通过，实际云端上线检查尚未进行。

原应用不是静态文件包：网页SSR通过HTTP读取Node API，API和常驻Worker依赖PostgreSQL与任务队列。仅上传apps/web/build/client到Pages会缺失页面服务、资讯API和采集流程，不能算完整部署。Cloudflare支持React Router应用，但这不代表现有自定义Node服务器、后台进程和本地持久化会直接迁移。

可选方案：

| 方案 | 最小改动与依赖 | 当前条件 |
|---|---|---|
| Cloudflare域名/CDN + 云服务器Docker（推荐保留上游引擎） | 原Docker Compose运行API、Worker、Web、PostgreSQL，Cloudflare管理DNS/HTTPS入口 | 需要可用服务器及用户授权的访问方式；目前未提供 |
| Cloudflare Containers + 持久化PostgreSQL | 给现有镜像增加Cloudflare路由和进程编排，确认后台持续运行与停止行为，连接独立持久化数据库 | Workers付费计划因权限不足未知，费用预算及数据库连接未提供，部署适配未实现 |
| Workers/Pages + D1重写 | 替换PostgreSQL查询、pg-boss队列、模型任务和文件处理 | 不是本次部署的最小方案，不自行重写 |

依据：[Cloudflare Containers存储与生命周期](https://developers.cloudflare.com/containers/faq/)、[Containers计费](https://developers.cloudflare.com/containers/platform/pricing/)、[Workers全栈应用](https://developers.cloudflare.com/workers/static-assets/routing/full-stack-application/)。Containers默认磁盘会在休眠后丢失，不能把原PostgreSQL数据目录直接当持久化数据库；Containers属于Workers付费计划并按运行资源计费，不自动开通收费服务。

待确认的是上线范围（先上线样本MVP，或先补正式内容/自动更新）与可用运行资源。栏目齐全不等于内容齐全：目前资讯仅5条人工样本，尚无已发布日报；没有达到近30天内容超过参考站的验收。模型密钥、预算和法律模板运营信息仍未提供，不能把现有开关关闭状态称为正式自动资讯服务。

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
| 运行平台 | 待用户提供已有云服务器/平台，或选择先保持本地开发；无需在聊天中发送密码 |
| 模型服务 | 待确定OpenAI兼容服务、模型名称、每日费用预算；Key通过平台或本地私密配置提供 |
| 采集范围 | 现有18个上游示范源为候选；正式范围及重点/噪声口味由用户确认 |
| 品牌 | 独立开发名AI简报；aihot.lol为用户域名，未使用原站Logo |
| 法律文案 | site/pages/仍有运营主体/联系方式模板，生产上线前需实际填写并由用户确认 |
| 内容验收 | 双方相同近30天窗口、相同去重口径；当前5条样本尚未达到超过参考站的目标 |

## 采集验证

本机DNS将公开站点解析为198.18.* fake-IP，上游采集器会按地址防护拒绝。部署环境需验证正常公网DNS和信源读取，不放宽SSRF防护。先在关闭真实模型/付费采集的状态检查免费源，再用已确认预算的小批量处理验证分类、日期、重复和摘要。

采集和模型开启是生产运行配置的一部分。开启前先在后台配置付费请求上限，检查运行回执和错误处理；日报依赖已处理内容，不能只因配置了08:00就承诺每天已经出刊。

## 验证边界

本机没有Docker，因此本阶段无法声称Docker镜像构建或Caddy证书已经验证。可验证范围是Node类型检查、Web构建、数据库/Web测试、本地smoke、真实浏览器交互和配置文件内容。生产发布须在目标环境再次完成检查。
