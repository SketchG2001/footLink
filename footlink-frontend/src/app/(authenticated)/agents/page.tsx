"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";

interface ManagedPlayer {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export default function AgentsPage() {
  const [players, setPlayers] = useState<ManagedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", ok: false });
  const [playerId, setPlayerId] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchPlayers = async () => {
    try {
      const { data } = await api.get("/agents/players");
      setPlayers(data);
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Failed to load players", ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const id = parseInt(playerId, 10);
    if (!id || id <= 0) return;
    setAdding(true);
    setMessage({ text: "", ok: false });

    try {
      const { data } = await api.post(`/agents/players/${id}`);
      setMessage({ text: data.message, ok: true });
      setPlayerId("");
      await fetchPlayers();
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Failed to add player", ok: false });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    setMessage({ text: "", ok: false });
    try {
      const { data } = await api.delete(`/agents/players/${id}`);
      setMessage({ text: data.message, ok: true });
      await fetchPlayers();
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Failed to remove player", ok: false });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Managed Players</h1>
      <p className="mt-1 text-sm text-gray-500">
        View and manage the players in your roster. Agent role required.
      </p>

      {/* Add player */}
      <form onSubmit={handleAdd} className="mt-6 flex gap-2">
        <input
          type="number"
          min={1}
          placeholder="Player user ID"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Player"}
        </button>
      </form>

      {message.text && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-gray-500">Loading roster...</p>
      ) : players.length === 0 ? (
        <p className="mt-6 text-gray-500">No players in your roster yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {players.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-600">{p.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
