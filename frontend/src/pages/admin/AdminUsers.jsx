import React, { useEffect, useMemo, useState } from "react";
import { Users, ArrowLeft, Plus, Search, Trash2, Shield, RefreshCw } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../../api";

/* UI helpers */
const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ variant = "solid", size = "md", className = "", children, ...props }) => {
  const base = "rounded-xl font-semibold transition inline-flex items-center justify-center gap-2";
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
  };
  const variants = {
    solid: "bg-sky-600 hover:bg-sky-500 text-white",
    ghost: "bg-slate-800/60 hover:bg-slate-800 text-slate-100 border border-slate-700",
    subtle: "bg-slate-900/60 hover:bg-slate-800/70 text-slate-200 border border-slate-700",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const RolePill = ({ role }) => {
  const map = {
    admin: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    premium: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    member: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border capitalize ${map[role] || "bg-slate-700/30 text-slate-300 border-slate-600/40"}`}>
      {role || "member"}
    </span>
  );
};

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "member",
    password: "",
    tz: "Asia/Bangkok",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setStatus("");
    try {
      const data = await apiGet("/controllers/admin_users.php");
      const normalized = (data.users || []).map((u) => ({
        id: Number(u.user_id),
        name: u.full_name || "(no name)",
        email: u.email || "",
        role: u.role || "member",
        joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
      }));
      setUsers(normalized);
    } catch (err) {
      setStatus(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s)
    );
  }, [users, q]);

  async function handleCreate(e) {
    e.preventDefault();
    setStatus("");
    try {
      await apiPost("/controllers/admin_users.php", form);
      setForm({ full_name: "", email: "", role: "member", password: "", tz: form.tz });
      await loadUsers();
      setStatus("✅ User created");
    } catch (err) {
      setStatus(err.message || "Create failed");
    }
  }

  async function removeUser(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await apiDelete(`/controllers/admin_users.php?user_id=${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-600/15 border border-sky-700/40 grid place-items-center">
                <Users className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin — Users</h1>
                <p className="text-slate-400 text-sm">Manage user accounts and roles</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Page
              </Button>
              <Button variant="ghost" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Create form */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-sky-400" />
              <div>
                <div className="font-semibold">Create user</div>
                <div className="text-xs text-slate-400">Creates a new account with the selected role.</div>
              </div>
            </div>
            <form className="grid gap-3 md:grid-cols-5" onSubmit={handleCreate}>
              <input
                className="inp"
                placeholder="Full name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
              <input
                className="inp"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <select
                className="inp"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="member">Member</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
              <input
                className="inp"
                type="password"
                placeholder="Temp password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <Button type="submit" className="w-full">
                Create user
              </Button>
            </form>
            {status && <div className="text-sm text-slate-300">{status}</div>}
          </Card>

          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, or role"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/70 border-b border-slate-800 text-slate-300">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 font-semibold">Role</th>
                    <th className="text-left px-5 py-3 font-semibold">Joined</th>
                    <th className="text-left px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                        Loading users…
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-800/70 ${i % 2 ? "bg-slate-900/30" : "bg-slate-900/10"}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-800 grid place-items-center border border-slate-700">
                            <Shield className={`h-4 w-4 ${u.role === "admin" ? "text-amber-400" : "text-slate-400"}`} />
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{u.email}</td>
                      <td className="px-5 py-3"><RolePill role={u.role} /></td>
                      <td className="px-5 py-3 text-slate-300">{u.joined}</td>
                      <td className="px-5 py-3">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeUser(u.id)}
                          className="min-w-[92px]"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                        No users found for “{q}”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
