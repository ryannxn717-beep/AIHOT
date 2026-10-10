# GA4 接入（2026-10-11）

- Goal：按用户提供的Google标签接入G-MHMRHTRMJ3，并同步隐私说明；不增加GTM容器或自定义行为事件。
- Context：SITE站点配置、根文档loader/Layout、现有SSR网页测试、Cloudflare部署入口、上线交接。用户明确批准新的GA4隐私段落随标签上线。
- Decision：推荐保留原始gtag脚本，通过Google增强型衡量识别History API变化。手动page_view需要协调GA后台设置才能避免重复，不在本次新增；GTM对当前单一标签没有必要。仅aihot.lol公开页面输出标签，本地或其他域名不输出，Node管理地址不输出。
- Files：site/site.ts配置编号及正式域名；apps/web/app/root.tsx按请求域名加载一次异步标签和初始化；site/pages/privacy.md公布GA4/分析Cookie与Google隐私政策；navigation-structure.test.ts验证正式页面单次安装、本地不安装。
- Verification：根类型检查、Cloudflare专用类型检查、构建通过；本地隔离测试库735项后端测试、68项Web测试通过。正式首页/all/leaderboard/privacy各有一个正确外部脚本及一个config初始化；隐私页面有批准后的GA4段落，旧“未启用第三方访客分析”已移除。37项线上smoke及并发读取/搜索/模型榜/反馈完整check通过。日志在ignored .data/ga4-*.log。
- Deployment：API c0a6f717-f4fd-4e06-99c0-427911cf4a76（更新隐私静态配置）；Web ff0f08a3-3c31-4d67-bcb6-03de8c4ab4fa；域名https://aihot.lol。私有API边界不变，无新付费资源或凭据。
- Risks：未进入用户GA4后台，不能声称实时报告或DebugView已经收到数据。站内虚拟页面浏览依赖该Web数据流的增强型衡量/浏览器历史变化选项；标签被浏览器或网络拦截时不会收数。没有上传反馈正文、邮箱或密钥的自定义事件。
- Evidence：Chrome实际隐私页和单次标签DOM检查；截图.data/screenshots/ga4-public-privacy.png。用户浏览器正式页已markDeliverable。
- Reference：https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications 。
