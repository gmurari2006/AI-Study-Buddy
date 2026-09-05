"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserProfile } from "@/types";
import { CheckCircle2, GraduationCap, Loader2, LogOut, Save, User } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [academicYear, setAcademicYear] = useState(user?.academic_year || "3rd Year CSE");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setAcademicYear(user.academic_year || "3rd Year CSE");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    setLoading(true);

    try {
      const response = await api.put<UserProfile>("/users/me", {
        full_name: fullName,
        academic_year: academicYear,
      });

      updateUser(response.data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore API logout error if token already expired
    } finally {
      logout();
      router.push("/login");
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950">
        <div className="w-full max-w-lg p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-indigo-600/20 text-indigo-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Student Profile</h1>
                <p className="text-xs text-slate-400">Manage your user details and preferences</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year / Program</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1st Year CSE">1st Year CSE</option>
                <option value="2nd Year CSE">2nd Year CSE</option>
                <option value="3rd Year CSE">3rd Year CSE</option>
                <option value="4th Year CSE">4th Year CSE</option>
                <option value="STEM Undergraduate">STEM Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex justify-center items-center gap-2 transition duration-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>User ID: {user?.id}</span>
            </span>
            <span>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}</span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
