"use client";

import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Halo! Ada yang bisa saya bantu?" }
  ]);

  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function sendMessage(e: any) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Generate session ID jika belum ada
    const finalSessionId = sessionId || crypto.randomUUID();
    if (!sessionId) setSessionId(finalSessionId);

    const payload = {
      sessionId: finalSessionId,
      action: "sendMessage",
      chatInput: input,
    };

    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    const botMessage = { role: "assistant", text: data.output };
    setMessages([...newMessages, botMessage]);
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="border rounded-lg p-5 h-[70vh] overflow-y-auto bg-white shadow">
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
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
          className="bg-blue-600 text-white px-6 rounded-r-lg"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
