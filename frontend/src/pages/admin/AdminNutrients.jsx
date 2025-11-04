import React, { useMemo, useState } from "react";
import {
  FlaskConical,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  CircleSlash,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../../components/Navbar"; // ✅ your existing Navbar
import { useNavigate } from "react-router-dom";

// Reusable UI components
const Card = ({ className = "", children }) => (
  <div
    className={`rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ tone = "neutral", children }) => {
  const tones = {
    neutral: "bg-slate-800/70 text-slate-300 border-slate-700",
    success: "bg-emerald-600/15 text-emerald-300 border-emerald-700/40",
    warn: "bg-amber-600/15 text-amber-300 border-amber-700/40",
    danger: "bg-rose-600/15 text-rose-300 border-rose-700/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Button = ({
  variant = "solid",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const base =
    "rounded-xl font-semibold transition inline-flex items-center justify-center gap-2";
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-3.5 py-2",
  };
  const variants = {
    solid: "bg-sky-600 hover:bg-sky-500 text-white",
    ghost: "bg-slate-800/60 hover:bg-slate-800 text-slate-100 border border-slate-700",
    danger: "bg-rose-600/80 hover:bg-rose-500 text-white",
    subtle:
      "bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 border border-slate-700",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function AdminNutrients() {
  const navigate = useNavigate();

  // Demo state (replace with backend later)
  const [rows, setRows] = useState([
    { id: 1, name: "Protein", unit: "g", active: true },
    { id: 2, name: "Fiber", unit: "g", active: true },
    { id: 3, name: "Carbohydrates", unit: "g", active: true },
    { id: 4, name: "Fat", unit: "g", active: true },
    { id: 5, name: "Calories", unit: "kcal", active: true },
    { id: 6, name: "Sugar", unit: "g", active: false },
  ]);
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState("all");
  const [status, setStatus] = useState("all");
  const [name, setName] = useState("");
  const [newUnit, setNewUnit] = useState("g");
  const [saving, setSaving] = useState(false);
  const units = useMemo(() => ["g", "mg", "mcg", "kcal"], []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQ = !q || r.name.toLowerCase().includes(q.toLowerCase());
      const matchUnit = unit === "all" || r.unit === unit;
      const matchStatus =
        status === "all" || (status === "active" ? r.active : !r.active);
      return matchQ && matchUnit && matchStatus;
    });
  }, [rows, q, unit, status]);

  function addRow() {
    const n = name.trim();
    if (!n) return;
    setRows([{ id: Date.now(), name: n, unit: newUnit, active: true }, ...rows]);
    setName("");
  }

  function toggleActive(id) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  function del(id) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 650)); // simulate save
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar /> {/* ✅ Your existing Navbar */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-700/40 grid place-items-center">
                <FlaskConical className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin — Nutrients</h1>
                <p className="text-slate-400 text-sm">
                  Manage nutrient types and measurement units
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Admin Page
              </Button>
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg">
                Demo
              </span>
              <Button onClick={save} variant="solid" size="md" className="shadow-md">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search nutrient (e.g., Protein)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
              <div className="relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full appearance-none pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  <option value="all">All units</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full appearance-none pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </Card>

          {/* Add New Nutrient */}
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nutrient name (e.g., Protein)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
              <div className="relative">
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full appearance-none pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <Button onClick={addRow} variant="ghost">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/70 text-slate-300">
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3">Nutrient</th>
                    <th className="text-left px-4 py-3">Unit</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <CircleSlash className="h-4 w-4" />
                          No nutrients match your filters.
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-slate-300">{r.unit}</td>
                      <td className="px-4 py-3">
                        {r.active ? (
                          <Badge tone="success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </Badge>
                        ) : (
                          <Badge tone="neutral">
                            <XCircle className="h-3.5 w-3.5" /> Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {r.active ? (
                            <Button
                              variant="subtle"
                              size="sm"
                              onClick={() => toggleActive(r.id)}
                            >
                              Disable
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(r.id)}
                            >
                              Enable
                            </Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => del(r.id)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
