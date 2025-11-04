import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();

  // Simple logout logic — you can later replace this with actual auth logout
  const handleLogout = () => {
    // Clear any stored session/token if you add authentication later
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="w-full bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-sky-400" />
          <Link to="/" className="text-lg font-semibold text-slate-100">
            LongevityHub
          </Link>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-slate-300 text-sm">
          <Link to="/" className="hover:text-sky-400 transition">Dashboard</Link>
          <Link to="/meals" className="hover:text-sky-400 transition">Meals</Link>
          <Link to="/workouts" className="hover:text-sky-400 transition">Workouts</Link>
          <Link to="/sleep" className="hover:text-sky-400 transition">Sleep</Link>
          <Link to="/wearables" className="hover:text-sky-400 transition">Wearables</Link>
          <Link to="/trends" className="hover:text-sky-400 transition">Trends</Link>
          <Link to="/profile" className="hover:text-sky-400 transition">Profile</Link>
          <Link to="/admin" className="hover:text-sky-400 transition">Admin</Link>
        </div>

        {/* Right Section (Logout Button) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
