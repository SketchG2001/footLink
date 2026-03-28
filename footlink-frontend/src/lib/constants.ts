export interface NavItem {
  label: string;
  href: string;
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/profile" },
  { label: "Documents", href: "/documents" },
  { label: "Messages", href: "/messages" },
  { label: "Players", href: "/players", roles: ["CLUB", "AGENT"] },
  { label: "My Roster", href: "/agents", roles: ["AGENT"] },
  { label: "Applications", href: "/applications", roles: ["PLAYER", "CLUB"] },
];
