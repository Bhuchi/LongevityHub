import React from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { Users, Database, ActivitySquare, FileSpreadsheet, Droplets } from "lucide-react";

export default function AdminHome() {
    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <div className="text-slate-400 text-sm">
                        Manage users, food database, and monitor system analytics
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card
                    icon={<Users className="h-6 w-6 text-sky-400" />}
                    title="Users Management"
                    desc="View, edit, or deactivate user accounts"
                    to="/admin/users"
                />

                <Card
                    icon={<FileSpreadsheet className="h-6 w-6 text-emerald-400" />}
                    title="Food & Nutrients"
                    desc="Manage foods and nutritional composition"
                    to="/admin/foods"
                />

                <Card
                    icon={<Droplets className="h-6 w-6 text-teal-400" />}
                    title="Nutrients"
                    desc="Define nutrients and measurement units"
                    to="/admin/nutrients"
                />

                <Card
                    icon={<ActivitySquare className="h-6 w-6 text-amber-400" />}
                    title="System Analytics"
                    desc="Overview of user activity, health trends, and stats"
                    to="/admin/analytics"
                />
            </div>

            <div className="mt-10 rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
                <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
                <div className="text-slate-400 text-sm">
                    <p>No recent admin activity yet (demo mode).</p>
                    <p className="mt-1">
                        Once you connect your backend, this area will show system logs,
                        user creation events, and updates to the food database.
                    </p>
                </div>
            </div>
        </Layout>
    );
}

function Card({ icon, title, desc, to }) {
    return (
        <Link
            to={to}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 hover:border-sky-500 transition"
        >
            <div className="flex items-center gap-3 mb-3">{icon}<span className="text-lg font-semibold">{title}</span></div>
            <div className="text-slate-400 text-sm">{desc}</div>
        </Link>
    );

}
