import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPremium, setIsPremium] = useState(false); // ✅ new state
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");

    if (!fullName || !email || !password || !confirm) {
      setMsg("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("http://localhost:8888/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          is_premium: isPremium, // ✅ send to backend
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Registration failed");

      setMsg("✅ Account created successfully!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-xl font-semibold text-slate-100">
          Create your <span className="text-sky-400">LongevityHub</span> account
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="inp w-full"
            required
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="inp w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="inp w-full"
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="inp w-full"
            required
          />

          {/* ✅ New Premium Checkbox */}
          <label className="flex items-start gap-2 text-slate-300 text-sm">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="mt-1 accent-sky-500"
            />
            <span>
              Subscribe to <span className="text-sky-400 font-semibold">LongevityHub</span> to
              receive exclusive health insights, updates, and unlock{" "}
              <span className="text-emerald-400 font-medium">Premium access for life</span>.
            </span>
          </label>

          {msg && <p className="text-sm text-sky-400">{msg}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2 font-medium transition disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
