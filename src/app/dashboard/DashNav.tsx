"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/contract";

const LINKS: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/bills", label: "Bills", roles: ["owner", "manager", "cashier", "waiter"] },
  { href: "/dashboard/reports", label: "Reports", roles: ["owner", "manager"] },
  { href: "/dashboard/menu", label: "Menu", roles: ["owner", "manager"] },
  { href: "/dashboard/tables", label: "Tables & QR", roles: ["owner", "manager"] },
  { href: "/dashboard/staff", label: "Staff", roles: ["owner", "manager"] },
  { href: "/dashboard/settings", label: "Settings", roles: ["owner", "manager"] },
];

export function DashNav({ role }: { role: Role }) {
  const path = usePathname();
  return (
    <nav className="dash-nav" aria-label="Dashboard">
      {LINKS.filter((l) => !l.roles || l.roles.includes(role)).map((l) => (
        <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
