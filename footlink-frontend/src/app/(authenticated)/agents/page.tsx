"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";
import UserSearchDropdown from "@/components/UserSearchDropdown";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAutoDismiss } from "@/lib/useAutoDismiss";

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
  const [resetKey, setResetKey] = useState(0);
  const [removeTarget, setRemoveTarget] = useState<ManagedPlayer | null>(null);
  const [removing, setRemoving] = useState(false);

  useAutoDismiss(message, setMessage);

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
      setResetKey((k) => k + 1);
      await fetchPlayers();
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Failed to add player", ok: false });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveConfirmed = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setMessage({ text: "", ok: false });
    try {
      const { data } = await api.delete(`/agents/players/${removeTarget.id}`);
      setMessage({ text: data.message, ok: true });
      setRemoveTarget(null);
      await fetchPlayers();
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Failed to remove player", ok: false });
    } finally {
      setRemoving(false);
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
        <UserSearchDropdown
          placeholder="Search player by email..."
          roleFilter="PLAYER"
          resetKey={resetKey}
          onSelect={(u) => setPlayerId(String(u.id))}
          className="flex-1"
        />
        <button
          type="submit"
          disabled={adding || !playerId}
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
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">No players in your roster</p>
          <p className="text-xs text-gray-400">Search for a player above to add them to your roster.</p>
        </div>
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
                      onClick={() => setRemoveTarget(p)}
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

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remove Player"
        message={`Are you sure you want to remove ${removeTarget?.email || "this player"} from your roster? You can add them back later.`}
        confirmLabel="Remove"
        variant="danger"
        loading={removing}
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
