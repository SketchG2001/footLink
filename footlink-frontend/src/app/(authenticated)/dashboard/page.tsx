"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  role: string;
}

interface Stats {
  documents: number;
  sharedDocs: number;
  conversations: number;
  applications: number;
  pendingApps: number;
  managedPlayers: number;
  hasProfile: boolean;
}

const EMPTY_STATS: Stats = {
  documents: 0,
  sharedDocs: 0,
  conversations: 0,
  applications: 0,
  pendingApps: 0,
  managedPlayers: 0,
  hasProfile: false,
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: u } = await api.get("/users/me");
        setUser(u);

        const fetches: Promise<any>[] = [
          api.get("/profile/me").then(() => true).catch(() => false),
          api.get("/documents/").then((r) => r.data.length).catch(() => 0),
          api.get("/documents/shared").then((r) => r.data.length).catch(() => 0),
          api.get("/messages/contacts/list").then((r) => r.data.length).catch(() => 0),
        ];

        if (u.role === "PLAYER" || u.role === "CLUB") {
          fetches.push(
            api.get("/applications/").then((r) => r.data).catch(() => [])
          );
        }
        if (u.role === "AGENT") {
          fetches.push(
            api.get("/agents/players").then((r) => r.data.length).catch(() => 0)
          );
        }

        const results = await Promise.all(fetches);

        const s: Stats = {
          hasProfile: results[0],
          documents: results[1],
          sharedDocs: results[2],
          conversations: results[3],
          applications: 0,
          pendingApps: 0,
          managedPlayers: 0,
        };

        if ((u.role === "PLAYER" || u.role === "CLUB") && results[4]) {
          const apps = results[4] as any[];
          s.applications = apps.length;
          s.pendingApps = apps.filter((a: any) => a.status === "PENDING").length;
        }
        if (u.role === "AGENT" && results[4] !== undefined) {
          s.managedPlayers = results[4] as number;
        }

        setStats(s);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-72 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = buildStatCards(user?.role || "", stats);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      {user && (
        <p className="mt-1 text-gray-600">
          Welcome back, <span className="font-medium">{user.email}</span>{" "}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {user.role}
          </span>
        </p>
      )}

      {/* Profile completion nudge */}
      {!stats.hasProfile && (
        <Link
          href="/profile"
          className="mt-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200">
            <svg className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-600">
              Your profile is not set up yet. Click here to create it and unlock the full experience.
            </p>
          </div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-gray-200 bg-white p-5 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <span dangerouslySetInnerHTML={{ __html: card.icon }} />
              </span>
              <span className="text-2xl font-bold text-gray-900">{card.value}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">{card.label}</p>
            <p className="text-xs text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="mt-10 text-lg font-semibold text-gray-900">Quick Actions</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {getQuickActions(user?.role || "").map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
              <span dangerouslySetInnerHTML={{ __html: action.icon }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{action.label}</p>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function buildStatCards(role: string, stats: Stats) {
  const cards = [
    {
      label: "My Documents",
      value: stats.documents,
      desc: "Uploaded documents",
      href: "/documents",
      icon: '<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
      iconBg: "bg-blue-50",
    },
    {
      label: "Shared With Me",
      value: stats.sharedDocs,
      desc: "Documents from others",
      href: "/documents",
      icon: '<svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>',
      iconBg: "bg-indigo-50",
    },
    {
      label: "Conversations",
      value: stats.conversations,
      desc: "Active message threads",
      href: "/messages",
      icon: '<svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>',
      iconBg: "bg-green-50",
    },
  ];

  if (role === "PLAYER" || role === "CLUB") {
    cards.push({
      label: "Applications",
      value: stats.pendingApps,
      desc: `${stats.pendingApps} pending of ${stats.applications} total`,
      href: "/applications",
      icon: '<svg class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>',
      iconBg: "bg-amber-50",
    });
  }

  if (role === "AGENT") {
    cards.push({
      label: "Managed Players",
      value: stats.managedPlayers,
      desc: "Players in your roster",
      href: "/agents",
      icon: '<svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>',
      iconBg: "bg-purple-50",
    });
  }

  return cards;
}

function getQuickActions(role: string) {
  const actions = [
    {
      label: "Upload Document",
      desc: "Add a new file",
      href: "/documents",
      icon: '<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>',
      color: "bg-blue-600",
    },
    {
      label: "Send Message",
      desc: "Start a conversation",
      href: "/messages",
      icon: '<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>',
      color: "bg-green-600",
    },
    {
      label: "Edit Profile",
      desc: "Update your details",
      href: "/profile",
      icon: '<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
      color: "bg-primary",
    },
  ];

  if (role === "CLUB" || role === "AGENT") {
    actions.push({
      label: "Search Players",
      desc: "Browse the database",
      href: "/players",
      icon: '<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
      color: "bg-purple-600",
    });
  }

  return actions;
}
