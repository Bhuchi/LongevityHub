import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { Search, Plus, Save, Droplets, Trash2 } from "lucide-react";

export default function AdminNutrients() {
  const [demoMode, setDemoMode] = useState(true);
  const [nutrients, setNutrients] = useState([]);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [msg, setMsg] = useState("");

  // load demo data or from backend
  useEffect(() => {
    if (demoMode) {
      setNutrients(sampleNutrients());
      return;
    }
    fetch("/api/nutrients.php")
      .then(r => r.json())
      .then(setNutrients)
      .catch(() => setMsg("Failed to load nutrients"));
  }, [demoMode]);

  const filtered = nutrients.filter(
    n => n.name.toLowerCase().includes(q.toLowerCase()) || n.unit.toLowerCase().includes(q.toLowerCase())
  );

  function addNutrient() {
    if (!name.trim()) return;
    const newNut = {
      nutrient_id: Date.now(),
      name: name.trim(),
      unit: unit.trim(),
      active: true,
    };
    setNutrients([newNut, ...nutrients]);
    setName("");
    setUnit("g");
    setMsg("✅ Nutrient added (demo)");
  }

  function toggleActive(id) {
    setNutrients(v =>
      v.map(n =>
        n.nutrient_id === id ? { ...n, active: !n.active } : n
      )
    );
    setMsg("✅ Updated (demo)");
  }

  function delNutrient(id) {
    setNutrients(v => v.filter(n => n.nutrient_id !== id));
    setMsg("🗑️ Deleted (demo)");
  }

  async function saveAll() {
    setMsg("💾 Saved (demo)");
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 grid place-items-center">
            <Droplets className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin — Nutrients</h1>
            <p className="text-slate-400 text-sm">
              Manage nutrient types and measurement units
            </p>
          </div>
        </div>
        <button
          onClick={() => setDemoMode(d => !d)}
          className={`text-xs px-2 py-1 rounded-lg border ${
            demoMode
              ? "border-emerald-600 text-emerald-300 bg-emerald-600/10"
              : "border-slate-700 text-slate-300"
          }`}
        >
          {demoMode ? "Demo" : "Live"}
        </button>
      </div>

      {msg && <div className="text-sky-400 text-sm mb-4">{msg}</div>}

      {/* Add + Search */}
      <div className="flex items-center gap-3 mb-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nutrient name (e.g., Protein)"
          className="inp w-56"
        />
        <input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="Unit (e.g., g, mg, kcal)"
          className="inp w-28"
        />
        <button onClick={addNutrient} className="btn flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </button>

        <div className="relative ml-auto">
          <Search className="h-4 w-4 text-slate-400 absolute left-2 top-2.5" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search nutrients"
            className="inp pl-8 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-300">
            <tr>
              <th className="text-left p-3">Nutrient</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-left p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(n => (
              <tr key={n.nutrient_id} className="hover:bg-slate-800/60">
                <td className="p-3">{n.name}</td>
                <td className="p-3 text-slate-400">{n.unit}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      n.active
                        ? "bg-emerald-600/20 text-emerald-300"
                        : "bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    {n.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => toggleActive(n.nutrient_id)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
                  >
                    {n.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => delNutrient(n.nutrient_id)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-slate-400">
                  No nutrients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={saveAll} className="btn flex items-center gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </Layout>
  );
}

/* --- Demo data --- */
function sampleNutrients() {
  return [
    { nutrient_id: 1, name: "Protein", unit: "g", active: true },
    { nutrient_id: 2, name: "Fiber", unit: "g", active: true },
    { nutrient_id: 3, name: "Carbohydrates", unit: "g", active: true },
    { nutrient_id: 4, name: "Fat", unit: "g", active: true },
    { nutrient_id: 5, name: "Calories", unit: "kcal", active: true },
    { nutrient_id: 6, name: "Sugar", unit: "g", active: false },
  ];
}
