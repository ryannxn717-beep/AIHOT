import { Link, redirect, useLoaderData } from "react-router";
import { CATEGORY_LABELS } from "@aihot/contracts/taxonomy";
import { SITE } from "@aihot/site";
import { beijingDate } from "@aihot/contracts/time";
import type { Route } from "./+types/home";
import type { TimelineResponse } from "@aihot/contracts/site";
import { cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { filterParams, hasFeedFilters, itemListLd, listPath, pageMeta, readFilters, siteLd } from "../lib/seo";
import type { Screen } from "../components/shell/screens";
import { Timeline } from "../features/feed/Timeline";
import { HotTopics } from "../features/feed/HotTopics";
import { ActiveFilters, CategoryTabs, FeedBar, SearchField } from "../features/feed/Filters";
import { IntentLink } from "../components/ui/IntentLink";
import { rememberPreview } from "../features/item/preview";

export const handle: Screen = { tab: "featured", name: "精选" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  // Search lives on /all; keep the parameters so old links still land on results.
  if (q && q.trim()) throw redirect(`/all${url.search}`);
  const filters = readFilters(url.searchParams);
  const upstream = new Headers();
  const data = await loadOr404<TimelineResponse>(listPath("/api/site/timeline", filterParams(filters)), { responseHeaders: upstream, signal: request.signal });
  return cachedPage(60, { data, filters }, upstream);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const path = listPath("/", loaderData ? filterParams(loaderData.filters) : {});
  const titles = loaderData?.data.cards.map((c) => c.item.title) ?? [];
  return pageMeta({ path, noindex: hasFeedFilters(loaderData?.filters), jsonLd: path === "/" ? [...siteLd(), itemListLd("/", "精选", titles)] : undefined });
}

export default function Home() {
  const { data, filters } = useLoaderData<typeof loader>();
  const title = filters.tag ? `#${filters.tag}` : filters.category ? CATEGORY_LABELS[filters.category] : filters.channel === "firstParty" ? "一手消息" : "最新精选";
  const lead = data.cards[0]?.item;
  return (
    <div className="brief-home pb-6">
      <FeedBar base="/" category={filters.category} channel={filters.channel} />
      <ActiveFilters base="/" category={filters.category} channel={filters.channel} tag={filters.tag} />
      <div className="brief-intro">
        <div><p className="brief-kicker">{SITE.subject} 资讯与进展</p><h1>读懂 AI 正在发生什么</h1><p className="brief-intro-note">从原始来源出发，读发布、看研究、跟进重要进展。</p></div>
        <Link to="/daily" className="brief-report-link">读一份 AI 日报 <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="brief-columns">
        <div className="min-w-0">
          {lead ? <section data-reading-lead className="brief-lead" aria-label="重点阅读">
            <div className="brief-lead-meta"><span>重点阅读</span><span>{lead.source.name}{lead.publishedAt && <> · <time dateTime={lead.publishedAt}>{beijingDate(lead.publishedAt)}</time></>}</span></div>
            <h2><IntentLink to={`/items/${lead.id}`} aria-label={`阅读重点：${lead.title}`} onClick={() => rememberPreview(lead)}>{lead.title}<span aria-hidden="true"> ↗</span></IntentLink></h2>
            {lead.summary && <p>{lead.summary}</p>}
            {lead.reason && <div className="brief-lead-reason">{lead.reason}</div>}
          </section> : <section className="brief-empty"><h2>值得看的进展，陆续整理中</h2><p>当前筛选暂无精选，可以先浏览全部动态或选择其他主题。</p><Link to="/all">浏览全部动态 →</Link></section>}
          <div className="brief-section-heading"><h2>{title}</h2><Link to="/all">全部动态 →</Link></div>
          <div className="brief-filter-row hidden lg:flex">
          <CategoryTabs base="/" category={filters.category} channel={filters.channel} layoutId="home-cat-desk" className="min-w-0" />
          </div>
          <div className="brief-feed"><Timeline initial={data} filters={data.filters} /></div>
        </div>
        <aside className="brief-reading-aside" aria-label="更多阅读">
          <section className="brief-search"><h2>找你关心的进展</h2><SearchField keep={{ category: filters.category }} /><p>按公司、模型或关键词搜索</p></section>
          {!!data.hot?.length && <HotTopics entries={data.hot} />}
          <section className="brief-directions"><h2>按方向阅读</h2><Link to="/topics/agent">Agent 智能体 <span>↗</span></Link><Link to="/topics/coding">AI 编码 <span>↗</span></Link><Link to="/topics/open-source">开源生态 <span>↗</span></Link><Link to="/topics/on-device">端侧 AI <span>↗</span></Link><Link to="/topics">浏览全部主题 <span>→</span></Link></section>
          <section className="brief-reading-note"><p>阅读有依据</p><span>每条摘要附原始来源。多方报道归为一件事，重要进展持续跟进。</span><Link to="/about">了解本站 →</Link></section>
        </aside>
      </div>
    </div>
  );
}
