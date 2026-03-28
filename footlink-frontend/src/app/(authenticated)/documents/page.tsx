"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import UserSearchDropdown from "@/components/UserSearchDropdown";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAutoDismiss } from "@/lib/useAutoDismiss";

interface Document {
  id: number;
  owner_id: number;
  original_filename: string;
  file_url: string;
  status: "UPLOADED" | "SIGNED";
  created_at: string;
}

type Tab = "mine" | "shared";

function fileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<Tab>("mine");
  const [myDocs, setMyDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });
  const fileRef = useRef<HTMLInputElement>(null);

  const [shareDocId, setShareDocId] = useState<number | null>(null);
  const [shareUserId, setShareUserId] = useState("");
  const [sharing, setSharing] = useState(false);

  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [signDocId, setSignDocId] = useState<number | null>(null);
  const [signing, setSigning] = useState(false);

  useAutoDismiss(message, setMessage);

  const fetchDocs = async () => {
    try {
      const [mine, shared] = await Promise.all([
        api.get("/documents/"),
        api.get("/documents/shared"),
      ]);
      setMyDocs(mine.data);
      setSharedDocs(shared.data);
    } catch {
      setMessage({ text: "Failed to load documents", ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage({ text: "", ok: false });

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fileRef.current!.value = "";
      setMessage({ text: "Document uploaded", ok: true });
      await fetchDocs();
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Upload failed", ok: false });
    } finally {
      setUploading(false);
    }
  };

  const handleSignConfirmed = async () => {
    if (!signDocId) return;
    setSigning(true);
    setMessage({ text: "", ok: false });
    try {
      await api.post(`/documents/${signDocId}/sign`);
      setMessage({ text: "Document signed successfully", ok: true });
      setSignDocId(null);
      await fetchDocs();
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Signing failed", ok: false });
    } finally {
      setSigning(false);
    }
  };

  const handleShare = async () => {
    if (!shareDocId || !shareUserId) return;
    setSharing(true);
    setMessage({ text: "", ok: false });
    try {
      await api.post(`/documents/${shareDocId}/share`, {
        shared_with_user_id: parseInt(shareUserId, 10),
      });
      setMessage({ text: "Document shared successfully", ok: true });
      setShareDocId(null);
      setShareUserId("");
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Sharing failed", ok: false });
    } finally {
      setSharing(false);
    }
  };

  const handleView = async (doc: Document) => {
    setViewDoc(doc);
    setViewLoading(true);
    setViewUrl(null);

    try {
      const response = await api.get(`/documents/${doc.id}/view`, {
        responseType: "blob",
      });
      const blob = response.data as Blob;
      const url = URL.createObjectURL(blob);
      setViewUrl(url);
    } catch (err: any) {
      const d = err.response?.data;
      setMessage({ text: d?.message || d?.detail || "Failed to load document", ok: false });
      setViewDoc(null);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewer = useCallback(() => {
    if (viewUrl) URL.revokeObjectURL(viewUrl);
    setViewDoc(null);
    setViewUrl(null);
  }, [viewUrl]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewDoc) closeViewer();
        else if (shareDocId !== null) {
          setShareDocId(null);
          setShareUserId("");
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [viewDoc, shareDocId, closeViewer]);

  const handleDownload = () => {
    if (!viewUrl || !viewDoc) return;
    const a = document.createElement("a");
    a.href = viewUrl;
    a.download = viewDoc.original_filename;
    a.click();
  };

  const docs = tab === "mine" ? myDocs : sharedDocs;
  const isSharedTab = tab === "shared";

  const renderViewer = () => {
    if (!viewDoc) return null;
    const ext = fileExt(viewDoc.original_filename);
    const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
    const isPdf = ext === "pdf";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {viewDoc.original_filename}
              </h2>
              <p className="text-xs text-gray-400">
                {viewDoc.status} &middot; {new Date(viewDoc.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              {viewUrl && (
                <button
                  onClick={handleDownload}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download
                </button>
              )}
              <button
                onClick={closeViewer}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4">
            {viewLoading ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-gray-400">Loading document...</p>
              </div>
            ) : !viewUrl ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-red-500">Failed to load document.</p>
              </div>
            ) : isImage ? (
              <img
                src={viewUrl}
                alt={viewDoc.original_filename}
                className="mx-auto max-h-[70vh] rounded-lg object-contain"
              />
            ) : isPdf ? (
              <iframe
                src={viewUrl}
                title={viewDoc.original_filename}
                className="h-[70vh] w-full rounded-lg border"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-full bg-gray-100 p-4">
                  <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  This file type (<span className="font-medium">.{ext}</span>) cannot be previewed in the browser.
                </p>
                <button
                  onClick={handleDownload}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                >
                  Download File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Documents</h1>

      {/* Upload (only on My Documents tab) */}
      {!isSharedTab && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="flex-1 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-light"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex border-b border-gray-200">
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "mine"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Documents ({myDocs.length})
        </button>
        <button
          onClick={() => setTab("shared")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "shared"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Shared With Me ({sharedDocs.length})
        </button>
      </div>

      {message.text && (
        <div
          className={`mt-4 rounded-md p-3 text-sm ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Share Modal */}
      {shareDocId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Share Document</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search for a user by email to share this document.
            </p>
            <div className="mt-4">
              <UserSearchDropdown
                placeholder="Search user by email..."
                resetKey={shareDocId}
                onSelect={(user) => setShareUserId(String(user.id))}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShareDocId(null);
                  setShareUserId("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={sharing || !shareUserId}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Confirmation */}
      <ConfirmDialog
        open={signDocId !== null}
        title="Sign Document"
        message="This action will apply your electronic signature to this document. This is a legally binding action and cannot be undone. Do you want to proceed?"
        confirmLabel="Sign Document"
        variant="warning"
        loading={signing}
        onConfirm={handleSignConfirmed}
        onCancel={() => setSignDocId(null)}
      />

      {/* Document Viewer Modal */}
      {renderViewer()}

      {/* Document List */}
      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            {isSharedTab ? "No shared documents yet" : "No documents yet"}
          </p>
          <p className="text-xs text-gray-400">
            {isSharedTab
              ? "Documents shared with you by other users will appear here."
              : "Upload your first document using the form above."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td
                    className="cursor-pointer px-4 py-3 font-medium text-primary hover:underline"
                    onClick={() => handleView(doc)}
                  >
                    {doc.original_filename}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        doc.status === "SIGNED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleView(doc)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      View
                    </button>
                    {!isSharedTab && (
                      <button
                        onClick={() => setShareDocId(doc.id)}
                        className="rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        Share
                      </button>
                    )}
                    {doc.status === "UPLOADED" && (
                      <button
                        onClick={() => setSignDocId(doc.id)}
                        className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-gray-900 transition-colors hover:bg-accent-light"
                      >
                        Sign
                      </button>
                    )}
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
