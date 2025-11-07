import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../api";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [msg, setMsg]           = useState("");
  const [busy, setBusy]         = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");

    if (!fullName || !email || !password || !confirm) return setMsg("Please fill in all fields");
    if (password.length < 6) return setMsg("Password must be at least 6 characters");
    if (password !== confirm) return setMsg("Passwords do not match");

    try {
      setBusy(true);
      await apiPost("/register.php", { full_name: fullName, email, password });
      setMsg("✅ Account created. Redirecting to login…");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setMsg(err.message || "Register failed");
    } finally {
      setBusy(false);
    }
  }  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-semibold text-slate-100">
            Create your <span className="text-sky-400">LongevityHub</span> account
          </h1>
          <span className="text-xs text-slate-400 border border-slate-700 px-2 py-0.5 rounded-lg">
            Demo
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Bob Member"
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
              required
            />
          </div>

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

          <div>
            <label className="block text-sm text-slate-400 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
              required
            />
          </div>

          {msg && (
            <p className={`text-sm ${msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"}`}>
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white py-2.5 font-medium transition disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-xs text-slate-400 text-center mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
