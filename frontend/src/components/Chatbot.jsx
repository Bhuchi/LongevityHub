// frontend/src/components/Chatbot.jsx
import { useEffect, useState } from "react";
import { apiPost } from "../api";

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
      const data = await apiPost("/chat.php", { message: input });
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

  const primarySky = "#38bdf8";
  const slateBg = "#020617";
  const panelBg = "rgba(15,23,42,0.95)";

  useEffect(() => {
    const onAuthChange = () => {
      setMessages([]);
      setInput("");
      setOpen(false);
    };
    window.addEventListener("lh:auth-changed", onAuthChange);
    window.addEventListener("storage", onAuthChange);
    return () => {
      window.removeEventListener("lh:auth-changed", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: "999px",
          background: primarySky,
          color: "#0f172a",
          fontSize: 26,
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "pointer",
          zIndex: 60,
          boxShadow: "0 10px 30px rgba(56,189,248,0.4)",
        }}
        aria-label="Open chatbot"
        title={canChat ? "LongevityHub Coach" : "Premium only"}
      >
        💬
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.75)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 80,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              height: "min(80vh, 640px)",
              background: panelBg,
              borderRadius: 24,
              border: "1px solid rgba(148,163,184,0.2)",
              boxShadow: "0 20px 60px rgba(15,23,42,0.7)",
              display: "flex",
              flexDirection: "column",
              color: "#e2e8f0",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <header
              style={{
                padding: "20px 28px",
                borderBottom: "1px solid rgba(148,163,184,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>
                  LongevityHub Coach
                </p>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  Ask about workouts, meals, sleep or goals
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chatbot"
                style={{
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "transparent",
                  color: "#e2e8f0",
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </header>

            {!canChat && (
              <div
                style={{
                  margin: "16px 28px 0",
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: "rgba(15,23,42,0.6)",
                  border: "1px dashed rgba(248,250,252,0.15)",
                  color: "#f8fafc",
                  fontSize: 14,
                }}
              >
                🔒 Only Premium or Admin members can start new chats. Upgrade to
                unlock the AI coach experience.
              </div>
            )}

            <div
              style={{
                flex: 1,
                margin: "20px 28px",
                marginBottom: 16,
                padding: "18px 20px",
                borderRadius: 16,
                background: "rgba(2,6,23,0.75)",
                border: "1px solid rgba(51,65,85,0.7)",
                overflowY: "auto",
              }}
            >
              {messages.length === 0 && (
                <div style={{ color: "#94a3b8", fontSize: 14 }}>
                  {canChat
                    ? "Hi! I can summarize your progress, set goals, or suggest workouts."
                    : "Sign in with a Premium plan to chat with the coach."}
                </div>
              )}
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                const bubbleBg = isUser
                  ? primarySky
                  : "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(59,130,246,0.08))";
                const bubbleColor = isUser ? "#0f172a" : "#e0f2fe";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        background: bubbleBg,
                        color: bubbleColor,
                        padding: "10px 14px",
                        borderRadius: 16,
                        borderTopRightRadius: isUser ? 4 : 16,
                        borderTopLeftRadius: isUser ? 16 : 4,
                        fontSize: 14,
                        lineHeight: 1.5,
                        boxShadow: "0 6px 18px rgba(2,6,23,0.35)",
                      }}
                    >
                      {m.text.split(/\n{2,}/).map((para, idx) => (
                        <p
                          key={idx}
                          style={{
                            margin: idx === 0 ? "0 0 6px" : "10px 0 0",
                            whiteSpace: "pre-wrap",
                            background: isUser
                              ? "transparent"
                              : "rgba(15,23,42,0.35)",
                            borderRadius: 10,
                            padding: isUser ? 0 : "6px 8px",
                          }}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>Typing…</div>
              )}
            </div>

            <form
              onSubmit={sendMessage}
              style={{
                display: "flex",
                gap: 12,
                padding: "0 28px 26px",
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  canChat ? "Ask anything about your longevity plan…" : "Premium required"
                }
                disabled={!canChat || loading}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "rgba(15,23,42,0.6)",
                  color: "#f8fafc",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!canChat || loading}
                style={{
                  padding: "0 24px",
                  borderRadius: 16,
                  border: "none",
                  background: canChat ? primarySky : "rgba(148,163,184,0.4)",
                  color: canChat ? "#0f172a" : "#1e293b",
                  fontWeight: 600,
                  cursor: canChat ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={canChat ? "Send" : "Premium only"}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
