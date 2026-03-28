"use client";

import { useEffect, useState, FormEvent } from "react";
import api from "@/lib/api";

interface ProfileData {
  name: string;
  age: string;
  position: string;
  stats: string;
}

const EMPTY: ProfileData = { name: "", age: "", position: "", stats: "" };

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>(EMPTY);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });

  useEffect(() => {
    api
      .get("/profile/me")
      .then(({ data }) => {
        setForm({
          name: data.name ?? "",
          age: data.age?.toString() ?? "",
          position: data.position ?? "",
          stats: data.stats ? JSON.stringify(data.stats, null, 2) : "",
        });
        setExists(true);
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          setMessage({ text: "Failed to load profile", ok: false });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", ok: false });

    let parsedStats: Record<string, any> | null = null;
    if (form.stats.trim()) {
      try {
        parsedStats = JSON.parse(form.stats);
      } catch {
        setMessage({ text: "Stats must be valid JSON", ok: false });
        setSaving(false);
        return;
      }
    }

    const payload = {
      name: form.name,
      age: form.age ? Number(form.age) : null,
      position: form.position || null,
      stats: parsedStats,
    };

    try {
      if (exists) {
        await api.put("/profile/update", payload);
        setMessage({ text: "Profile updated", ok: true });
      } else {
        await api.post("/profile/me", payload);
        setExists(true);
        setMessage({ text: "Profile created", ok: true });
      }
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({
        text: d?.errors?.[0]?.message || d?.message || d?.detail || "Save failed",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">
        {exists ? "Edit Profile" : "Create Profile"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {exists
          ? "Update your profile information below."
          : "Fill in your details to create a profile."}
      </p>

      {message.text && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            message.ok
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="age" className="mb-1 block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            id="age"
            type="number"
            min={5}
            max={60}
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="position" className="mb-1 block text-sm font-medium text-gray-700">
            Position
          </label>
          <input
            id="position"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            placeholder="e.g. Goalkeeper, Striker, Midfielder"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="stats" className="mb-1 block text-sm font-medium text-gray-700">
            Stats (JSON)
          </label>
          <textarea
            id="stats"
            rows={4}
            value={form.stats}
            onChange={(e) => update("stats", e.target.value)}
            placeholder='e.g. {"goals": 12, "assists": 5, "matches": 30}'
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-gray-400">Optional. Must be valid JSON if provided.</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {saving ? "Saving..." : exists ? "Update Profile" : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
