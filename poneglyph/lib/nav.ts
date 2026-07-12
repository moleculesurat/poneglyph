export type NavGroup = "Oversight" | "Compliance" | "Engine" | "Inspection";

export interface NavItem {
  href: string;
  label: string;
  group: NavGroup;
  /** shown to inspector persona too */
  inspector: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", group: "Oversight", inspector: false },
  { href: "/watchtower", label: "Watchtower · Scraper", group: "Oversight", inspector: false },
  { href: "/register", label: "Obligation Register", group: "Compliance", inspector: true },
  { href: "/amendments", label: "Amendments", group: "Compliance", inspector: true },
  { href: "/evidence", label: "Evidence Vault", group: "Compliance", inspector: true },
  { href: "/remediation", label: "Remediation", group: "Compliance", inspector: false },
  { href: "/agents", label: "Agent Console", group: "Engine", inspector: false },
  { href: "/audit", label: "Audit Trail", group: "Engine", inspector: true },
  { href: "/mcp", label: "MCP Surface", group: "Engine", inspector: true },
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
  return { group: "Oversight", label: "Dashboard" };
}
