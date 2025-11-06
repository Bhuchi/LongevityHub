import React, { useState } from "react";
import {
    Activity,
    Heart,
    Moon,
    Dumbbell,
    BarChart3,
    Upload,
    Plus,
    Clock,
    Database,
} from "lucide-react";
import {
    LineChart,
    Line,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { Link } from "react-router-dom";
import LogModal from "../components/LogModal.jsx";
import Navbar from "../components/Navbar";


export default function Dashboard() {
    const [showLogModal, setShowLogModal] = useState(false);
    const [logType, setLogType] = useState(null);

    const data = [
        { day: "10-01", protein: 80 },
        { day: "10-03", protein: 96 },
        { day: "10-05", protein: 88 },
        { day: "10-07", protein: 100 },
        { day: "10-09", protein: 92 },
        { day: "10-11", protein: 104 },
        { day: "10-13", protein: 98 },
    ];

    const scoreTrend = [
        { t: 1, score: 72 },
        { t: 2, score: 74 },
        { t: 3, score: 77 },
        { t: 4, score: 73 },
        { t: 5, score: 79 },
        { t: 6, score: 75 },
        { t: 7, score: 78 },
    ];

    const stats = {
        steps: { current: 8900, goal: 10000 },
        sleep: { current: 7.3, goal: 8 },
        workout: { current: 30, goal: 45 },
        hrv: 74,
        hr: 59,
        protein: { current: 86, goal: 120 },
        fiber: { current: 22, goal: 30 },
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 space-y-6">
            {/* Header */}
            <Navbar></Navbar>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        className="date-input rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm px-3 py-1"
                    />
                    <button
                        onClick={() => {
                            setLogType(null);          // open main chooser
                            setShowLogModal(true);
                        }}
                        className="bg-sky-600 hover:bg-sky-500 text-sm font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" /> Log
                    </button>
                </div>
            </div>

            {/* Profile + Daily Score */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Profile button */}
                <Card className="flex flex-col items-center justify-center text-center p-6">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                        alt="Profile"
                        className="h-16 w-16 rounded-full mb-3 border-2 border-sky-500"
                    />
                    <h2 className="text-lg font-semibold text-slate-100">My Profile</h2>
                    <p className="text-slate-400 text-sm mb-4">View or edit your health details</p>
                    <a
                        href="/profile"
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-sm font-semibold rounded-xl text-white transition"
                    >
                        Go to Profile
                    </a>
                </Card>

                {/* Middle + Right: Daily Score + Circular Stats */}
                <div className="lg:col-span-2 grid lg:grid-cols-3 gap-6">
                    {/* Daily Score (2/3 width) */}
                    <Card className="col-span-2">
                        <h2 className="text-lg font-semibold mb-1">Daily Score</h2>
                        <div className="text-5xl font-bold mb-1">78</div>
                        <p className="text-slate-400 text-xs mb-3">
                            Computed from SQL views (v_daily_readiness + v_daily_nutrients)
                        </p>
                        <ResponsiveContainer width="100%" height={80}>
                            <LineChart data={scoreTrend}>
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#38bdf8"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Circular progress stats */}
                    <Card className="grid grid-cols-3 gap-4 text-center">
                        {/* Steps Circle */}
                        <Link
                            to="/trends"
                            className="flex flex-col items-center justify-center hover:scale-105 transition-transform duration-200"
                        >
                            <CircleStat label="Steps" value={8900} goal={10000} color="#38bdf8" />
                        </Link>

                        {/* Sleep Circle */}
                        <Link
                            to="/trends"
                            className="flex flex-col items-center justify-center hover:scale-105 transition-transform duration-200"
                        >
                            <CircleStat label="Sleep (h)" value={7.3} goal={8} color="#34d399" />
                        </Link>

                        {/* Workout Circle */}
                        <Link
                            to="/trends"
                            className="flex flex-col items-center justify-center hover:scale-105 transition-transform duration-200"
                        >
                            <CircleStat label="Workout (min)" value={30} goal={45} color="#f59e0b" />
                        </Link>
                    </Card>
                </div>
            </div>



            {/* Metrics summary (grouped in same card) */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Activity & Recovery Section */}
                <Card>
                    <h2 className="text-lg font-semibold mb-3">Activity & Recovery</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* HRV */}
                        <Link to="/wearables" className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-sky-500 transition">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <BarChart3 className="h-4 w-4 text-sky-400" /> HRV
                            </div>
                            <div className="text-2xl font-semibold text-slate-100">
                                74 <span className="text-slate-500 text-sm">ms</span>
                            </div>
                        </Link>

                        {/* Resting HR */}
                        <Link to="/wearables" className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-sky-500 transition">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Heart className="h-4 w-4 text-rose-400" /> RESTING HR
                            </div>
                            <div className="text-2xl font-semibold text-slate-100">
                                59 <span className="text-slate-500 text-sm">bpm</span>
                            </div>
                        </Link>

                        {/* Steps */}
                        <Link to="/wearables" className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-sky-500 transition">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Activity className="h-4 w-4 text-emerald-400" /> STEPS
                            </div>
                            <div className="text-2xl font-semibold text-slate-100">
                                8900 <span className="text-slate-500 text-sm">steps</span>
                            </div>
                        </Link>
                    </div>
                </Card>


                {/* Lifestyle Metrics Section */}
                <Card>
                    <h2 className="text-lg font-semibold mb-3">Lifestyle Metrics</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Sleep */}
                        <Link
                            to="/sleep"
                            className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-violet-500 transition"
                        >
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Moon className="h-4 w-4 text-violet-400" /> SLEEP
                            </div>
                            <div className="text-2xl font-semibold text-slate-100">
                                7.3 <span className="text-slate-500 text-sm">h</span>
                            </div>
                        </Link>

                        {/* Workout */}
                        <Link
                            to="/workouts"
                            className="block rounded-xl bg-slate-900/60 border border-slate-800 p-4 hover:border-amber-500 transition"
                        >
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Dumbbell className="h-4 w-4 text-amber-400" /> WORKOUT
                            </div>
                            <div className="text-2xl font-semibold text-slate-100">
                                30 <span className="text-slate-500 text-sm">min</span>
                            </div>
                        </Link>
                    </div>
                </Card>

            </div>




            {/* Protein/Fiber progress bars */}
            <div className="grid md:grid-cols-2 gap-4">
                <ProgressBar label="Protein (g)" current={86} goal={120} color="bg-sky-500" />
                <ProgressBar label="Fiber (g)" current={22} goal={30} color="bg-violet-500" />
            </div>

            {/* Recent activity + Protein chart */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold">Recent Activity</h2>
                        <button className="text-sky-400 text-sm hover:underline">
                            View all
                        </button>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li>08:40 — Breakfast · Oats 80g, Orange 130g</li>
                        <li>10:15 — Wearables imported · +4,200 steps</li>
                        <li>14:30 — Workout · 30 min · Moderate</li>
                        <li>23:05 — Sleep · start</li>
                    </ul>
                </Card>

                <Card>
                    <h2 className="text-lg font-semibold mb-3">7-Day Protein</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    borderColor: "#334155",
                                    color: "#f8fafc",
                                }}
                            />
                            <Bar dataKey="protein" fill="#38bdf8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Upload + shortcuts */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-2 mb-3">
                        <Database className="h-5 w-5 text-sky-400" />
                        <h2 className="text-lg font-semibold">Wearables CSV</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                        Import steps / HRV / resting HR from supported devices.
                    </p>

                    <div className="flex gap-2">
                        {/* Download button */}
                        <button
                            onClick={() => {
                                const csvContent = "date,steps,hrv,resting_hr\n2025-10-15,8900,72,58";
                                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = "wearables_template.csv";
                                link.click();
                            }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm border border-slate-700"
                        >
                            Download template
                        </button>

                        {/* Upload button */}
                        <label
                            htmlFor="file-upload"
                            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-1"
                        >
                            <Upload className="h-4 w-4" /> Upload file
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    alert(`✅ Uploaded ${file.name}\n\nPreview:\n${event.target.result.slice(0, 100)}...`);
                                };
                                reader.readAsText(file);
                            }}
                        />
                    </div>
                </Card>


                {/* ✅ SHORTCUTS card */}
                <Card>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold">Shortcuts</h2>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {[
                            { label: "Log meal", type: "meal" },
                            { label: "Log workout", type: "workout" },
                            { label: "Log sleep", type: "sleep" },
                        ].map((btn) => (
                            <button
                                key={btn.label}
                                onClick={() => {
                                    setLogType(btn.type);       // 👈 open directly
                                    setShowLogModal(true);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </Card>



                {/* About card */}
                <Card>
                    <h2 className="text-lg font-semibold mb-3">About</h2>
                    <p className="text-slate-400 text-sm">
                        Score and metrics are computed from SQL views:
                        <br />
                        <code>v_daily_readiness</code>, <code>v_daily_nutrients</code>,
                        <br />
                        <code>v_daily_score</code>.
                        <br />
                        Replace mock fetchers with your API endpoints.
                    </p>
                </Card>
            </div>
            {/* Modal */}
            <LogModal
                isOpen={showLogModal}
                onClose={() => {
                    setShowLogModal(false);
                    setLogType(null);
                }}
                type={logType}
            />
        </div>
    );
}
function MetricMini({ title, value, unit, icon }) {
    return (
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-sky-500 transition">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide mb-1">
                {icon}
                {title}
            </div>
            <div className="text-xl font-semibold text-slate-100">
                {value} <span className="text-slate-500 text-sm">{unit}</span>
            </div>
        </div>
    );
}


/* Reusable Components */
function Card({ children, className = "" }) {
    return (
        <div
            className={
                "rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg " +
                className
            }
        >
            {children}
        </div>
    );
}

function MetricCard({ title, value, unit, icon }) {
    // Map each title to its target route
    const linkMap = {
        "HRV": "/wearables",
        "RESTING HR": "/wearables",
        "STEPS": "/wearables",
        "SLEEP": "/sleep",
        "WORKOUT": "/workouts",
    };

    const to = linkMap[title] || "#";

    return (
        <Link
            to={to}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg 
                   flex flex-col items-start justify-center hover:border-sky-500 transition"
        >
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide">
                {icon}
                {title}
            </div>
            <div className="text-2xl font-semibold text-slate-100">
                {value} <span className="text-slate-500 text-sm">{unit}</span>
            </div>
        </Link>
    );
}


function ProgressBar({ label, current, goal, color }) {
    const percent = Math.round((current / goal) * 100);

    // Set link target
    const to = "/meals";

    return (
        <Link
            to={to}
            className="block rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg hover:border-sky-500 transition"
        >
            <div className="flex justify-between mb-1">
                <span className="text-slate-300 text-sm">{label}</span>
                <span className="text-slate-400 text-sm">
                    {current} / {goal}
                </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-2 ${color}`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
        </Link>
    );
}
/* SVG Circle Progress */
function CircleStat({ label, value, goal, color }) {
    const percent = Math.round((value / goal) * 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            {/* Circle progress */}
            <svg width="100" height="100" className="mb-2">
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="none"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                />
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-lg font-semibold fill-slate-100"
                >
                    {percent}%
                </text>
            </svg>

            {/* Label + value below circle */}
            <div className="text-sm text-slate-300 font-medium">{label}</div>
            <div className="text-xs text-slate-500">{value} / {goal}</div>
        </div>
    );
}
