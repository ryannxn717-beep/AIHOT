# AI 简报 · aihot.lol

**在线访问：[https://aihot.lol](https://aihot.lol/)**

AI 简报是面向普通 AI 使用者的资讯阅读站，提供中文摘要、原文链接、主题浏览与模型榜。本站基于 [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) 开源框架开发，使用独立布局、站名和 Logo。

[English](README.en.md)

## 当前上线版本

网站已部署到 **Cloudflare Workers + Neon PostgreSQL**，正式入口为 **aihot.lol**。

| 板块 | 当前功能 |
|---|---|
| AI 动态 | 精选动态、全部资讯、搜索、热点榜、AI 日报入口 |
| 主题 | 按公司与模型、技术方向、内容类型浏览 |
| 模型榜 | LiveBench 人工核验快照，60 个模型配置、8 个维度，支持排序与搜索 |
| 出海建站、SEO 内容 | 暂未开放 |
| 辅助入口 | 关于、更新日志、文字反馈、收藏、RSS/API/MCP |

当前资讯为 **5 条人工核验样本**，每条保留原文链接和真实发布日期。模型榜不是实时数据；自动采集、模型处理和日报生成尚未开启，暂无已发布日报。近 30 天内容量超过参考站的目标尚未完成。

公开站点不开放管理后台，也不接收反馈截图附件。收藏与阅读设置保存在当前浏览器。GA4 已接入，详见[隐私说明](https://aihot.lol/privacy)。

## 部署与开发

- [本站 Cloudflare 部署说明](deploy/cloudflare/README.md)：Workers、Neon、Hyperdrive、构建与发布方式。
- [上线状态与验证记录](docs/codex/mvp/PHASE_05_STATUS.md)：实际部署版本、验收证据与运行边界。
- [项目交接](docs/codex/mvp/HANDOFF.md)：当前状态与后续任务。
- [原框架的 Node/Docker 部署方式](docs/deploy.md)：用于自行运行框架，不是访问本站的步骤。常驻采集和模型任务需要另行配置运行环境、信源、密钥及预算。
- [技术流程](docs/codex/mvp/TECHNICAL_FLOW.md)与[架构说明](docs/architecture.md)。
- [模型榜来源与更新约定](site/rankings/README.md)。

框架保留 Node/Docker 运行方式；本次公开 MVP 使用两个 Cloudflare Worker，分别负责网页和 API。数据库及密钥仅在 API 端，网页通过服务绑定发送 HTTP 请求。

## 反馈与联系

运营名称：**AI hot**。公开联系邮箱待补充。

内容更正和功能问题可通过[站内反馈](https://aihot.lol/feedback)或[本仓库 Issues](https://github.com/ryannxn717-beep/AIHOT/issues)提交。请勿在公开 Issues 中发布邮箱、密钥或其他私人资料。

[使用规则](https://aihot.lol/terms) · [隐私说明](https://aihot.lol/privacy)

## 开源与许可

基于 [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) 开发，保留上游版权声明、[MIT 许可证](LICENSE)与字体等第三方许可声明 [NOTICE](NOTICE)。第三方资讯和模型评测数据的权利归相应来源，代码的 MIT 许可不覆盖这些内容。
