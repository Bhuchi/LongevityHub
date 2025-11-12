// frontend/src/components/Chatbot.jsx
import { useState } from "react";

// Read either key: lh_user (your newer code) or user (older code)
function getUserSafe() {
  try {
    return (
      JSON.parse(localStorage.getItem("lh_user")) ||
      JSON.parse(localStorage.getItem("user")) ||
      null
    );
  } catch {
    return null;
  }
}

const API_URL = "http://localhost:8888/api/chat.php"; // adjust if needed

export default function Chatbot() {
  const user = getUserSafe();
  const canChat = ["premium", "admin"].includes(
    (user?.role || "").toLowerCase()
  );

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    e.preventDefault();
    if (!canChat) return;               // block sending if not premium
    if (!input.trim()) return;

    const next = [...messages, { role: "user", text: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || res.statusText);
      }
      setMessages([
        ...next,
        { role: "assistant", text: data.reply || "(no reply)" },
      ]);
    } catch (err) {
      setMessages([...next, { role: "assistant", text: "⚠️ " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 💬 Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#38bdf8",
          color: "#fff",
          fontSize: 28,
          border: 0,
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,.35)",
        }}
        aria-label="Toggle chatbot"
        title={canChat ? "Open chatbot" : "Chatbot (Premium only)"}
      >
        💬
      </button>

      {/* 🪟 Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 24,
            width: 360,
            background: "#fff",
            borderRadius: 12,
            padding: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,.3)",
            zIndex: 9999,
          }}
        >
          <h3 style={{ margin: 8, fontWeight: 600 }}>LongevityHub Chatbot</h3>

          {/* Info bar if not premium */}
          {!canChat && (
            <div
              style={{
                margin: "8px 0",
                padding: "8px 10px",
                borderRadius: 8,
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: 13,
                border: "1px solid #e2e8f0",
              }}
            >
              🔒 Chat is available for <strong>Admin</strong> or{" "}
              <strong>Premium</strong> members. You can still preview past
              messages below.
            </div>
          )}

          <div
            style={{
              height: 260,
              overflowY: "auto",
              background: "#fafafa",
              border: "1px solid #eee",
              padding: 8,
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: "#888" }}>
                {canChat
                  ? "Say hi! Ask about your workouts, meals or sleep."
                  : "Only Admin or Premium members can start chatting."}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  textAlign: m.role === "user" ? "right" : "left",
                  marginBottom: 6,
                }}
              >
                <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.text}
              </div>
            ))}
            {loading && <div style={{ color: "#888" }}>Typing…</div>}
          </div>

          <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={canChat ? "Type message…" : "Premium required"}
              disabled={!canChat || loading}
              style={{
                flex: 1,
                padding: 8,
                border: "1px solid #ddd",
                borderRadius: 6,
                background: !canChat ? "#f1f5f9" : "#fff",
                color: !canChat ? "#64748b" : "#0f172a",
              }}
            />
            <button
              type="submit"
              disabled={!canChat || loading}
              style={{
                padding: "8px 14px",
                background: canChat ? "#38bdf8" : "#94a3b8",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                cursor: canChat ? "pointer" : "not-allowed",
              }}
              title={canChat ? "Send" : "Premium only"}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
