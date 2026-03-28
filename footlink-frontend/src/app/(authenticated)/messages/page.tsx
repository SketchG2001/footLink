"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import api from "@/lib/api";

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_email: string | null;
  receiver_email: string | null;
}

interface Contact {
  id: number;
  email: string;
  role: string;
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = useRef<number | null>(null);

  useEffect(() => {
    api.get("/users/me").then(({ data }) => {
      currentUserId.current = data.id;
    });
    api.get("/messages/contacts/list").then(({ data }) => setContacts(data)).catch(() => {});
  }, []);

  const loadConversation = async (contact: Contact) => {
    setActiveChat(contact);
    setLoading(true);
    setError("");
    setMessages([]);
    setSearchResults([]);
    setSearchQuery("");

    try {
      const { data } = await api.get(`/messages/${contact.id}`);
      setMessages(data);
    } catch (err: any) {
      const d = err.response?.data;
      setError(d?.message || d?.detail || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/messages/contacts/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    setError("");

    try {
      const { data } = await api.post("/messages/send", {
        receiver_id: activeChat.id,
        content: newMsg.trim(),
      });
      setMessages((prev) => [...prev, data]);
      setNewMsg("");

      if (!contacts.find((c) => c.id === activeChat.id)) {
        setContacts((prev) => [...prev, activeChat]);
      }
    } catch (err: any) {
      const d = err.response?.data;
      setError(d?.message || d?.detail || "Failed to send message");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="mx-auto flex max-w-4xl gap-4" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Sidebar */}
      <div className="flex w-72 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white">
        <div className="border-b p-3">
          <input
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchQuery && searchResults.length > 0 && (
            <div className="border-b">
              <p className="px-3 pt-2 text-xs font-semibold uppercase text-gray-400">Search results</p>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => loadConversation(u)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                    activeChat?.id === u.id ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  <p className="truncate text-gray-900">{u.email}</p>
                  <p className="text-xs text-gray-400">{u.role}</p>
                </button>
              ))}
            </div>
          )}

          {contacts.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-xs font-semibold uppercase text-gray-400">Conversations</p>
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadConversation(c)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                    activeChat?.id === c.id ? "bg-primary/5 font-medium" : ""
                  }`}
                >
                  <p className="truncate text-gray-900">{c.email}</p>
                  <p className="text-xs text-gray-400">{c.role}</p>
                </button>
              ))}
            </div>
          )}

          {contacts.length === 0 && !searchQuery && (
            <p className="p-3 text-center text-sm text-gray-400">
              No conversations yet. Search for a user to start chatting.
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
        {activeChat ? (
          <>
            <div className="border-b bg-gray-50 px-4 py-3">
              <p className="font-medium text-gray-900">{activeChat.email}</p>
              <p className="text-xs text-gray-400">{activeChat.role}</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId.current;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          isMine ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? "text-green-200" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <div className="mx-4 mb-2 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={sendMessage} className="flex gap-2 border-t bg-gray-50 px-4 py-3">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newMsg.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400">Select a conversation or search for a user to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
