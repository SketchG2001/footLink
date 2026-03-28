"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import api from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => setRole(data.role))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          FootLink
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {visibleItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-primary-dark text-white"
                  : "text-green-100 hover:bg-primary-light hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden rounded-md bg-primary-dark px-4 py-2 text-sm font-medium transition-colors hover:bg-red-700 md:block"
          >
            Logout
          </button>

          {/* Hamburger button */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-primary-light md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="border-t border-primary-light px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1">
            {visibleItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-primary-dark text-white"
                    : "text-green-100 hover:bg-primary-light hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md bg-primary-dark px-4 py-2 text-sm font-medium transition-colors hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
