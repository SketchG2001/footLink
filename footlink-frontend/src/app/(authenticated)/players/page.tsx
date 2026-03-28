"use client";

import { useState, FormEvent } from "react";
import api from "@/lib/api";

interface PlayerProfile {
  id: number;
  user_id: number;
  name: string;
  age: number | null;
  position: string | null;
  owner_email: string | null;
  owner_role: string | null;
}

interface ProfileDetail {
  id: number;
  user_id: number;
  name: string;
  age: number | null;
  position: string | null;
  stats: Record<string, any> | null;
  created_at: string;
  owner_email: string | null;
  owner_role: string | null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const [viewProfile, setViewProfile] = useState<ProfileDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);

    const params = new URLSearchParams();
    if (name) params.append("name", name);
    if (position) params.append("position", position);
    if (minAge) params.append("min_age", minAge);
    if (maxAge) params.append("max_age", maxAge);

    try {
      const { data } = await api.get(`/players/?${params.toString()}`);
      setPlayers(data);
    } catch (err: any) {
      const d = err.response?.data;
      setError(d?.message || d?.detail || "Failed to search players");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (profileId: number) => {
    setViewLoading(true);
    try {
      const { data } = await api.get(`/profile/${profileId}`);
      setViewProfile(data);
    } catch (err: any) {
      const d = err.response?.data;
      setError(d?.message || d?.detail || "Failed to load profile");
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Player Database</h1>
      <p className="mt-1 text-sm text-gray-500">
        Search and browse player profiles. Available for Club and Agent users.
      </p>

      <form onSubmit={handleSearch} className="mt-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-5">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          placeholder="Position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Min age"
          min={5}
          max={60}
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Max age"
          min={5}
          max={60}
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Profile Detail Modal */}
      {(viewProfile || viewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            {viewLoading ? (
              <p className="text-sm text-gray-400">Loading profile...</p>
            ) : viewProfile ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900">{viewProfile.name}</h2>
                <p className="text-sm text-gray-500">{viewProfile.owner_email}</p>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Position</dt>
                    <dd className="font-medium text-gray-900">{viewProfile.position || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Age</dt>
                    <dd className="font-medium text-gray-900">{viewProfile.age ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Member since</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(viewProfile.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                {viewProfile.stats && Object.keys(viewProfile.stats).length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Stats</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(viewProfile.stats).map(([key, val]) => (
                        <div key={key} className="rounded-md bg-gray-50 px-3 py-2">
                          <p className="text-xs text-gray-500">{key}</p>
                          <p className="font-semibold text-gray-900">{String(val)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}

            <button
              onClick={() => setViewProfile(null)}
              className="mt-5 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {searched && !loading && (
        <div className="mt-6">
          {players.length === 0 ? (
            <p className="text-gray-500">No players found matching your criteria.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {players.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.position || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{p.age ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{p.owner_email || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewProfile(p.id)}
                          className="rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
