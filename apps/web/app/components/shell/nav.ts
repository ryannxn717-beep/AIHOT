// Site navigation in one place: the desktop sidebar's sections and the phone tab bar's tabs, the engine's
// and the site's modules'.
import type { ReactNode } from "react";
import { webModules } from "../../site-modules";
import {
  IconBolt, IconBookmark, IconDoc, IconFlame, IconGrid, IconHeart, IconHistory, IconMessage, IconPlug, IconUser,
} from "../icons";

export interface NavItem {
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  /** Match the path exactly (the home page). */
  end?: boolean;
  /** Shows the unread dot while the changelog has news. */
  changelog?: boolean;
  children?: NavItem[];
  disabled?: boolean;
}

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "内容",
    items: [
      { to: "/", label: "AI 动态", icon: IconBolt, children: [
        { to: "/", label: "精选动态", icon: IconBolt, end: true },
        { to: "/all", label: "全部资讯", icon: IconDoc },
        { to: "/hot", label: "热点榜", icon: IconFlame },
        { to: "/daily", label: "AI 日报", icon: IconDoc },
      ] },
      { to: "/topics", label: "主题", icon: IconGrid, children: [
        { to: "/topics?group=company", label: "公司与模型", icon: IconGrid },
        { to: "/topics?group=field", label: "技术方向", icon: IconGrid },
        { to: "/topics?group=genre", label: "内容类型", icon: IconDoc },
      ] },
      { to: "/leaderboard", label: "模型榜", icon: IconGrid },
      { to: "/overseas", label: "出海建站", icon: IconPlug, disabled: true },
      { to: "/seo", label: "SEO 内容", icon: IconDoc, disabled: true },
    ],
  },
  {
    title: "更多",
    items: [
      { to: "/more", label: "我的", icon: IconUser },
      { to: "/starred", label: "收藏", icon: IconBookmark },
      { to: "/reports", label: "报告中心", icon: IconDoc },
      { to: "/agent", label: "订阅与接入", icon: IconPlug },
      { to: "/about", label: "关于", icon: IconHeart },
      { to: "/changelog", label: "更新日志", icon: IconHistory, changelog: true },
      { to: "/feedback", label: "反馈", icon: IconMessage },
    ],
  },
];

/**
 * The sidebar: the engine's sections with the modules' between 内容 and 更多; a module naming a section
 * that is already there adds to it.
 */
export function sidebar(): Array<{ title: string; items: NavItem[] }> {
  const [content, ...rest] = SECTIONS;
  const more = rest.pop()!;
  const sections = [content!, ...rest].map((s) => ({ ...s, items: [...s.items] }));
  for (const m of webModules()) {
    if (!m.sidebar) continue;
    const section = sections.find((s) => s.title === m.sidebar!.section);
    if (section) section.items.push(...m.sidebar.items);
    else sections.push({ title: m.sidebar.section, items: [...m.sidebar.items] });
  }
  return [...sections, more];
}

/** Grouped reading entries cover their existing detail addresses. */
export function sidebarIsActive(item: NavItem, pathname: string): boolean {
  if (item.disabled) return false;
  if (item.children && item.to === "/") return pathname === "/" || /^\/(all|hot|story|items|reports|daily|weekly|monthly)(\/|$)/.test(pathname);
  if (item.end) return pathname === item.to;
  if (item.to === "/") return pathname === "/" || /^\/all(\/|$)/.test(pathname);
  if (item.to === "/reports") return /^\/(reports|daily|weekly|monthly)(\/|$)/.test(pathname);
  if (item.to === "/hot") return /^\/(hot|story)(\/|$)/.test(pathname);
  if (item.to === "/daily") return /^\/(daily|weekly|monthly)(\/|$)/.test(pathname);
  const path = item.to.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * The phone tab bar: 全部 lives beside 精选 as a switch, 热点 and 日报 are tabs, and "我的" at /more holds
 * 收藏, 外观, the tools and the site's own pages. Which tab a page sits under is declared by the page
 * itself (components/shell/screens.ts).
 */
export type TabKey =
  | "featured"
  | "hot"
  | "daily"
  | "me"
  // A module's tab.
  | (string & {});

export interface Tab {
  key: TabKey;
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  changelog?: boolean;
}

const ENGINE_TABS: Tab[] = [
  { key: "featured", to: "/", label: "资讯", icon: IconBolt },
  { key: "hot", to: "/hot", label: "热点", icon: IconFlame },
  { key: "daily", to: "/reports", label: "报告", icon: IconDoc },
  { key: "me", to: "/more", label: "我的", icon: IconUser, changelog: true },
];

/** The tab bar: the engine's, the modules' before 我的. */
export function tabs(): Tab[] {
  return [...ENGINE_TABS.slice(0, -1), ...webModules().flatMap((m) => m.tabs ?? []), ENGINE_TABS.at(-1)!];
}
