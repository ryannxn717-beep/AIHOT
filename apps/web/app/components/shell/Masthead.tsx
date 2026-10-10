import { useEffect, useRef, useState } from "react";
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

function NavLink({ item, dot, primary = false }: { item: NavItem; dot: boolean; primary?: boolean }) {
  const { pathname, search } = useLocation();
  const group = new URLSearchParams(item.to.split("?")[1]).get("group");
  const isActive = sidebarIsActive(item, pathname) && (!group || new URLSearchParams(search).get("group") === group);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      data-nav-label={primary ? item.label : undefined}
      prefetch="intent"
      onClick={event => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.currentTarget.closest("details")?.removeAttribute("open");
      }}
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
  const header = useRef<HTMLElement>(null);
  const { pathname, search } = useLocation();
  useEffect(() => {
    header.current?.querySelectorAll("details[open]").forEach(menu => menu.removeAttribute("open"));
  }, [pathname, search]);
  useEffect(() => {
    const close = () => header.current?.querySelectorAll("details[open]").forEach(menu => menu.removeAttribute("open"));
    const pointer = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) close(); };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const menu = header.current?.querySelector("details[open]");
      if (!menu) return;
      close();
      (menu.querySelector("summary") as HTMLElement | null)?.focus();
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", key); };
  }, []);
  return (
    <header ref={header} data-site-masthead className="brief-masthead">
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
        <nav className="brief-primary-nav" aria-label="主导航">
          {sections.slice(0, -1).flatMap(section => section.items).map(item => item.disabled ?
            <span key={item.to} data-nav-label={item.label} aria-disabled="true" className="brief-nav-unavailable"><span>{item.label}</span><span>暂未开放</span></span> : item.children ?
            <details key={item.to} data-nav-label={item.label} className="brief-nav-group" onToggle={event => {
              const menu = event.currentTarget;
              if (menu.open) header.current?.querySelectorAll("details[open]").forEach(other => { if (other !== menu) other.removeAttribute("open"); });
            }}>
              <summary className={`brief-nav-link ${sidebarIsActive(item, pathname) ? "brief-nav-active" : ""}`} aria-current={sidebarIsActive(item, pathname) ? "true" : undefined}>{item.label}<span aria-hidden="true" className="brief-nav-chevron">⌄</span></summary>
              <div className="brief-dropdown-menu">{item.children.map(child => <NavLink key={child.to} item={child} dot={dot} />)}</div>
            </details> : <NavLink key={item.to} item={item} dot={dot} primary />)}
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
