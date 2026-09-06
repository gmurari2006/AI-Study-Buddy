"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { TokenResponse } from "@/types";
import { GraduationCap, Loader2, UserPlus } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [academicYear, setAcademicYear] = useState("3rd Year CSE");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<TokenResponse>("/auth/register", {
        email,
        password,
        full_name: fullName || undefined,
        academic_year: academicYear || undefined,
      });

      setAuth(response.data.user, response.data.access_token);
      router.push("/profile");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(detail.map((item: any) => item.msg || item.message).join(", "));
      } else if (err.message === "Network Error" || !err.response) {
        setError("Unable to connect to backend server. Please ensure the backend server is running.");
      } else {
        setError("Registration failed. Please check your inputs.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) {
        setError(oauthError.message || "Unable to sign in with Google. Please try again.");
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError("Unable to sign in with Google. Please try again or register with email.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center space-y-2 text-center mb-6">
          <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-sm text-slate-400">Join AI Study Buddy for personalized STEM learning</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex justify-center items-center gap-2.5 transition duration-200 shadow-sm border border-slate-200 disabled:opacity-50"
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> : <GoogleIcon />}
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-slate-800"></div>
          <span className="absolute bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="Alex Student"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year / Branch</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="alex@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex justify-center items-center gap-2 transition duration-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Register</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
