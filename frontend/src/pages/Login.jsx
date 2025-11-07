import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../api";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]           = useState("");
  const [busy, setBusy]         = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");

    try {
      setBusy(true);
      const data = await apiPost("/login.php", { email, password });
      // persist user client-side
      localStorage.setItem("lh_user", JSON.stringify(data.user));
      setMsg("✅ Logged in");
      navigate("/"); // or wherever
    } catch (err) {
      setMsg(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">
              Sign in to <span className="text-sky-400">LongevityHub</span>
            </h1>
          </div>
          <span className="text-xs text-slate-400 border border-slate-700 px-2 py-0.5 rounded-lg">
            Live
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bob@example.com"
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
              required
            />
          </div>

          {msg && (
            <p
              className={`text-sm ${msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"
                }`}
            >
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white py-2.5 font-medium transition disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-xs text-slate-400 text-center mt-4 space-y-2">
          <p>
            No account?{" "}
            <Link to="/register" className="text-sky-400 hover:underline">
              Go to Register
            </Link>
          </p>
          <p className="text-slate-500">
            Tip: In demo mode, any non-empty credentials will show a success
            message so you can preview.
          </p>
        </div>
      </div>
    </div>
  );
}
