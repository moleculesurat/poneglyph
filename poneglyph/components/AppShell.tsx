"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePersona, type Persona } from "@/components/persona";
import { useSandboxToast } from "@/components/toast";
import { NAV_ITEMS, INSPECTOR_ITEM, INSPECTOR_HOME, findCrumb, type NavGroup } from "@/lib/nav";
import { tenant } from "@/data/tenant";

const GROUP_ORDER: NavGroup[] = ["Inspection", "Oversight", "Compliance", "Engine"];

const INSPECTOR_PROFILE = {
  name: "R. Menon",
  role: "Inspector · SEBI MIRSD",
  initials: "RM",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { persona, setPersona } = usePersona();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useSandboxToast();

  const [sideOpen, setSideOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* close overlays on navigation */
  useEffect(() => {
    setSideOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  /* close profile menu on outside click / Escape */
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const items = persona === "inspector"
    ? [INSPECTOR_ITEM, ...NAV_ITEMS.filter((t) => t.inspector)]
    : NAV_ITEMS;
  const groups = GROUP_ORDER.filter((g) => items.some((i) => i.group === g));

  const crumb = persona === "inspector" && pathname === INSPECTOR_HOME
    ? { group: "Inspection", label: "Session" }
    : findCrumb(pathname);
  /* group crumb lands on the first page of that group for this persona */
  const groupHome = items.find((i) => i.group === crumb.group)?.href
    ?? (persona === "inspector" ? INSPECTOR_HOME : "/");

  const copyRoute = () => {
    const done = () => toast(`Route copied — ${pathname}`);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(pathname).then(done, done);
    } else {
      done();
    }
  };

  const profile = persona === "broker"
    ? { name: tenant.team[0].name, role: tenant.team[0].role, initials: tenant.team[0].initials }
    : INSPECTOR_PROFILE;

  const switchPersona = (p: Persona) => {
    if (p !== persona) {
      setPersona(p);
      router.push(p === "inspector" ? INSPECTOR_HOME : "/");
    }
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── sandbox strip ── */}
      <div
        style={{
          background: "var(--ink)",
          color: "rgba(255,255,255,0.85)",
          padding: "7px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          position: "relative",
          zIndex: 56,
        }}
      >
        <span style={{ width: 18, height: 8, borderRadius: 2, background: "var(--orange)", flex: "none" }} />
        <span className="mono-label" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
          Sandbox environment — realistic simulated data · everything is explorable, nothing is actionable
        </span>
      </div>

      <div className="app-row">
        {/* ── sidebar ── */}
        <aside className="sidebar" data-open={sideOpen}>
          {/* brand */}
          <Link
            href={persona === "inspector" ? INSPECTOR_HOME : "/"}
            className="row"
            style={{ gap: 11, padding: "16px 16px 14px", borderBottom: "1.5px solid var(--ink-10)" }}
          >
            <Image src="/walrus-mark.png" alt="Walrus Securitas" width={30} height={30} priority />
            <span className="stack" style={{ gap: 2 }}>
              <span className="mono-label" style={{ fontSize: 13, letterSpacing: "0.14em" }}>
                Poneglyph
              </span>
              <span className="mono-label dim" style={{ fontSize: 8.5 }}>
                by Walrus <b style={{ color: "var(--orange)", fontWeight: 500 }}>Securitas</b>
              </span>
            </span>
          </Link>

          {/* tenant */}
          <div style={{ padding: "12px 14px 0" }}>
            <div className="panel" style={{ padding: "9px 12px" }}>
              <div className="mono-label" style={{ fontSize: 9.5, lineHeight: 1.6 }}>
                {tenant.name}
              </div>
              <div className="mono-label dim" style={{ fontSize: 8.5, marginTop: 2 }}>
                {tenant.sebiRegNo} · {tenant.exchanges.join(" + ")}
              </div>
              {persona === "inspector" ? (
                <div className="chip" data-tone="live" style={{ marginTop: 8, fontSize: 8.5 }}>
                  <span className="dot" data-pulse /> Under inspection
                </div>
              ) : null}
            </div>
          </div>

          {/* nav */}
          <nav style={{ paddingBottom: 12 }}>
            {groups.map((g) => (
              <div key={g}>
                <div className="side-group">{g}</div>
                {items
                  .filter((i) => i.group === g)
                  .map((i) => (
                    <Link key={i.href} href={i.href} className="side-item" data-active={pathname === i.href}>
                      {i.label}
                    </Link>
                  ))}
              </div>
            ))}
          </nav>

          {/* profile + dropdown */}
          <div ref={menuRef} style={{ marginTop: "auto", position: "relative" }}>
            {menuOpen ? (
              <div className="menu-pop">
                <div className="side-group" style={{ padding: "12px 14px 6px" }}>
                  View as
                </div>
                <button className="menu-item" onClick={() => switchPersona("broker")}>
                  <span className="avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                    {tenant.team[0].initials}
                  </span>
                  <span className="stack" style={{ gap: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>Broker compliance</span>
                    <span className="small dim" style={{ fontSize: 10.5 }}>{tenant.team[0].name} · full console</span>
                  </span>
                  {persona === "broker" ? (
                    <span style={{ marginLeft: "auto", color: "var(--orange)" }}>●</span>
                  ) : null}
                </button>
                <button className="menu-item" onClick={() => switchPersona("inspector")}>
                  <span className="avatar" data-tone="inspector" style={{ width: 24, height: 24, fontSize: 9 }}>
                    {INSPECTOR_PROFILE.initials}
                  </span>
                  <span className="stack" style={{ gap: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 12.5 }}>SEBI Inspector</span>
                    <span className="small dim" style={{ fontSize: 10.5 }}>{INSPECTOR_PROFILE.name} · read-only</span>
                  </span>
                  {persona === "inspector" ? (
                    <span style={{ marginLeft: "auto", color: "var(--orange)" }}>●</span>
                  ) : null}
                </button>
                <hr className="hairline" />
                <button className="menu-item" onClick={() => { setMenuOpen(false); toast(); }}>
                  Account settings
                </button>
                <button className="menu-item" onClick={() => { setMenuOpen(false); toast("Sandbox — sessions are simulated"); }}>
                  Sign out
                </button>
              </div>
            ) : null}
            <button className="profile-btn" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
              <span className="avatar" data-tone={persona === "inspector" ? "inspector" : undefined}>
                {profile.initials}
              </span>
              <span className="stack" style={{ gap: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap" }}>{profile.name}</span>
                <span className="mono-label dim" style={{ fontSize: 8.5, whiteSpace: "nowrap" }}>{profile.role}</span>
              </span>
              <span className="dim" style={{ marginLeft: "auto", fontSize: 10 }}>{menuOpen ? "▾" : "▴"}</span>
            </button>
          </div>
        </aside>

        {/* mobile backdrop */}
        {sideOpen ? (
          <div
            onClick={() => setSideOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 54, background: "rgba(20,20,23,0.28)" }}
          />
        ) : null}

        {/* ── content column ── */}
        <div className="content-col">
          {/* header: breadcrumbs + route slug */}
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              borderBottom: "1.5px solid var(--ink-10)",
              background: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <div className="row between" style={{ padding: "11px clamp(18px, 3.5vw, 44px)" }}>
              <div className="row" style={{ gap: 12, minWidth: 0 }}>
                <button
                  className="hamburger"
                  aria-label="Open navigation"
                  onClick={() => setSideOpen(true)}
                  style={{ flexDirection: "column", gap: 4, padding: 4 }}
                >
                  <span style={{ width: 16, height: 2, background: "var(--ink)" }} />
                  <span style={{ width: 16, height: 2, background: "var(--ink)" }} />
                  <span style={{ width: 11, height: 2, background: "var(--orange)" }} />
                </button>
                <nav aria-label="Breadcrumb" className="row" style={{ gap: 0, minWidth: 0 }}>
                  <Link href={groupHome} className="crumb-link">
                    {crumb.group}
                  </Link>
                  <span className="crumb-sep">/</span>
                  <Link
                    href={pathname}
                    className="crumb-link"
                    aria-current="page"
                    style={{ color: "var(--ink)", fontWeight: 600 }}
                  >
                    {crumb.label}
                  </Link>
                </nav>
                <button
                  type="button"
                  className="chip slug-chip"
                  data-tone="info"
                  style={{ fontSize: 9.5 }}
                  title="Copy route"
                  onClick={copyRoute}
                >
                  {pathname}
                </button>
              </div>
              <div className="row" style={{ gap: 10 }}>
                {persona === "inspector" ? (
                  <span className="chip" data-tone="live">
                    <span className="dot" data-pulse /> Read-only
                  </span>
                ) : null}
                <span className="mono-label dim" style={{ fontSize: 10 }}>
                  sim-today {tenant.simToday}
                </span>
              </div>
            </div>
          </header>

          <main className="shell">{children}</main>
        </div>
      </div>
    </>
  );
}
