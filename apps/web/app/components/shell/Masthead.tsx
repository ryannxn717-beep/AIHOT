import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { SITE } from "@aihot/site";
import { Wordmark } from "@aihot/site/brand/Logo.tsx";
import { useChangelogSeen } from "../../lib/local-state";
import { sidebar, sidebarIsActive, type NavItem } from "./nav";
import { ThemeSwitch } from "./ThemeSwitch";
import { IconGithub } from "../icons";

/** True while the changelog has an entry newer than the one this reader last opened. */
export function useChangelogDot(latestVersion: string | null): boolean {
  const seen = useChangelogSeen();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !latestVersion) return false;
  return !seen || seen < latestVersion;
}

function NavLink({ item, dot }: { item: NavItem; dot: boolean }) {
  const { pathname } = useLocation();
  const isActive = sidebarIsActive(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      prefetch="intent"
      aria-current={isActive ? "page" : undefined}
      className={`brief-nav-link ${isActive ? "brief-nav-active" : ""}`}
    >
      <span className="shrink-0">
        <Icon size={17} />
      </span>
      <span>{item.label}</span>
      {dot && item.changelog && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-hot" aria-label="有新的更新" />}
    </Link>
  );
}

export function Masthead({ changelogVersion }: { changelogVersion: string | null }) {
  const dot = useChangelogDot(changelogVersion);
  const sections = sidebar();
  return (
    <header data-site-masthead className="brief-masthead hidden lg:block">
      <div className="brief-masthead-inner">
        <Link to="/" className="brief-brand" aria-label={`${SITE.name} 首页`}>
          <Wordmark size={28} />
          <span>把进展读清楚</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeSwitch className="w-[112px]" />
          {SITE.github && <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="brief-source-link"><IconGithub size={16} /> 开源</a>}
        </div>
      </div>
      <div className="brief-nav-inner">
        <nav className="flex flex-wrap gap-x-5" aria-label="主导航">
          {sections.slice(0, -1).flatMap(section => section.items).map(item => <NavLink key={item.to} item={item} dot={dot} />)}
        </nav>
        <details className="brief-more">
          <summary>更多</summary>
          <div className="brief-more-menu">
            {sections.at(-1)?.items.map(item => <NavLink key={item.to} item={item} dot={dot} />)}
          </div>
        </details>
      </div>
    </header>
  );
}
