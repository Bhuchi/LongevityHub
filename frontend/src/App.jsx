
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Meals from "./pages/Meals.jsx";
import Workouts from "./pages/Workouts.jsx";
import Sleep from "./pages/Sleep.jsx";
import Wearables from "./pages/Wearables.jsx";
import Trends from "./pages/Trends.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminFood from "./pages/admin/AdminFoods.jsx";
import AdminNutrients from "./pages/admin/AdminNutrients.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import Chatbot from "./components/Chatbot.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Everything below requires login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/wearables" element={<Wearables />} />
          <Route path="/trends" element={<Trends />} />

          {/* Admin-only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/foods" element={<AdminFood />} />
            <Route path="/admin/nutrients" element={<AdminNutrients />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        <Chatbot />

    </BrowserRouter>
  );
}
