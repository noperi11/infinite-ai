"use client";

import React, { useEffect, useRef, useState } from "react";

type Message = {
  role: "assistant" | "user";
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Halo! Saya asisten AI Anda. Ada yang bisa saya bantu hari ini?" },
  ]);

  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll bottom
  useEffect(() => {
    if (!containerRef.current) return;
    const scrollOptions: ScrollIntoViewOptions = { behavior: "smooth" };
    // Sedikit delay agar animasi render selesai sebelum scroll
    setTimeout(() => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, [messages, loading]);

  // Format URL
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
        headers: { "Content-Type": "application/json" },
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
      <style>{`
        /* Reset & Base */
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }

        /* Main Layout */
        .app-container {
          background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
          color: #e4e4e7;
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative;
        }

        /* Decorative Background Glow */
        .glow-effect {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%);
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 0;
          pointer-events: none;
        }

        /* Chat Layout Wrapper */
        .chat-layout {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 1000px; /* Lebar maksimum agar nyaman dibaca di layar lebar */
          width: 100%;
          margin: 0 auto;
          background: rgba(20, 20, 20, 0.4);
          border-left: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
        }

        /* Header */
        .chat-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(10, 10, 10, 0.6);
          backdrop-filter: blur(10px);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
        }
        
        .header-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.5px;
          color: #fff;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        /* Message Area */
        .chat-container {
          flex: 1;
          overflow-y: auto;
          padding: 90px 20px 100px 20px; /* Padding atas/bawah untuk header/footer */
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Scrollbar Styling */
        .chat-container::-webkit-scrollbar {
          width: 6px;
        }
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .chat-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Messages */
        .chat-row {
          display: flex;
          width: 100%;
          animation: slideIn 0.3s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        @keyframes slideIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-row.user { justify-content: flex-end; }
        .chat-row.assistant { justify-content: flex-start; }

        .chat-bubble {
          max-width: 80%;
          padding: 14px 20px;
          font-size: 15px;
          line-height: 1.6;
          border-radius: 18px;
          position: relative;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .chat-row.user .chat-bubble {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chat-row.assistant .chat-bubble {
          background: #27272a;
          color: #ececec;
          border: 1px solid rgba(255,255,255,0.05);
          border-bottom-left-radius: 4px;
        }

        .chat-link {
          color: #60a5fa;
          text-decoration: none;
          border-bottom: 1px dotted #60a5fa;
          transition: all 0.2s;
        }
        .chat-link:hover {
          color: #93c5fd;
          border-bottom: 1px solid #93c5fd;
        }

        /* Loading Dots */
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: #a1a1aa;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Footer / Input Area */
        .chat-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          background: rgba(10, 10, 10, 0.6);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.08);
          z-index: 10;
        }

        .input-group {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #18181b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 6px 6px 6px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-group:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 15px;
          padding: 10px 0;
          outline: none;
        }
        .chat-input::placeholder { color: #71717a; }

        .send-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .send-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        .send-btn:active:not(:disabled) {
          transform: scale(0.96);
        }
        .send-btn:disabled {
          background: #3f3f46;
          color: #71717a;
          cursor: not-allowed;
        }

      `}</style>

      <div className="app-container">
        <div className="glow-effect" />
        
        <div className="chat-layout">
          {/* Header */}
          <header className="chat-header">
            <div className="status-dot"></div>
            <div className="header-title">AI Assistant</div>
          </header>

          {/* Chat Messages */}
          <div ref={containerRef} className="chat-container">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-row ${m.role === "user" ? "user" : "assistant"}`}
              >
                <div className="chat-bubble">
                  {formatMessage(m.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-row assistant">
                <div className="chat-bubble" style={{ minWidth: "60px" }}>
                  <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form onSubmit={sendMessage} className="chat-footer">
            <div className="input-group">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan Anda..."
                className="chat-input"
                disabled={loading}
              />
              <button disabled={loading || !input.trim()} type="submit" className="send-btn">
                Kirim
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
