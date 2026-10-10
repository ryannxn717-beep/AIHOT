import { Link, useLoaderData, useSearchParams, type LoaderFunctionArgs } from "react-router";
import { rankModels, type ModelRankings } from "@aihot/contracts/rankings";
import { beijingDate } from "@aihot/contracts/time";
import { cachedPage, loadOr404 } from "@aihot/web/lib/api.server";
import { pageReuse } from "@aihot/web/lib/page-reuse";
import { pageMeta } from "@aihot/web/lib/seo";
import { PhoneBar } from "@aihot/web/components/shell/PhoneBar";
import type { Screen } from "@aihot/web/components/shell/screens";

export const handle: Screen = { home: "me", name: "模型榜" };
export { pageHeaders as headers } from "@aihot/web/lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();
export async function loader({ request }: LoaderFunctionArgs) {
  const rankings = await loadOr404<ModelRankings>("/api/site/model-rankings", { signal: request.signal });
  const metric = new URL(request.url).searchParams.get("metric") ?? "overall";
  if (!rankings.metrics.some(item => item.key === metric)) throw new Response(`未知评测维度：${metric}`, { status: 400 });
  return cachedPage(300, { rankings });
}
export function meta({ location }: { location: { search: string } }) {
  return pageMeta({ title: "AI 模型榜", description: "按综合、编程、推理等公开评测成绩比较模型，查看评测来源、版本与核验日期。", path: "/leaderboard", noindex: !!location.search });
}

export default function Leaderboard() {
  const { rankings } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const metric = params.get("metric") ?? "overall";
  const label = rankings.metrics.find(item => item.key === metric)!.label;
  const query = params.get("q")?.trim() ?? "";
  const all = rankModels(rankings.models, metric);
  const rows = all.filter(model => `${model.name} ${model.organization}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const metricHref = (key: string, keepQuery = true) => {
    const next = new URLSearchParams();
    if (key !== "overall") next.set("metric", key);
    if (query && keepQuery) next.set("q", query);
    return `/leaderboard${next.size ? `?${next}` : ""}`;
  };
  return <div className="mx-auto max-w-[1040px] pb-8">
    <PhoneBar title="模型榜" />
    <header className="border-b border-line pb-6 pt-2">
      <p className="text-[12px] text-accent">公开评测 · 按能力比较</p>
      <h1 data-page-title="" className="mt-3 text-[28px] font-semibold text-ink">AI 模型榜</h1>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ink-3">按公开评测成绩比较模型。点击模型名称，查看各项能力分数和测试配置。</p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-4"><a href={rankings.source.url} target="_blank" rel="noopener noreferrer" className="text-accent">来源：{rankings.source.name} ↗</a><span>评测版本 {rankings.source.release}</span><span>快照核验 <time dateTime={rankings.source.observedAt}>{beijingDate(rankings.source.observedAt)}</time></span></p>
    </header>
    <nav aria-label="评测维度" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-b border-line">
      {rankings.metrics.map(item => <Link key={item.key} to={metricHref(item.key)} aria-current={metric === item.key ? "page" : undefined} className={`border-b-2 py-3 text-[13px] ${metric === item.key ? "border-accent font-semibold text-ink" : "border-transparent text-ink-3"}`}>{item.label}</Link>)}
    </nav>
    <div className="my-5 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-[17px] font-semibold text-ink">{label}榜 <span className="ml-2 text-[12px] font-normal text-ink-4">{rows.length} / {all.length} 个模型配置</span></h2>
      <form action="/leaderboard" method="get" className="w-full sm:w-[280px]">
        {metric !== "overall" && <input type="hidden" name="metric" value={metric} />}
        <div className="flex border border-line bg-surface"><input aria-label="搜索模型或机构" type="search" name="q" defaultValue={query} key={query} placeholder="搜索模型或机构" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] text-ink outline-offset-2" /><button type="submit" className="px-3 text-[12px] text-accent">搜索</button></div>
      </form>
    </div>
    <table className="w-full table-fixed text-left text-[13px]">
      <caption className="sr-only">{rankings.source.name} {label}评测成绩，同分并列，搜索保留名次</caption>
      <thead className="border-y border-line bg-bg-sunk text-[12px] text-ink-3"><tr><th scope="col" className="w-12 py-3 font-medium">名次</th><th scope="col" className="py-3 font-medium">模型与配置</th><th scope="col" className="w-20 py-3 text-right font-medium">{label}分数</th></tr></thead>
      <tbody>{rows.map(model => <tr key={model.name} data-model={model.name} className="border-b border-line-soft align-top"><td data-model-rank className="num py-4 text-ink-3">{model.rank}</td><td className="py-4 pr-3">
        <details><summary className="cursor-pointer break-words text-[14px] font-medium leading-relaxed text-ink hover:text-accent">{model.name}</summary><dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-ink-3">{rankings.metrics.map(item => <div key={item.key} className="flex justify-between gap-2"><dt>{item.label}</dt><dd className="num">{model.scores[item.key].toFixed(1)}</dd></div>)}</dl></details>
        <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-ink-4"><span>{model.organization}</span>{model.openWeights && <span>开放权重</span>}</div>
      </td><td data-model-score className="num py-4 text-right text-[17px] font-semibold text-ink">{model.scores[metric].toFixed(1)}</td></tr>)}</tbody>
    </table>
    {!rows.length && <p className="py-10 text-[14px] text-ink-3">没有匹配“{query}”的模型。<Link to={metricHref(metric, false)} className="ml-3 text-accent">清除搜索 →</Link></p>}
    <footer className="mt-6 space-y-2 border-t border-line pt-5 text-[12px] leading-relaxed text-ink-4"><p>综合分来自 LiveBench 各类评测平均分。名次按本页所选维度排序，同分并列；搜索保留完整榜单名次。</p><p>这是已核验的公开快照，非实时榜单。成绩对应名称中标注的测试配置，不代表所有场景的使用效果；不同评测机构的分数不能直接混用。</p></footer>
  </div>;
}
