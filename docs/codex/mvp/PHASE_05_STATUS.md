# Workers 免费 MVP：部署状态（2026-10-10）

用户已批准 Workers＋Neon 免费路线；运营名称为 AI hot，邮箱稍后补充。展示品牌仍为 AI 简报。

2026-10-11更新：用户提供GA4编号G-MHMRHTRMJ3，并明确同意相应隐私段落上线；标签与文案均已部署。最新Web版本ff0f08a3-3c31-4d67-bcb6-03de8c4ab4fa、API版本c0a6f717-f4fd-4e06-99c0-427911cf4a76。下方是首次上线记录；最新验证及GA4后台尚未核验的边界见PHASE_06_GA4.md。

独立工作区：/Users/mario/.codex/worktrees/cloudflare-mvp/AIHOT-lol；分支 codex/cloudflare-mvp，基线9433b8467f6b932041927cc97ae7b178b5439cca。

## 已完成与证据

- Neon独立项目 cool-bread-04447408 / branch br-cool-pond-b5nken3k / DB aibrief / PG17。仅新库初始化；58项迁移，18个候选信源，5条核验资讯及5条publication。未采集、未调模型。
- Hyperdrive aihot-lol：b31a55e917b545358f48e2d574ac39ea，关闭查询缓存。连接秘密只通过私密文件和官方密钥配置处理。
- Cloudflare API aihot-lol-api 已上传，workers.dev与preview_urls均关闭，无公开路由；版本8fcae710-50d3-4d82-a1cd-0b06667c101a。网页aihot-lol-web已绑定唯一自定义域名aihot.lol，公开版本b2d02af1-2a76-4791-8570-17a2988a2647；workers.dev与preview_urls仍关闭。
- 本地workerd+Neon 37项公开smoke、12路普通并发读取、两路搜索、模型60条、文字反馈/拒绝截图/关闭后台与禁用栏目通过。原后端735、Web67、部署专项8项通过；原类型检查与部署专用类型检查通过。
- 独立复审及第3轮收尾审查均APPROVE；发现并修复encodedadmin路径和分享图片缺失。五文章OG/海报10张和37主题图均真实PNG200；MCP latest/search/hot/daily查询正常，空日报为not_found。
- Cloudflare签名远程预览：37项完整公开smoke、12路普通读取、两路搜索、60模型、文字反馈及拒绝附件/encodedadmin检查全部通过（.data/remote-cloudflare-check.log）；真正云端私有API+Hyperdrive健康、timeline、搜索、模型榜200，管理404；网页首页/all/topics/leaderboard/daily/privacy200。首个远程首页约3.8秒，其余数据页面约0.8–1.9秒，非高负载验收。
- 构建包gzip：API约1309KiB，Web约450KiB；低于免费3MiB限制。前端128个静态资源扫描真实秘密字符串，0命中。没有启用收费计划或自动化。
- 开源代码已推送用户仓库 main，代码提交71b2a8cbb7f5a1cff53c7ae028871a4a7378b730；本地HEAD与远端main一致。GitHub Actions运行38051213297的check与docker两个任务均success：https://github.com/ryannxn717-beep/AIHOT/actions/runs/38051213297 。包含后端/Web检查及原Docker构建、启动和smoke。

## 已公开发布（2026-10-10）

仓库AGENTS.md要求“条款和隐私说明的内容（site/pages/ 是模板，上线前需要他本人确认）”。用户已在异步问题中明确回答“同意上线这版，邮箱稍后补充”。批准内容：AI hot运营、邮箱后补、匿名阅读、无访客分析、文字反馈保存在Neon、无附件/飞书、反馈无自动到期可凭编号请求删除、资讯样本与模型快照。

确认后通过官方Wrangler发布并绑定https://aihot.lol。Cloudflare官方API核实hostname=aihot.lol、service=aihot-lol-web、environment=production；两个Worker的workers.dev及预览仍关闭。没有购买付费计划，API只通过Web服务绑定访问。邮箱后补，当前联系入口为站内反馈和仓库Issues。

Cloudflare zone aihot.lol active。OAuth的DNS记录读取曾返回403；官方Wrangler使用已有Workers权限成功绑定自定义域名，没有创建更高权限令牌、没有覆盖既有TXT或修改其他站点。

公开验收：HTTPS证书正常、首页200；37项smoke以及12路普通并发读取、两路搜索、60模型配置、文字反馈201/无效反馈400、附件拒绝400、编码管理地址404全部通过（.data/public-cloudflare-check.log）。Chrome实际域名客户端导航到/all、搜索ReviewBench仅返回对应资讯；首页图片加载完成；桌面1470与手机390宽度均无横向溢出，手机搜索浮层打开/关闭正常。首次浏览器访问曾超时，随后重新加载正常；本机DNS为198.18.*代理fake-IP，不修改网络设置或放宽SSRF。当前5条资讯、未发布日报、采集关闭，未达到30天超过参考站规模；没有做高负载或长期配额验收。

## 私密运行与重建

Node24运行时在/Users/mario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin。私密 .data/neon.env、.data/cloudflare-secrets.env（mode600）、.data/cloudflare-hyperdrive.json 均ignored；禁止输出密码/连接串。原项目本地PG17 127.0.0.1:55432已重启；其secret/.env不变。测试库仅aibrief_test。

构建重建会移除旧输出，先停Wrangler dev再重启；不要把文件监视重启失败当云端代码失败。本机remote API代理8789、remote Web代理8790由Wrangler签名预览，仅供验证，依赖会话生命周期。不要启用计划或后台常驻任务。

正式上线截图在.data/screenshots/phase05-public-home.png与phase05-public-mobile.png，Chrome tab1044399858已打开https://aihot.lol/并markDeliverable；viewport已reset。早期签名预览截图为phase05-cloudflare-private-home.png。Cloudflare域名tab1044399861已在只读核对后关闭；Neontab1044399699连接密码已隐藏，所有秘密仅私密存储。新资源与原项目互相独立，不删除资源或worktree。
