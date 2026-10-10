# Workers 免费 MVP：部署状态（2026-10-10）

用户已批准 Workers＋Neon 免费路线；运营名称为 AI hot，邮箱稍后补充。展示品牌仍为 AI 简报。

独立工作区：/Users/mario/.codex/worktrees/cloudflare-mvp/AIHOT-lol；分支 codex/cloudflare-mvp，基线9433b8467f6b932041927cc97ae7b178b5439cca。

## 已完成与证据

- Neon独立项目 cool-bread-04447408 / branch br-cool-pond-b5nken3k / DB aibrief / PG17。仅新库初始化；58项迁移，18个候选信源，5条核验资讯及5条publication。未采集、未调模型。
- Hyperdrive aihot-lol：b31a55e917b545358f48e2d574ac39ea，关闭查询缓存。连接秘密只通过私密文件和官方密钥配置处理。
- Cloudflare API aihot-lol-api 已上传，workers.dev与preview_urls均关闭，无公开路由；版本8fcae710-50d3-4d82-a1cd-0b06667c101a。网页aihot-lol-web已私有上传，无公开路由；版本20b1f43e-82fc-43be-8c6e-be86aaa85f38，最后公开发布尚未执行。
- 本地workerd+Neon 37项公开smoke、12路普通并发读取、两路搜索、模型60条、文字反馈/拒绝截图/关闭后台与禁用栏目通过。原后端735、Web67、部署专项8项通过；原类型检查与部署专用类型检查通过。
- 独立复审及第3轮收尾审查均APPROVE；发现并修复encodedadmin路径和分享图片缺失。五文章OG/海报10张和37主题图均真实PNG200；MCP latest/search/hot/daily查询正常，空日报为not_found。
- Cloudflare签名远程预览：37项完整公开smoke、12路普通读取、两路搜索、60模型、文字反馈及拒绝附件/encodedadmin检查全部通过（.data/remote-cloudflare-check.log）；真正云端私有API+Hyperdrive健康、timeline、搜索、模型榜200，管理404；网页首页/all/topics/leaderboard/daily/privacy200。首个远程首页约3.8秒，其余数据页面约0.8–1.9秒，非高负载验收。
- 构建包gzip：API约1309KiB，Web约450KiB；低于免费3MiB限制。前端128个静态资源扫描真实秘密字符串，0命中。没有启用收费计划或自动化。

## 待公开发布

仓库AGENTS.md要求“条款和隐私说明的内容（site/pages/ 是模板，上线前需要他本人确认）”。两页已按实际MVP改写，并在异步问题中给出主要内容与路径等待同意：AI hot运营、邮箱后补、匿名阅读、无访客分析、文字反馈保存在Neon、无附件/飞书、反馈无自动到期可凭编号请求删除、资讯样本与模型快照。

这项确认尚未收到；时间过去不能视为批准。没有绑定aihot.lol、没有开workers.dev。邮箱后补不会单独阻止这次MVP，当前联系入口为站内反馈和仓库Issues。

Cloudflare zone aihot.lol active，控制台显示Free/未连接Worker。OAuth的DNS记录读取返回403，不创建更高权限令牌；可以用已登录Chrome只读核对，Workers自定义域名走已有Workers权限，必要时用域名控制台操作。不得改无关站点或为绕过权限创建API token。

公开前在生成Web配置加入唯一routes项 {pattern:aihot.lol, custom_domain:true}，部署并验证HTTPS、37项smoke、导航和反馈；API保持私有。不要把签名远程预览当公开网址。若用户不同意文案，改相应文案重新构建/私有验证后再发布。当前5条资讯、未发布日报、采集关闭，未达到30天超过参考站规模。

## 私密运行与重建

Node24运行时在/Users/mario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin。私密 .data/neon.env、.data/cloudflare-secrets.env（mode600）、.data/cloudflare-hyperdrive.json 均ignored；禁止输出密码/连接串。原项目本地PG17 127.0.0.1:55432已重启；其secret/.env不变。测试库仅aibrief_test。

构建重建会移除旧输出，先停Wrangler dev再重启；不要把文件监视重启失败当云端代码失败。本机remote API代理8789、remote Web代理8790由Wrangler签名预览，仅供验证，依赖会话生命周期。不要启用计划或后台常驻任务。

实际云端签名预览截图在.data/screenshots/phase05-cloudflare-private-home.png；本地Workers截图为phase05-workers-neon-home.png与mobile.png，Chrome tab1044399858已切换localhost8790云端签名代理并markHandoff；viewport已reset。canonical为https://aihot.lol/。Cloudflare域名tab1044399861目前DNS记录页（只读，未修改），仅1条既有TXT，无A/AAAA/CNAME，未覆盖任何记录。Neontab1044399699连接密码已隐藏，所有秘密仅私密存储。新资源与原项目互相独立，不删除资源或worktree。
