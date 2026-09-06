"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader2 } from "lucide-react";

const isDevAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isDevAuthBypass && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading && !isDevAuthBypass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isDevAuthBypass && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
