"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CalendarIcon, FlameIcon, ListIcon, LogoutIcon } from "@/components/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: CalendarIcon },
  { href: "/planner", label: "Planner", Icon: ListIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-full w-20 flex-col items-center justify-between rounded-4xl bg-gradient-to-b from-brand-500 to-brand-700 py-6 shadow-panel">
      <div className="flex flex-col items-center gap-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70">
          <FlameIcon className="h-5 w-5 text-white" />
        </div>

        <nav className="flex flex-col gap-4">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                  active ? "bg-brand-950 text-white shadow-card" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={logout}
        aria-label="Log out"
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <LogoutIcon className="h-5 w-5" />
      </button>
    </aside>
  );
}
