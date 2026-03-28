"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";

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

interface CurrentUser {
  id: number;
  role: string;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ text: "", ok: false });

  const [clubId, setClubId] = useState("");
  const [appMessage, setAppMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/users/me"), api.get("/applications/")])
      .then(([userRes, appsRes]) => {
        setUser(userRes.data);
        setApps(appsRes.data);
      })
      .catch(() => setFeedback({ text: "Failed to load data", ok: false }))
      .finally(() => setLoading(false));
  }, []);

  const fetchApps = async () => {
    try {
      const { data } = await api.get("/applications/");
      setApps(data);
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
      setAppMessage("");
      await fetchApps();
    } catch (err: any) {
      const d = err.response?.data;
      setFeedback({ text: d?.message || d?.detail || "Failed to apply", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (appId: number, status: "ACCEPTED" | "REJECTED") => {
    setFeedback({ text: "", ok: false });
    try {
      await api.put(`/applications/${appId}`, { status });
      setFeedback({ text: `Application ${status.toLowerCase()}`, ok: true });
      await fetchApps();
    } catch (err: any) {
      const d = err.response?.data;
      setFeedback({ text: d?.message || d?.detail || "Action failed", ok: false });
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
          ? "Review applications from players."
          : "Applications are available for Player and Club roles."}
      </p>

      {/* Player: apply form */}
      {isPlayer && (
        <form onSubmit={handleApply} className="mt-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              placeholder="Club user ID"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Apply"}
            </button>
          </div>
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

      {/* Applications list */}
      {apps.length === 0 ? (
        <p className="mt-6 text-gray-500">No applications yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
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
                            onClick={() => handleReview(a.id, "ACCEPTED")}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReview(a.id, "REJECTED")}
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
    </div>
  );
}
