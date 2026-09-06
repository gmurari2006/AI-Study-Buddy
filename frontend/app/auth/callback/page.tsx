"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { TokenResponse } from "@/types";
import { GraduationCap, Loader2, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setError(sessionError?.message || "Unable to retrieve Google authentication session. Please try signing in again.");
          setLoading(false);
          return;
        }

        const email = session.user.email;
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email?.split("@")[0] || "Google User";

        if (!email) {
          setError("Google account email could not be verified.");
          setLoading(false);
          return;
        }

        // Exchange/Sync Google user session with AI Study Buddy application auth
        const response = await api.post<TokenResponse>("/auth/google", {
          email,
          full_name: fullName,
          supabase_uid: session.user.id,
        });

        setAuth(response.data.user, response.data.access_token);
        router.push("/profile");
      } catch (err: any) {
        console.error("Google Auth Callback Exception:", err);
        setError("Unable to sign in with Google. Please try signing in with email and password.");
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md text-center space-y-4">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-400">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight">Authenticating with Google...</h1>
            <p className="text-xs text-slate-400">Completing secure OAuth session initialization</p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-2">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold tracking-tight text-red-300">Authentication Failed</h1>
            <p className="text-xs text-slate-300 bg-red-950/40 p-3 rounded-lg border border-red-800/40 leading-relaxed">
              {error}
            </p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition mt-2"
            >
              Return to Sign In
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
