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

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => setRole(data.role))
      .catch(() => {});
  }, []);

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

        <button
          onClick={handleLogout}
          className="rounded-md bg-primary-dark px-4 py-2 text-sm font-medium transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
