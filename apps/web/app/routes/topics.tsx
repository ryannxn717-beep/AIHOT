import { Link, useLoaderData, useSearchParams } from "react-router";
import { SITE, subjectAfter, withSubject } from "@aihot/site";
import type { Route } from "./+types/topics";
import type { TopicSummary, TopicsResponse } from "@aihot/contracts/site";
import { apiGet, cachedPage } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { breadcrumbLd, pageMeta, siteUrl } from "../lib/seo";
import { relativeTime } from "../lib/format";
import { IconChevronRight } from "../components/icons";
import { IntentLink } from "../components/ui/IntentLink";
import { BrandMark } from "../components/BrandMark";
import { PhoneBar } from "../components/shell/PhoneBar";
import type { Screen } from "../components/shell/screens";

export const handle: Screen = { home: "me", name: "主题" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request }: { request: Request }) {
  const data = await apiGet<TopicsResponse>("/api/site/topics", { signal: request.signal });
  const group = new URL(request.url).searchParams.get("group");
  if (group && !data.groups.some(item => item.key === group)) throw new Response(`未知主题分组：${group}`, { status: 400 });
  return cachedPage(300, data);
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  if (!loaderData) return pageMeta({ title: SITE.topicsTitle, path: "/topics", image: "/og/pages/topics.png" });
  const { groups, topics } = loaderData;
  const by = groups.map((g) => g.name).join("、");
  const indexed = topics.filter((t) => t.indexable);
  const named = indexed.slice(0, 6).map((t) => t.name.split(" / ")[0]).join("、");
  const base = siteUrl();
  return pageMeta({
    title: SITE.topicsTitle,
    description: `按${by}${subjectAfter("追踪", "最新动态")}：${named ? `${named}等 ` : ""}${topics.length} 个主题，浏览最新精选与重要进展，持续更新。`,
    path: "/topics",
    image: "/og/pages/topics.png",
    noindex: new URLSearchParams(location.search).get("scope") === "all" || new URLSearchParams(location.search).has("group"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${base}/topics#collection`,
        url: `${base}/topics`,
        name: withSubject("主题"),
        inLanguage: SITE.locale,
        isPartOf: { "@id": `${base}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: indexed.length,
          itemListElement: indexed.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${base}/topics/${t.slug}` })),
        },
      },
      breadcrumbLd([{ name: SITE.name, path: "/" }, { name: "主题", path: "/topics" }]),
    ],
  });
}

/** One readable row per topic; group explanations sit alongside the rows on wider screens. */
function TopicRow({ t }: { t: TopicSummary }) {
  return (
    <IntentLink
      viewTransition
      to={`/topics/${t.slug}`}
      className="group flex items-center gap-4 border-b border-line py-4 transition-colors hover:bg-bg-sunk/40 active:bg-bg-sunk"
    >
      {t.brand && (
        <span className="flex shrink-0">
          <BrandMark brand={t.brand} size={30} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2.5 text-[15.5px] font-semibold text-ink transition-colors group-hover:text-accent lg:text-[15px] lg:font-bold">
          {t.name}
        </span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-[1.7] text-ink-3">
          {t.latest?.title ?? t.definition}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11.5px] text-ink-4">
          {t.latest && <time dateTime={t.latest.at} suppressHydrationWarning>{relativeTime(t.latest.at)}</time>}
          <span>
            {t.recent > 0 ? (
              <>
                近 30 天 <span className="num font-semibold text-ink-3">{t.recent}</span> 条
              </>
            ) : (
              "近 30 天暂无新精选"
            )}
          </span>
        </span>
      </span>
      <IconChevronRight size={16} className="shrink-0 text-ink-4" />
    </IntentLink>
  );
}

export default function TopicsPage() {
  const { groups, topics } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const all = params.get("scope") === "all";
  const group = params.get("group");
  const inGroup = topics.filter(topic => !group || topic.group === group);
  const populated = inGroup.filter(topic => topic.total > 0);
  const shown = all ? inGroup : populated;
  const scopeHref = (scope: boolean) => {
    const query = new URLSearchParams();
    if (group) query.set("group", group);
    if (scope) query.set("scope", "all");
    return `/topics${query.size ? `?${query}` : ""}`;
  };
  return (
    <div className="pb-10">
      <PhoneBar back={{ to: "/more", label: "我的" }} title="主题" />
      <header className="pb-2 pt-3 lg:pt-1">
        <h1 data-page-title="" className="text-[24px] font-semibold leading-[1.3] text-ink">{subjectAfter("按主题看")}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          {`按${groups.map((g) => g.name).join("、")}浏览 `}
          <span className="num">{populated.length}</span> 个有内容的主题，追踪最新精选与重要进展。
        </p>
        <nav className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[13px]" aria-label="主题分组">
          <Link to={`/topics${all ? "?scope=all" : ""}`} aria-current={!group ? "page" : undefined} className={!group ? "font-semibold text-accent" : "text-ink-3"}>全部分组</Link>
          {groups.map(item => <Link key={item.key} to={`/topics?group=${item.key}${all ? "&scope=all" : ""}`} aria-current={group === item.key ? "page" : undefined} className={group === item.key ? "font-semibold text-accent" : "text-ink-3"}>{item.key === "genre" ? "内容类型" : item.name}</Link>)}
        </nav>
        <nav className="mt-3 flex gap-6 border-b border-line" aria-label="主题范围">
          <Link to={scopeHref(false)} aria-current={!all ? "page" : undefined} className={`border-b-2 py-3 text-[13px] ${!all ? "border-accent font-semibold text-ink" : "border-transparent text-ink-3"}`}>有内容的主题 <span className="num">{populated.length}</span></Link>
          <Link to={scopeHref(true)} aria-current={all ? "page" : undefined} className={`border-b-2 py-3 text-[13px] ${all ? "border-accent font-semibold text-ink" : "border-transparent text-ink-3"}`}>全部主题 <span className="num">{inGroup.length}</span></Link>
        </nav>
      </header>
      {!shown.length && <div className="py-12"><h2 className="text-[18px] font-semibold text-ink">主题内容正在整理</h2><p className="mt-2 text-[14px] leading-relaxed text-ink-3">可以先浏览全部动态，或查看已经配置的主题方向。</p><Link to="/all" className="mt-4 inline-block text-[13px] text-accent">浏览全部动态 →</Link></div>}
      {groups.filter(g => shown.some(topic => topic.group === g.key)).map((g) => (
        <section key={g.key} aria-labelledby={`topics-${g.key}`} className="grid gap-3 pt-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
          <div className="pt-4">
            <h2 id={`topics-${g.key}`} className="text-[15px] font-bold text-ink">
              {g.name}
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-4">{g.blurb}</p>
          </div>
          <ul>
            {shown
              .filter((t) => t.group === g.key)
              .map((t) => (
                <li key={t.slug}>
                  <TopicRow t={t} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
