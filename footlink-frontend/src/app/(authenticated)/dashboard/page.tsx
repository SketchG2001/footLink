"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  role: string;
}

interface QuickLink {
  label: string;
  href: string;
  desc: string;
  roles?: string[];
}

const QUICK_LINKS: QuickLink[] = [
  { label: "My Profile", href: "/profile", desc: "View and edit your profile" },
  { label: "Documents", href: "/documents", desc: "Upload, share, and sign" },
  { label: "Messages", href: "/messages", desc: "Chat with other users" },
  { label: "Player Database", href: "/players", desc: "Search player profiles", roles: ["CLUB", "AGENT"] },
  { label: "My Roster", href: "/agents", desc: "Manage your players", roles: ["AGENT"] },
  { label: "Applications", href: "/applications", desc: "Apply to clubs or review applications", roles: ["PLAYER", "CLUB"] },
  { label: "Settings", href: "/settings", desc: "Update email or password" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.get("/users/me").then(({ data }) => setUser(data)).catch(() => {});
  }, []);

  const visibleLinks = QUICK_LINKS.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      {user ? (
        <p className="mt-1 text-gray-600">
          Welcome back, <span className="font-medium">{user.email}</span>{" "}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {user.role}
          </span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-400">Loading...</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {visibleLinks.map(({ label, href, desc }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{label}</h2>
            <p className="mt-1 text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
