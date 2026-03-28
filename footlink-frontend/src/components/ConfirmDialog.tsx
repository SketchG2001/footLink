"use client";

import { useEffect, useCallback } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  warning: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
  primary: "bg-primary hover:bg-primary-light focus:ring-primary",
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    },
    [onCancel, loading],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${VARIANT_STYLES[variant]}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
