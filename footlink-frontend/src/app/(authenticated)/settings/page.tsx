"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";

interface UserData {
  id: number;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });

  useEffect(() => {
    api
      .get("/users/me")
      .then(({ data }) => {
        setUser(data);
        setEmail(data.email);
      })
      .catch(() => setMessage({ text: "Failed to load account", ok: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", ok: false });

    const payload: Record<string, string> = {};
    if (email && email !== user?.email) payload.email = email;
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setMessage({ text: "No changes to save", ok: false });
      setSaving(false);
      return;
    }

    try {
      const { data } = await api.put("/users/me", payload);
      setUser(data);
      setEmail(data.email);
      setPassword("");
      setMessage({ text: "Account updated successfully", ok: true });
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({
        text: d?.errors?.[0]?.message || d?.message || d?.detail || "Update failed",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Update your email or password.</p>

      {message.text && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {user?.role}
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
