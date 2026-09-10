export type NavGroup = "Oversight" | "Compliance" | "Engine" | "Inspection";

export interface NavItem {
  href: string;
  label: string;
  group: NavGroup;
  /** shown to inspector persona too */
  inspector: boolean;
}

/** The entry gate — full-bleed, no shell chrome. Not a nav destination. */
export const ENTRY_GATE = "/";

/** Where the broker persona lands once past the gate. */
export const BROKER_HOME = "/dashboard";

export const NAV_ITEMS: NavItem[] = [
  { href: BROKER_HOME, label: "Dashboard", group: "Oversight", inspector: false },
  { href: "/onboarding", label: "Entity profile", group: "Oversight", inspector: false },
  { href: "/watchtower", label: "Watchtower · Scraper", group: "Oversight", inspector: false },
  { href: "/register", label: "Obligation Register", group: "Compliance", inspector: true },
  { href: "/documents", label: "Document Vault", group: "Compliance", inspector: true },
  { href: "/amendments", label: "Amendments", group: "Compliance", inspector: true },
  { href: "/evidence", label: "Evidence Vault", group: "Compliance", inspector: true },
  { href: "/remediation", label: "Remediation", group: "Compliance", inspector: false },
  { href: "/live", label: "Live Pipeline", group: "Engine", inspector: false },
  { href: "/agents", label: "Agent Console", group: "Engine", inspector: false },
  { href: "/audit", label: "Audit Trail", group: "Engine", inspector: true },
];

export const INSPECTOR_HOME = "/inspector";

export const INSPECTOR_ITEM: NavItem = {
  href: INSPECTOR_HOME,
  label: "Inspection Session",
  group: "Inspection",
  inspector: true,
};

/** breadcrumb for a pathname: [group, label] */
export function findCrumb(pathname: string): { group: string; label: string } {
  if (pathname === INSPECTOR_HOME) return { group: "Inspection", label: "Session" };
  const item = NAV_ITEMS.find((t) => t.href === pathname);
  if (item) return { group: item.group, label: item.label };
  /* unknown route — fall back to the first nav destination rather than
     assuming anything about what lives at "/" */
  return { group: NAV_ITEMS[0].group, label: NAV_ITEMS[0].label };
}
