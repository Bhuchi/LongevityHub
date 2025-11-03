import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { Search, UserPlus, Trash2, Shield } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState("");
  const [demoMode, setDemoMode] = useState(true);

  // Load demo data or real data
  useEffect(() => {
    if (demoMode) {
      setUsers(sampleUsers());
      return;
    }
    fetch("/api/users.php")
      .then(r => r.json())
      .then(setUsers)
      .catch(e => setMsg("Failed to load users"));
  }, [demoMode]);

  function addUser(u) {
    const newUser = { ...u, id: Date.now(), created_at: new Date().toISOString().slice(0, 10) };
    setUsers([newUser, ...users]);
    setShowAdd(false);
    setMsg("✅ User added (demo)");
  }

  function delUser(id) {
    setUsers(v => v.filter(u => u.id !== id));
    setMsg("🗑️ User removed (demo)");
  }

  const filtered = users.filter(
    u =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.role.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin — Users</h1>
          <div className="text-slate-400 text-sm">Manage user accounts and roles</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="btn flex items-center gap-1"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
          <button
            onClick={() => setDemoMode(d => !d)}
            className={`text-xs px-2 py-1 rounded-lg border ${
              demoMode
                ? "border-emerald-600 text-emerald-300 bg-emerald-600/10"
                : "border-slate-700 text-slate-300"
            }`}
            title={demoMode ? "Demo mode ON" : "Live mode"}
          >
            {demoMode ? "Demo" : "Live"}
          </button>
        </div>
      </div>

      {msg && <div className="text-sm text-sky-400 mb-3">{msg}</div>}

      <div className="flex items-center mb-4">
        <Search className="h-4 w-4 text-slate-400 absolute ml-3" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name, email, or role"
          className="inp pl-8 w-80"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Joined</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/60">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-slate-400">{u.email}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      u.role === "admin"
                        ? "bg-amber-600/20 text-amber-400"
                        : "bg-sky-600/20 text-sky-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-400">{u.created_at}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => delUser(u.id)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1 float-right"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSave={addUser} />}
    </Layout>
  );
}

function AddUserModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name || !email) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave({ name, email, role });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add User</h2>
          <button
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Name</div>
            <input
              className="inp"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Email</div>
            <input
              type="email"
              className="inp"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-sm text-slate-400 mb-1">Role</div>
            <select
              className="inp"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- demo users ---- */
function sampleUsers() {
  return [
    { id: 1, name: "John Doe", email: "john@example.com", role: "admin", created_at: "2025-10-01" },
    { id: 2, name: "Sarah Smith", email: "sarah@longevityhub.com", role: "user", created_at: "2025-10-02" },
    { id: 3, name: "David Chen", email: "davidc@gmail.com", role: "user", created_at: "2025-10-03" },
    { id: 4, name: "Emily Brown", email: "emilyb@gmail.com", role: "user", created_at: "2025-10-05" },
  ];
}
