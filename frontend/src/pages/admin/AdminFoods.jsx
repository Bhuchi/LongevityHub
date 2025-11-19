import React, { useEffect, useMemo, useState } from "react";
import {
  Salad,
  ArrowLeft,
  Plus,
  Save,
  Search,
  ChevronRight,
  Info,
  RefreshCw,
  Trash2,
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
    subtle: "bg-slate-900/60 hover:bg-slate-800/70 text-slate-200 border border-slate-700",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default function AdminFoods() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [nutrients, setNutrients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nutrientDraft, setNutrientDraft] = useState({});
  const [newFood, setNewFood] = useState({ name: "" });

  const unitOptions = useMemo(
    () => Array.from(new Set(nutrients.map((n) => n.unit))).filter(Boolean),
    [nutrients]
  );

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    setLoading(true);
    setStatus("");
    try {
      const data = await apiGet("/controllers/admin_foods.php");
      const normalizedFoods = (data.foods || []).map((f) => ({
        id: Number(f.id ?? f.food_id),
        name: f.name,
        nutrients: (f.nutrients || []).map((n) => ({
          nutrient_id: Number(n.nutrient_id ?? n.id),
          name: n.name,
          unit: n.unit,
          amount: Number(n.amount ?? n.amount_per_100g ?? 0),
        })),
      }));
      setFoods(normalizedFoods);
      setNutrients(
        (data.nutrients || []).map((n) => ({
          id: Number(n.id ?? n.nutrient_id),
          name: n.name,
          unit: n.unit,
        }))
      );
      if (normalizedFoods.length === 0) {
        setSelectedId(null);
      } else if (!selectedId || normalizedFoods.every((f) => f.id !== selectedId)) {
        setSelectedId(normalizedFoods[0].id);
      }
    } catch (err) {
      setStatus(err.message || "Failed to load foods");
    } finally {
      setLoading(false);
    }
  }

  const selected = foods.find((f) => f.id === selectedId);

  const displayFoods = useMemo(() => {
    if (!query.trim()) return foods;
    const needle = query.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(needle));
  }, [foods, query]);

  useEffect(() => {
    if (!selected) {
      setNameDraft("");
      setNutrientDraft({});
      return;
    }
    setNameDraft(selected.name);
    const draft = {};
    nutrients.forEach((n) => {
      const hit = selected.nutrients.find((x) => x.nutrient_id === n.id);
      draft[n.id] = hit ? String(hit.amount) : "";
    });
    setNutrientDraft(draft);
  }, [selectedId, foods, nutrients, selected]);

  const handleNutrientChange = (nutrientId, value) => {
    setNutrientDraft((prev) => ({ ...prev, [nutrientId]: value }));
  };

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setStatus("");
    try {
      await apiPut("/controllers/admin_foods.php", {
        food_id: selected.id,
        name: nameDraft.trim(),
        nutrients: Object.entries(nutrientDraft).map(([nid, amt]) => ({
          nutrient_id: Number(nid),
          amount: Number(amt) || 0,
        })),
      });
      setStatus("✅ Saved");
      await loadFoods();
    } catch (err) {
      setStatus(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newFood.name.trim()) return;
    try {
      const res = await apiPost("/controllers/admin_foods.php", {
        name: newFood.name.trim(),
      });
      setNewFood({ name: "" });
      await loadFoods();
      if (res?.food_id) setSelectedId(Number(res.food_id));
    } catch (err) {
      alert(err.message || "Create failed");
    }
  }

  async function deleteFood() {
    if (!selected) return;
    if (!confirm(`Delete ${selected.name}?`)) return;
    try {
      await apiDelete(`/controllers/admin_foods.php?food_id=${selected.id}`);
      setSelectedId(null);
      await loadFoods();
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
              <div className="h-10 w-10 rounded-xl bg-sky-600/15 border border-sky-700/40 grid place-items-center">
                <Salad className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin — Food & Nutrients</h1>
                <p className="text-slate-400 text-sm">Manage the food catalog and per-100g nutrient values.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4" /> Back to Admin Page
              </Button>
              <Button variant="ghost" onClick={loadFoods}>
                <RefreshCw className="h-4 w-4" /> Reload
              </Button>
              <Button onClick={handleSave} disabled={!selected || saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save"}
              </Button>
              {selected && (
                <Button variant="danger" onClick={deleteFood}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </div>

          <Card className="p-4">
            <form className="grid gap-3 md:grid-cols-[2fr_auto]" onSubmit={handleCreate}>
              <input
                value={newFood.name}
                onChange={(e) => setNewFood((f) => ({ ...f, name: e.target.value }))}
                placeholder="Food name"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                required
              />
              <Button type="submit">
                <Plus className="h-4 w-4" /> Add Food
              </Button>
            </form>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Foods</h2>
                <div className="text-xs text-slate-400">{foods.length} items</div>
              </div>
              <div className="relative mb-3">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search foods"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
              <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                {loading ? (
                  <div className="text-sm text-slate-400 px-2">Loading foods…</div>
                ) : displayFoods.length === 0 ? (
                  <div className="text-sm text-slate-400 px-2">No foods match.</div>
                ) : (
                  displayFoods.map((f) => {
                    const active = f.id === selectedId;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className={`w-full text-left rounded-xl border px-3 py-3 group flex items-center justify-between ${
                          active ? "bg-slate-800/60 border-sky-700/50" : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="font-medium">{f.name}</div>
                        <ChevronRight className={`h-4 w-4 ${active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="lg:col-span-2 p-5">
              {!selected ? (
                <div className="text-slate-400 text-sm">Select a food to edit its nutrients.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-slate-400">Composition (per 100g)</div>
                      <h3 className="text-xl font-semibold">{selected.name}</h3>
                    </div>
                    {status && <div className="text-xs text-slate-400">{status}</div>}
                  </div>

                  <div className="mb-4">
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder="Food name"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <Info className="h-4 w-4" />
                    Values are stored per 100g serving. Leave blank to omit a nutrient.
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                    {nutrients.length === 0 ? (
                      <div className="text-slate-400 text-sm">
                        No nutrients defined yet. Use the Admin ➝ Nutrients page to create them.
                      </div>
                    ) : (
                      nutrients.map((n) => (
                        <div key={n.id} className="grid md:grid-cols-[200px_1fr_90px] gap-3 items-center">
                          <div className="text-slate-300">{n.name}</div>
                          <input
                            type="number"
                            step="0.1"
                            value={nutrientDraft[n.id] ?? ""}
                            onChange={(e) => handleNutrientChange(n.id, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-600"
                          />
                          <div className="text-slate-400 text-sm">{n.unit}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {unitOptions.length > 0 && (
                    <div className="text-xs text-slate-500 pt-4">
                      Units detected in database: {unitOptions.join(", ")}
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
