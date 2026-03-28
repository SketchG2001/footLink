"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import UserSearchDropdown from "@/components/UserSearchDropdown";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAutoDismiss } from "@/lib/useAutoDismiss";

interface Application {
  id: number;
  player_id: number;
  club_id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  created_at: string;
  player_email: string | null;
  club_email: string | null;
}

interface RosterPlayer {
  user_id: number;
  email: string;
  name: string | null;
  age: number | null;
  position: string | null;
  joined_at: string;
}

interface CurrentUser {
  id: number;
  role: string;
}

type ClubTab = "applications" | "roster";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ text: "", ok: false });
  const [clubTab, setClubTab] = useState<ClubTab>("applications");

  const [clubId, setClubId] = useState("");
  const [clubEmail, setClubEmail] = useState("");
  const [appMessage, setAppMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [reviewTarget, setReviewTarget] = useState<{ id: number; status: "ACCEPTED" | "REJECTED"; email: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);

  useAutoDismiss(feedback, setFeedback);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: u } = await api.get("/users/me");
        setUser(u);

        const [appsRes, rosterRes] = await Promise.allSettled([
          api.get("/applications/"),
          u.role === "CLUB" ? api.get("/applications/roster") : Promise.resolve(null),
        ]);

        if (appsRes.status === "fulfilled") setApps(appsRes.value.data);
        if (rosterRes.status === "fulfilled" && rosterRes.value) setRoster(rosterRes.value.data);
      } catch {
        setFeedback({ text: "Failed to load data", ok: false });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchApps = async () => {
    try {
      const { data } = await api.get("/applications/");
      setApps(data);
    } catch {}
  };

  const fetchRoster = async () => {
    try {
      const { data } = await api.get("/applications/roster");
      setRoster(data);
    } catch {}
  };

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    const id = parseInt(clubId, 10);
    if (!id || id <= 0) return;
    setSubmitting(true);
    setFeedback({ text: "", ok: false });

    try {
      await api.post("/applications/", {
        club_id: id,
        message: appMessage || null,
      });
      setFeedback({ text: "Application submitted!", ok: true });
      setClubId("");
      setClubEmail("");
      setAppMessage("");
      setResetKey((k) => k + 1);
      await fetchApps();
    } catch (err: any) {
      const d = err.response?.data;
      setFeedback({ text: d?.message || d?.detail || "Failed to apply", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewConfirmed = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    setFeedback({ text: "", ok: false });
    try {
      await api.put(`/applications/${reviewTarget.id}`, { status: reviewTarget.status });
      setFeedback({ text: `Application ${reviewTarget.status.toLowerCase()}`, ok: true });
      setReviewTarget(null);
      await fetchApps();
      if (reviewTarget.status === "ACCEPTED") await fetchRoster();
    } catch (err: any) {
      const d = err.response?.data;
      setFeedback({ text: d?.message || d?.detail || "Action failed", ok: false });
    } finally {
      setReviewing(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "ACCEPTED") return "bg-green-100 text-green-700";
    if (s === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  if (loading) return <p className="text-gray-500">Loading applications...</p>;

  const isPlayer = user?.role === "PLAYER";
  const isClub = user?.role === "CLUB";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
      <p className="mt-1 text-sm text-gray-500">
        {isPlayer
          ? "Apply to clubs and track your applications."
          : isClub
          ? "Review applications and manage your club roster."
          : "Applications are available for Player and Club roles."}
      </p>

      {/* Player: apply form */}
      {isPlayer && (
        <form onSubmit={handleApply} className="mt-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex gap-2">
            <UserSearchDropdown
              placeholder="Search club by email..."
              roleFilter="CLUB"
              resetKey={resetKey}
              onSelect={(u) => {
                setClubId(String(u.id));
                setClubEmail(u.email);
              }}
              className="flex-1"
            />
            <button
              type="submit"
              disabled={submitting || !clubId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Apply"}
            </button>
          </div>
          {clubEmail && (
            <p className="text-xs text-gray-500">
              Applying to: <span className="font-medium text-gray-700">{clubEmail}</span>
            </p>
          )}
          <textarea
            placeholder="Optional message to the club..."
            value={appMessage}
            onChange={(e) => setAppMessage(e.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>
      )}

      {feedback.text && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            feedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Club tabs: Applications / Roster */}
      {isClub && (
        <div className="mt-6 flex border-b border-gray-200">
          <button
            onClick={() => setClubTab("applications")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              clubTab === "applications"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Applications ({apps.length})
          </button>
          <button
            onClick={() => setClubTab("roster")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              clubTab === "roster"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Club Roster ({roster.length})
          </button>
        </div>
      )}

      {/* Club Roster tab */}
      {isClub && clubTab === "roster" && (
        <>
          {roster.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No players in your club yet</p>
              <p className="text-xs text-gray-400">
                Accept player applications to build your roster. Switch to the Applications tab to review.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {roster.map((p) => (
                    <tr key={p.user_id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.position || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.age ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{p.email}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(p.joined_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Applications list (always visible for player, tab-controlled for club) */}
      {(!isClub || clubTab === "applications") && (
        <>
          {apps.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No applications yet</p>
              <p className="text-xs text-gray-400">
                {isPlayer
                  ? "Search for a club above to submit your first application."
                  : "Applications from players will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">{isClub ? "Player" : "Club"}</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    {isClub && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {isClub ? a.player_email : a.club_email}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                        {a.message || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      {isClub && (
                        <td className="px-4 py-3 text-right space-x-2">
                          {a.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => setReviewTarget({ id: a.id, status: "ACCEPTED", email: a.player_email || "" })}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => setReviewTarget({ id: a.id, status: "REJECTED", email: a.player_email || "" })}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={reviewTarget !== null}
        title={reviewTarget?.status === "ACCEPTED" ? "Accept Application" : "Reject Application"}
        message={
          reviewTarget?.status === "ACCEPTED"
            ? `Accept the application from ${reviewTarget?.email || "this player"}? They will be notified.`
            : `Reject the application from ${reviewTarget?.email || "this player"}? This action cannot be undone.`
        }
        confirmLabel={reviewTarget?.status === "ACCEPTED" ? "Accept" : "Reject"}
        variant={reviewTarget?.status === "ACCEPTED" ? "primary" : "danger"}
        loading={reviewing}
        onConfirm={handleReviewConfirmed}
        onCancel={() => setReviewTarget(null)}
      />
    </div>
  );
}
