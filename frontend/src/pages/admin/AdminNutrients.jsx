import React, { useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  Search,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api";

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
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function AdminNutrients() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setStatus("");
    try {
      const data = await apiGet("/controllers/admin_nutrients.php");
      setRows((data.nutrients || []).map((n) => ({
        id: Number(n.id ?? n.nutrient_id),
        name: n.name,
        unit: n.unit,
      })));
    } catch (err) {
      setStatus(err.message || "Failed to load nutrients");
    } finally {
      setLoading(false);
    }
  }

  const units = useMemo(
    () => Array.from(new Set(rows.map((r) => r.unit))).filter(Boolean).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) => {
      const matchName = !needle || r.name.toLowerCase().includes(needle);
      const matchUnit = unitFilter === "all" || r.unit === unitFilter;
      return matchName && matchUnit;
    });
  }, [rows, q, unitFilter]);

  async function addRow(e) {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) return;
    try {
      await apiPost("/controllers/admin_nutrients.php", {
        name: name.trim(),
        unit: unit.trim(),
      });
      setName("");
      await load();
    } catch (err) {
      alert(err.message || "Create failed");
    }
  }

  async function editRow(row) {
    const nextName = prompt("Nutrient name", row.name);
    if (!nextName) return;
    const nextUnit = prompt("Unit", row.unit);
    if (!nextUnit) return;
    try {
      await apiPut("/controllers/admin_nutrients.php", {
        nutrient_id: row.id,
        name: nextName.trim(),
        unit: nextUnit.trim(),
      });
      await load();
    } catch (err) {
      alert(err.message || "Update failed");
    }
  }

  async function delRow(row) {
    if (!confirm(`Delete ${row.name}?`)) return;
    try {
      await apiDelete(`/controllers/admin_nutrients.php?nutrient_id=${row.id}`);
      await load();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-700/40 grid place-items-center">
                <FlaskConical className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin — Nutrients</h1>
                <p className="text-slate-400 text-sm">Manage nutrient definitions used across foods and meals.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4" /> Back to Admin Page
              </Button>
              <Button variant="ghost" onClick={load}>
                <RefreshCw className="h-4 w-4" /> Reload
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-[2fr_160px_auto]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nutrient name (e.g., Protein)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (e.g., g)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
              <Button onClick={addRow}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search nutrient"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
              <div className="relative">
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="w-full appearance-none pr-8 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  <option value="all">All units</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-2.5 text-slate-500">▾</span>
              </div>
              <div className="text-sm text-slate-400 flex items-center">
                {loading ? "Loading…" : `${filtered.length} nutrients`}
              </div>
            </div>
          </Card>

          <Card>
            <div className="overflow-hidden rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/70 border-b border-slate-800 text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3">Nutrient</th>
                    <th className="text-left px-4 py-3">Unit</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400">Loading nutrients…</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No nutrients match your filters.</td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <tr key={row.id} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-slate-300">{row.unit}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => editRow(row)}>
                              <Edit2 className="h-4 w-4" /> Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => delRow(row)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {status && <div className="px-4 py-3 text-xs text-slate-400">{status}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
