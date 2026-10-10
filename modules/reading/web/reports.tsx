import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import type { ReportIndexResponse, ReportKind } from "@aihot/contracts/site";
import { cachedPage, loadOr404 } from "@aihot/web/lib/api.server";
import { pageReuse } from "@aihot/web/lib/page-reuse";
import { pageMeta } from "@aihot/web/lib/seo";
import { PhoneBar } from "@aihot/web/components/shell/PhoneBar";
import type { Screen } from "@aihot/web/components/shell/screens";

const periods: Array<{ kind: ReportKind; label: string; purpose: string }> = [
  { kind: "daily", label: "日报", purpose: "集中阅读一天的重要发布与进展。" },
  { kind: "weekly", label: "周报", purpose: "把一周的变化放在一起，回看重要事件。" },
  { kind: "monthly", label: "月报", purpose: "用更长的时间跨度理解模型、产品与行业。" },
];
export const handle: Screen = { tab: "daily", name: "报告" };
export { pageHeaders as headers } from "@aihot/web/lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();
export async function loader({ request }: LoaderFunctionArgs) {
  const indices = await Promise.all(periods.map(({ kind }) => loadOr404<ReportIndexResponse>(`/api/site/reports/${kind}`, { signal: request.signal })));
  return cachedPage(60, { indices });
}
export function meta() {
  return pageMeta({ title: "报告中心", description: "按日报、周报与月报阅读已发布的 AI 资讯，查找往期报告。", path: "/reports" });
}

export default function Reports() {
  const { indices } = useLoaderData<typeof loader>();
  return <div className="mx-auto max-w-[1040px] pb-8">
    <PhoneBar title="报告" />
    <header className="border-b border-line pb-7 pt-2"><p className="text-[12px] tracking-widest text-accent">AI 进展归档</p><h1 className="mt-3 text-[30px] font-semibold text-ink">按你的时间，读一份报告</h1><p className="mt-3 text-[14px] leading-relaxed text-ink-3">从一天到一个月，集中阅读已整理的消息。每期保留来源与原文入口。</p></header>
    <div className="mt-8 grid gap-9 lg:grid-cols-3 lg:gap-8">
      {periods.map(({ kind, label, purpose }, index) => <section key={kind} aria-label={label} className="min-w-0">
        <div className="flex items-center justify-between border-b border-line-strong pb-3"><h2 className="text-[20px] font-semibold text-ink">{label}</h2><Link to={`/${kind}`} className="text-[12px] text-accent">进入{label} →</Link></div>
        <p className="mt-3 min-h-12 text-[13px] leading-relaxed text-ink-3">{purpose}</p>
        {indices[index]!.items.length ? <ul className="mt-3">{indices[index]!.items.slice(0, 6).map(issue => <li key={issue.key} className="border-b border-line-soft py-4"><Link to={`/${kind}/${issue.key}`} className="block text-[14px] font-medium leading-relaxed text-ink hover:text-accent"><span className="mb-2 block text-[11px] font-normal text-ink-4">{issue.key} · 第 {issue.issueNumber} 期 · {issue.count} 件</span>{issue.title ?? `${label} · ${issue.key}`}</Link></li>)}</ul> : <p className="mt-4 border-l-2 border-line pl-4 text-[13px] leading-relaxed text-ink-3">{label}尚未发布。已发布的报告会出现在这里。</p>}
      </section>)}
    </div>
    <footer className="mt-10 flex flex-wrap gap-6 border-t border-line pt-5 text-[13px] text-accent"><Link to="/daily/archive">查阅日报合订本 →</Link><Link to="/">先读最新精选 →</Link></footer>
  </div>;
}
