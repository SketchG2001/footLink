"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface UserOption {
  id: number;
  email: string;
  role: string;
}

interface Props {
  placeholder?: string;
  /** Filter results to a specific role (PLAYER, AGENT, CLUB) */
  roleFilter?: string;
  /** Called when a user is selected */
  onSelect: (user: UserOption) => void;
  /** Reset the input when this value changes */
  resetKey?: number;
  className?: string;
}

export default function UserSearchDropdown({
  placeholder = "Search by email...",
  roleFilter,
  onSelect,
  resetKey,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery("");
    setResults([]);
    setOpen(false);
  }, [resetKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(
    async (term: string) => {
      if (term.length < 1) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const params: Record<string, string> = { q: term };
        if (roleFilter) params.role = roleFilter;
        const { data } = await api.get("/messages/contacts/search", { params });
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [roleFilter],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (user: UserOption) => {
    setQuery(user.email);
    setOpen(false);
    onSelect(user);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        </div>
      )}
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => handleSelect(u)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="truncate font-medium text-gray-900">{u.email}</span>
                <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {u.role}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
