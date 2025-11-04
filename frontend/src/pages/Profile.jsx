import React, { useState } from "react";
import Navbar from "../components/Navbar";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "Bob Member",
    timezone: "Asia/Bangkok",
    height: "170",
    weight: "65", // ✅ added default weight
  });

  const [goals, setGoals] = useState({
    steps: 10000,
    sleep: 8,
    workout: 45,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setGoals((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    alert("Profile saved successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">Account</h2>
            <p className="text-slate-400 text-sm mb-4">Your basic information</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Time zone</label>
                <select
                  name="timezone"
                  value={profile.timezone}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="Asia/Bangkok">Asia/Bangkok</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="America/New_York">America/New York</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={profile.height}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              {/* ✅ New Weight Field */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={profile.weight}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <button
                onClick={handleSave}
                className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded-xl text-sm font-semibold mt-2"
              >
                Save
              </button>
            </div>
          </div>

          {/* Goals Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">Goals</h2>
            <p className="text-slate-400 text-sm mb-4">
              Used for readiness & dashboard
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Daily steps</label>
                <input
                  type="number"
                  name="steps"
                  value={goals.steps}
                  onChange={handleGoalChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Sleep hours / night</label>
                <input
                  type="number"
                  name="sleep"
                  value={goals.sleep}
                  onChange={handleGoalChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Workout minutes / day</label>
                <input
                  type="number"
                  name="workout"
                  value={goals.workout}
                  onChange={handleGoalChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
