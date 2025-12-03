"use client";

import React, { useEffect, useRef, useState } from "react";

type Message = {
  role: "assistant" | "user";
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Halo! Ada yang bisa saya bantu?" },
  ]);

  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll bottom
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  // Deteksi URL menjadi <a href>
  function formatMessage(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {part}
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    const finalSessionId =
      sessionId ||
      (crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());
    setSessionId((prev) => prev ?? finalSessionId);

    const payload = {
      sessionId: finalSessionId,
      action: "sendMessage",
      chatInput: input.trim(),
    };

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "⚠️ Error: " + text },
        ]);
        return;
      }

      const data = await res.json();
      const botText = data.output || "Tidak ada respons";

      setMessages((prev) => [...prev, { role: "assistant", text: botText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Tidak bisa terhubung ke server." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* CSS langsung di sini */}
      <style>{`
        .chat-wrapper {
          background: #000;
          color: #fff;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .chat-box {
          width: 100%;
          max-width: 700px;
          background: #111;
          border: 1px solid #222;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 16px;
          border-bottom: 1px solid #222;
          font-size: 20px;
          font-weight: bold;
        }

        .chat-container {
          height: 60vh;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-msg {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 14px;
          line-height: 1.4;
        }

        .msg-user {
          margin-left: auto;
          background: #2563eb;
          color: white;
          border-radius: 14px 14px 0 14px;
        }

        .msg-ai {
          margin-right: auto;
          background: #222;
          color: #eee;
          border: 1px solid #333;
          border-radius: 14px 14px 14px 0;
        }

        .chat-footer {
          display: flex;
          border-top: 1px solid #222;
          padding: 16px;
          gap: 8px;
          background: #111;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          font-size: 14px;
          border-radius: 10px;
          border: 1px solid #333;
          background: #000;
          color: white;
        }

        .chat-input:focus {
          outline: none;
          border-color: #2563eb;
        }

        .chat-send {
          background: #fff;
          color: #000;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .chat-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-link {
          color: #60a5fa;
          text-decoration: underline;
          word-break: break-all;
        }
      `}</style>

      <div className="chat-wrapper">
        <div className="chat-box">
          <div className="chat-header">Chat Assistant</div>

          <div ref={containerRef} className="chat-container">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg ${m.role === "user" ? "msg-user" : "msg-ai"}`}
              >
                {formatMessage(m.text)}
              </div>
            ))}

            {loading && (
              <div className="msg-ai" style={{ opacity: 0.6 }}>
                AI sedang mengetik...
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="chat-footer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              className="chat-input"
            />
            <button disabled={loading} type="submit" className="chat-send">
              Kirim
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
