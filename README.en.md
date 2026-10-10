# AI Brief · aihot.lol

**Live website: [https://aihot.lol](https://aihot.lol/)**

AI Brief is an AI news reading site with Chinese summaries, original-source links, topic browsing and model rankings. It is built on the [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT) open-source framework with its own layout, name and logo.

[简体中文](README.md)

## Current release

The live MVP runs on **Cloudflare Workers + Neon PostgreSQL** at **aihot.lol**.

| Section | Available behavior |
|---|---|
| AI news | Selected and all articles, search, trending and daily briefing navigation |
| Topics | Browse by company/model, technical direction or content type |
| Model rankings | A manually verified LiveBench snapshot: 60 model configurations, 8 metrics, sorting and search |
| Website building and SEO | Not open yet |
| Other pages | About, changelog, text feedback, bookmarks, RSS/API/MCP |

The current news collection contains **5 manually verified samples** with original links and publication dates. Model rankings are not live. Automatic collection, model processing and briefing generation are not running; no daily briefings have been published. The goal of exceeding the reference site's content volume over the same 30-day window has not been met.

The public deployment does not expose the admin interface or accept feedback screenshots. Bookmarks and reading preferences stay in the current browser. GA4 is installed; see the [privacy notice](https://aihot.lol/privacy).

## Deployment and development

- [Cloudflare deployment](deploy/cloudflare/README.md): Workers, Neon, Hyperdrive, building and publishing.
- [Deployment status and evidence](docs/codex/mvp/PHASE_05_STATUS.md).
- [Project handoff](docs/codex/mvp/HANDOFF.md).
- [Original Node/Docker deployment](docs/deploy.md): instructions for running your own instance, not for visiting the live website. Collection and model jobs require a separate runtime, source configuration, credentials and budget.
- [Technical flow](docs/codex/mvp/TECHNICAL_FLOW.md) and [architecture](docs/architecture.md).
- [Ranking sources and update procedure](site/rankings/README.md).

The original Node/Docker runtime remains available. The public MVP uses separate web and API Workers. Database access and secrets stay in the API; the web Worker calls it over an HTTP service binding.

## Feedback and contact

Operator: **AI hot**. A public contact email will be added later.

Use the [feedback page](https://aihot.lol/feedback) or [repository Issues](https://github.com/ryannxn717-beep/AIHOT/issues) for corrections and problems. Do not post email addresses, credentials or other private information in public Issues.

[Terms](https://aihot.lol/terms) · [Privacy](https://aihot.lol/privacy)

## License and attribution

Built on [KKKKhazix/AIHOT](https://github.com/KKKKhazix/AIHOT), retaining upstream copyright notices, the [MIT license](LICENSE) and third-party notices in [NOTICE](NOTICE). The code license does not cover third-party articles or model benchmark data.
