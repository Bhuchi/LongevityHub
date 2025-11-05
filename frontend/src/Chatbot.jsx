import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // ✅ ตรวจว่า port backend ตรงกับ MAMP หรือไม่ (เช่น 8888)
  const API_URL = "http://localhost:8888/api/chat.php";

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", text: "⚠️ เชื่อมต่อไม่ได้: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 💬 ปุ่มกลมมุมขวาล่าง */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#38bdf8",
          color: "white",
          fontSize: "28px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
      >
        💬
      </button>

      {/* 🧠 กล่องแชท */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            right: "24px",
            width: "350px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            padding: "1rem",
            zIndex: 1000,
            fontFamily: "sans-serif",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>LongevityHub Chatbot</h3>
          <div
            style={{
              height: "250px",
              overflowY: "auto",
              border: "1px solid #ddd",
              padding: "0.5rem",
              marginBottom: "0.5rem",
              background: "#fafafa",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  textAlign: m.role === "user" ? "right" : "left",
                  marginBottom: "6px",
                }}
              >
                <strong>{m.role === "user" ? "คุณ" : "บอท"}:</strong> {m.text}
              </div>
            ))}
            {loading && <div style={{ color: "#888" }}>บอทกำลังพิมพ์...</div>}
          </div>
          <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="พิมพ์ข้อความ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: "8px" }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#38bdf8",
                color: "white",
                border: "none",
                borderRadius: "6px",
              }}
            >
              ส่ง
            </button>
          </form>
        </div>
      )}
    </>
  );
}
