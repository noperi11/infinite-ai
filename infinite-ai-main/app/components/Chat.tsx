"use client";

import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Halo! Ada yang bisa saya bantu?" }
  ]);

  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMessage(e: any) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    const finalSessionId = sessionId || crypto.randomUUID();
    if (!sessionId) setSessionId(finalSessionId);

    const payload = {
      sessionId: finalSessionId,
      action: "sendMessage",
      chatInput: input,
    };

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // <-- FIX UTAMA
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `⚠️ Server error (${res.status}): ${errorText}`,
          },
        ]);
        return;
      }

      const data = await res.json();

      const botMessage = {
        role: "assistant",
        text: data.output || "Tidak ada respons",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "⚠️ Tidak bisa terhubung ke server. Coba lagi nanti.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="border rounded-lg p-5 h-[70vh] overflow-y-auto bg-white shadow">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block px-4 py-2 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="mt-2 text-gray-500 italic">AI sedang mengetik...</div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex mt-4">
        <input
          className="flex-grow border p-3 rounded-l-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 rounded-r-lg disabled:opacity-50"
          disabled={loading}
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
