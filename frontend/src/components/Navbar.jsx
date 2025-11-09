import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { getUser, isAdmin, logout } from "../auth";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // role badge colors
  const roleColors = {
    admin:   "bg-rose-600/20 text-rose-400 border-rose-600",
    premium: "bg-emerald-600/20 text-emerald-400 border-emerald-600",
    member:  "bg-sky-600/20 text-sky-400 border-sky-600",
  };

  // active tab style helper
  const linkClass = ({ isActive }) =>
    "px-3 py-1 rounded-lg transition " +
    (isActive
      ? "text-sky-400 bg-slate-800 border border-sky-700"
      : "text-slate-300 hover:text-sky-400");

  return (
    <nav className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">

        {/* Left: Brand + role badge */}
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-sky-400" />
          <Link to="/" className="text-lg font-semibold text-slate-100">
            LongevityHub
          </Link>
          {user?.role && (
            <span
              className={
                "ml-2 text-xs border px-2 py-0.5 rounded-lg " +
                (roleColors[user.role] || "border-slate-700 text-slate-400")
              }
              title={`Role: ${user.role}`}
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          )}
        </div>

        {/* Center: nav tabs with active highlight */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <NavLink to="/"        className={linkClass} end>Dashboard</NavLink>
          <NavLink to="/meals"   className={linkClass}>Meals</NavLink>
          <NavLink to="/workouts" className={linkClass}>Workouts</NavLink>
          <NavLink to="/sleep"   className={linkClass}>Sleep</NavLink>
          <NavLink to="/wearables" className={linkClass}>Wearables</NavLink>
          <NavLink to="/trends"  className={linkClass}>Trends</NavLink>
          <NavLink to="/profile" className={linkClass}>Profile</NavLink>

          {/* Admin tab only for admins */}
          {isAdmin() && (
            <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          )}
        </div>

        {/* Right: user + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-slate-400 text-sm hidden sm:inline">
              {user.full_name || user.email}
            </span>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition"
            >
              Log Out
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
