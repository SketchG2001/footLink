"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import api from "@/lib/api";
import { useAutoDismiss } from "@/lib/useAutoDismiss";

type Role = "PLAYER" | "AGENT" | "CLUB";

interface ProfileForm {
  name: string;
  // Player
  age: string;
  position: string;
  stats: string;
  // Agent
  agency_name: string;
  license_number: string;
  experience_years: string;
  // Club
  location: string;
  league: string;
  founded_year: string;
}

const EMPTY: ProfileForm = {
  name: "",
  age: "",
  position: "",
  stats: "",
  agency_name: "",
  license_number: "",
  experience_years: "",
  location: "",
  league: "",
  founded_year: "",
};

const INPUT =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [role, setRole] = useState<Role | null>(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });

  useAutoDismiss(message, setMessage);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const init = async () => {
      try {
        const { data: user } = await api.get("/users/me");
        setRole(user.role as Role);
      } catch {
        setMessage({ text: "Failed to load user info", ok: false });
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/profile/me");
        setForm({
          name: data.name ?? "",
          age: data.age?.toString() ?? "",
          position: data.position ?? "",
          stats: data.stats ? JSON.stringify(data.stats, null, 2) : "",
          agency_name: data.agency_name ?? "",
          license_number: data.license_number ?? "",
          experience_years: data.experience_years?.toString() ?? "",
          location: data.location ?? "",
          league: data.league ?? "",
          founded_year: data.founded_year?.toString() ?? "",
        });
        setExists(true);
      } catch (err: any) {
        if (err.response?.status !== 404) {
          setMessage({ text: "Failed to load profile", ok: false });
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const buildPayload = useCallback(() => {
    const base: Record<string, any> = { name: form.name };

    if (role === "PLAYER") {
      base.age = form.age ? Number(form.age) : null;
      base.position = form.position || null;
      if (form.stats.trim()) {
        base.stats = JSON.parse(form.stats);
      } else {
        base.stats = null;
      }
    } else if (role === "AGENT") {
      base.agency_name = form.agency_name || null;
      base.license_number = form.license_number || null;
      base.experience_years = form.experience_years
        ? Number(form.experience_years)
        : null;
    } else if (role === "CLUB") {
      base.location = form.location || null;
      base.league = form.league || null;
      base.founded_year = form.founded_year ? Number(form.founded_year) : null;
    }

    return base;
  }, [form, role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", ok: false });

    if (role === "PLAYER" && form.stats.trim()) {
      try {
        JSON.parse(form.stats);
      } catch {
        setMessage({ text: "Stats must be valid JSON", ok: false });
        setSaving(false);
        return;
      }
    }

    try {
      const payload = buildPayload();
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
        text:
          d?.errors?.[0]?.message || d?.message || d?.detail || "Save failed",
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
      {role && (
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase text-primary">
          {role}
        </span>
      )}

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
        {/* Shared: Name */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={INPUT}
          />
        </div>

        {/* Player fields */}
        {role === "PLAYER" && (
          <>
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
                className={INPUT}
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
                className={INPUT}
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
                className={`${INPUT} font-mono`}
              />
              <p className="mt-1 text-xs text-gray-400">
                Optional. Must be valid JSON if provided.
              </p>
            </div>
          </>
        )}

        {/* Agent fields */}
        {role === "AGENT" && (
          <>
            <div>
              <label htmlFor="agency_name" className="mb-1 block text-sm font-medium text-gray-700">
                Agency Name
              </label>
              <input
                id="agency_name"
                value={form.agency_name}
                onChange={(e) => update("agency_name", e.target.value)}
                placeholder="e.g. ProStar Sports Management"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="license_number" className="mb-1 block text-sm font-medium text-gray-700">
                License Number
              </label>
              <input
                id="license_number"
                value={form.license_number}
                onChange={(e) => update("license_number", e.target.value)}
                placeholder="e.g. FIFA-AG-20250001"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="experience_years" className="mb-1 block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                id="experience_years"
                type="number"
                min={0}
                max={50}
                value={form.experience_years}
                onChange={(e) => update("experience_years", e.target.value)}
                className={INPUT}
              />
            </div>
          </>
        )}

        {/* Club fields */}
        {role === "CLUB" && (
          <>
            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. London, England"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="league" className="mb-1 block text-sm font-medium text-gray-700">
                League
              </label>
              <input
                id="league"
                value={form.league}
                onChange={(e) => update("league", e.target.value)}
                placeholder="e.g. Premier League"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="founded_year" className="mb-1 block text-sm font-medium text-gray-700">
                Founded Year
              </label>
              <input
                id="founded_year"
                type="number"
                min={1800}
                max={2100}
                value={form.founded_year}
                onChange={(e) => update("founded_year", e.target.value)}
                className={INPUT}
              />
            </div>
          </>
        )}

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
