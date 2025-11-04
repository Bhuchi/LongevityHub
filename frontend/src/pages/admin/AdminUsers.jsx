import React, { useMemo, useState } from "react";
import { Users, ArrowLeft, Plus, Search, Trash2, Shield } from "lucide-react";
import Navbar from "../../components/Navbar"; // ✅ use your existing navbar
import { useNavigate } from "react-router-dom";

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
    user: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border ${map[role] || "bg-slate-700/30 text-slate-300 border-slate-600/40"}`}>
      {role}
    </span>
  );
};

export default function AdminUsers() {
  const navigate = useNavigate();

  // Demo data
  const [users, setUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "admin", joined: "2025-10-01" },
    { id: 2, name: "Sarah Smith", email: "sarah@longevityhub.com", role: "user", joined: "2025-10-02" },
    { id: 3, name: "David Chen", email: "davidc@gmail.com", role: "user", joined: "2025-10-03" },
    { id: 4, name: "Emily Brown", email: "emilyb@gmail.com", role: "user", joined: "2025-10-05" },
  ]);
  const [q, setQ] = useState("");

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

  const addUser = () => {
    const name = prompt("New user's name:");
    if (!name) return;
    const email = prompt("Email:");
    if (!email) return;
    const role = (prompt("Role (admin/user):", "user") || "user").toLowerCase() === "admin" ? "admin" : "user";
    const id = Date.now();
    const joined = new Date().toISOString().slice(0, 10);
    setUsers([{ id, name: name.trim(), email: email.trim(), role, joined }, ...users]);
  };

  const removeUser = (id) => {
    if (!confirm("Delete this user?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

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
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg">Demo</span>
              <Button onClick={addUser}>
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>

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
                  {filtered.map((u, i) => (
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
                  ))}
                  {filtered.length === 0 && (
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
