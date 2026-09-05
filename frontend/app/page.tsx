"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import { BookOpen, Bot, BrainCircuit, GraduationCap, LogIn, ShieldCheck, User, UserPlus } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      {/* Header Navigation */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4 px-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-lg">
          <GraduationCap className="w-6 h-6" />
          <span>AI Study Buddy</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/documents"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition font-semibold"
              >
                <BookOpen className="w-4 h-4" />
                <span>Study Materials</span>
              </Link>
              <Link
                href="/chat"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition font-semibold"
              >
                <Bot className="w-4 h-4" />
                <span>AI Tutor Chat</span>
              </Link>
              <Link
                href="/summaries"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
              >
                <span>Summaries</span>
              </Link>
              <Link
                href="/quizzes"
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 transition font-semibold"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>AI Quizzes</span>
              </Link>
              <Link
                href="/flashcards"
                className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white flex items-center gap-1.5 transition font-semibold"
              >
                <span>Flashcards</span>
              </Link>
              <Link
                href="/subjects"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
              >
                <span>Subjects</span>
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
              >
                <User className="w-4 h-4" />
                <span>{user?.full_name || "Profile"}</span>
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-3xl space-y-6 text-center my-auto py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 font-semibold tracking-wide text-xs">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span>Modules 1–7 Active • Complete AI Study Suite</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          AI Study Buddy
        </h1>
        <p className="text-lg text-slate-300">
          Context-aware AI companion grounded in your course materials with RAG retrieval, 
          AI summaries, quiz generation, and digital flashcards.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/documents"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Upload Study Materials</span>
              </Link>
              <Link
                href="/subjects"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
              >
                Manage Subjects
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <Bot className="w-8 h-8 text-indigo-400 mb-3" />
            <h3 className="font-bold text-white mb-1">Grounded RAG Chat</h3>
            <p className="text-xs text-slate-400">Contextual Q&A using Gemini vector search over uploaded study materials.</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <BrainCircuit className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-bold text-white mb-1">AI Quizzes & Summaries</h3>
            <p className="text-xs text-slate-400">Generate custom 5-question quizzes with explanations and key topic summaries.</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <BookOpen className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="font-bold text-white mb-1">Digital Flashcards</h3>
            <p className="text-xs text-slate-400">Extract key study concepts into interactive flashcard decks with mastery review.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 flex justify-center items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Modules 1–7 Verified • Production Ready</span>
      </footer>
    </main>
  );
}
