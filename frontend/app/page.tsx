"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  GraduationCap,
  Bot,
  BookOpen,
  Brain,
  Sparkles,
  MessageSquare,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
  Upload,
  Zap,
  User,
  LogIn,
  UserPlus,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDevAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
  const effectiveAuth = isAuthenticated || isDevAuthBypass;

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-200/50 blur-3xl opacity-70"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-purple-200/50 blur-3xl opacity-60"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-cyan-200/40 blur-3xl opacity-50"></div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl px-5 py-3 flex items-center justify-between transition-all">
          {/* Left: Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
              AI Study Buddy
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#ai-tools" className="hover:text-indigo-600 transition-colors">
              AI Tools
            </a>
          </nav>

          {/* Right: Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {effectiveAuth ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/documents"
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition border border-indigo-200/60 flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Materials</span>
                </Link>
                <Link
                  href="/chat"
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition border border-purple-200/60 flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>AI Tutor</span>
                </Link>
                <Link
                  href="/quizzes"
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs transition border border-amber-200/60 flex items-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Quizzes</span>
                </Link>
                <Link
                  href="/flashcards"
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition border border-rose-200/60 flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flashcards</span>
                </Link>
                <Link
                  href="/profile"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 ml-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user?.full_name?.split(" ")[0] || "Profile"}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              How It Works
            </a>
            <a
              href="#ai-tools"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-sm"
            >
              AI Tools
            </a>
            <hr className="border-slate-200" />
            {effectiveAuth ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/documents"
                  className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-xs text-center"
                >
                  Materials
                </Link>
                <Link
                  href="/chat"
                  className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-medium text-xs text-center"
                >
                  AI Chat
                </Link>
                <Link
                  href="/quizzes"
                  className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-medium text-xs text-center"
                >
                  Quizzes
                </Link>
                <Link
                  href="/flashcards"
                  className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-medium text-xs text-center"
                >
                  Flashcards
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 z-10">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Text Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/80 text-indigo-700 font-semibold text-xs shadow-sm">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>AI-Powered Learning Companion</span>
              </div>

              {/* Display Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Your AI-Powered <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Study Companion.
                </span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-700 font-bold block mt-2">
                  <span className="text-indigo-600">Study</span> Smarter.{" "}
                  <span className="text-violet-600">Learn</span> Faster.
                </span>
              </h1>

              {/* Hero Subtitle */}
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Turn your course materials into grounded AI conversations, concise summaries, auto-generated quizzes, and interactive digital flashcards.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                {effectiveAuth ? (
                  <Link
                    href="/documents"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Upload Study Materials</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <a
                  href="#features"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center"
                >
                  Explore Features
                </a>
              </div>

              {/* Key Highlights */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>100% Grounded RAG</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>PDF Document Vectoring</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  <span>Interactive Quizzes & Cards</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Column: Mockup Dashboard */}
            <div className="lg:col-span-5 relative">
              {/* Floating Decorative Cards */}
              <div className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-lg animate-bounce duration-1000">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  98%
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800">Understanding</p>
                  <p className="text-[9px] text-slate-500">Source Verified</p>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800">5 New Flashcards</p>
                  <p className="text-[9px] text-purple-600 font-semibold">Mastery Active</p>
                </div>
              </div>

              {/* Main Workspace Mockup Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl shadow-indigo-900/10 space-y-4 relative overflow-hidden">
                {/* Dashboard Top Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    <span className="ml-2 text-xs font-bold text-slate-700 font-display">AI Study Buddy</span>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    DBMS Unit 3.pdf
                  </span>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Source grounded
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    ✓ AI generated
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    📚 Study material
                  </span>
                </div>

                {/* Simulated Chat Dialogue */}
                <div className="space-y-3 pt-1">
                  {/* User Message */}
                  <div className="flex items-start gap-2.5 justify-end">
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-xs max-w-[85%] shadow-sm">
                      Explain normalization in simple terms.
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                      You
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs max-w-[88%] border border-slate-200/60 leading-relaxed">
                      <p className="font-semibold text-indigo-900 mb-1">AI Tutor (Grounded Response):</p>
                      Normalization is a database design technique used to reduce data redundancy and improve data integrity. It divides large tables into smaller, linked tables to ensure each fact is stored only once.
                    </div>
                  </div>
                </div>

                {/* Mock Input Bar */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-400">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ask anything about your material...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SECTION */}
        <section id="features" className="py-20 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Section Heading */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                <Zap className="w-3.5 h-3.5" />
                <span>Complete Study Suite</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Everything you need to learn better
              </h2>
              <p className="text-slate-600 text-base">
                One intelligent workspace for understanding, practicing, and remembering what you study.
              </p>
            </div>

            {/* 4-Card Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Grounded RAG Chat */}
              <div className="group bg-gradient-to-b from-blue-50/50 via-white to-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                    🤖 Grounded RAG Chat
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Ask questions about your uploaded course materials and receive contextual, source-grounded answers powered by vector search.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 pt-6"
                >
                  <span>Launch AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Card 2: AI Summaries */}
              <div className="group bg-gradient-to-b from-purple-50/50 via-white to-white p-6 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                    ✨ AI Summaries
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Transform lengthy study material into concise, structured summaries and formula cheat sheets for fast exam revision.
                  </p>
                </div>
                <Link
                  href="/summaries"
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 pt-6"
                >
                  <span>View Summaries</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Card 3: AI Quizzes */}
              <div className="group bg-gradient-to-b from-amber-50/50 via-white to-white p-6 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                    🧠 AI Quizzes
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Generate practice questions with instant detailed explanations and evaluate your conceptual understanding.
                  </p>
                </div>
                <Link
                  href="/quizzes"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 pt-6"
                >
                  <span>Generate Quizzes</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Card 4: Digital Flashcards */}
              <div className="group bg-gradient-to-b from-pink-50/50 via-white to-white p-6 rounded-2xl border border-slate-200 hover:border-pink-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                    📚 Digital Flashcards
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Convert important concepts into interactive flashcard decks with active recall review and mastery tracking.
                  </p>
                </div>
                <Link
                  href="/flashcards"
                  className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 pt-6"
                >
                  <span>Study Flashcards</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                From material to mastery
              </h2>
              <p className="text-slate-600 text-base">
                Three simple steps to transform your raw course PDFs into active learning tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center relative space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                  01
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                  UPLOAD
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900">Add Study Materials</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload your lecture slides, textbook chapters, or syllabus PDFs into organized subject buckets.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center relative space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto shadow-md shadow-purple-500/20">
                  02
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px]">
                  UNDERSTAND
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900">Learn with AI</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ask questions and receive instant, source-grounded answers with direct quotes from your materials.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center relative space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-600 text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto shadow-md shadow-pink-500/20">
                  03
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-pink-50 text-pink-700 font-bold text-[11px]">
                  MASTER
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900">Practice & Review</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Test your recall using 5-question AI quizzes and auto-extracted digital flashcard decks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI TOOL SHOWCASE */}
        <section id="ai-tools" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-8 sm:p-12 border border-indigo-800/40 shadow-2xl overflow-hidden relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-xs border border-indigo-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Unified AI Workspace</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                  One workspace. <br />
                  Multiple ways to learn.
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Connect your subjects once and seamlessly switch between Q&A chat, material summaries, quiz assessments, and flashcards.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span>Ask grounded questions over course materials</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Generate concise material summaries & formula cheat sheets</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span>Take 5-question AI quizzes with explanations</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span>Review auto-extracted digital flashcards</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                      <span>Subjects Overview</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                      Active Session
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className="bg-indigo-950/50 border border-indigo-800/50 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-indigo-300 font-semibold">DBMS</p>
                      <p className="text-[9px] text-slate-400">3 Materials</p>
                    </div>
                    <div className="bg-purple-950/50 border border-purple-800/50 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-purple-300 font-semibold">Machine Learning</p>
                      <p className="text-[9px] text-slate-400">2 Materials</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-xl text-center">
                      <p className="text-[10px] text-slate-300 font-semibold">Data Structures</p>
                      <p className="text-[9px] text-slate-400">4 Materials</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-indigo-300">AI Assistant Prompt</span>
                      <span className="text-slate-500">Gemini 3.6 Flash</span>
                    </div>
                    <p className="text-slate-300 text-[11px] italic">
                      &quot;Generate a 5-question quiz on B-Trees and indexing algorithms.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUALITATIVE METRICS SECTION */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <p className="font-display text-2xl font-extrabold text-indigo-600">AI-Powered</p>
              <p className="text-xs text-slate-600 font-medium">Learning Workspace</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <p className="font-display text-2xl font-extrabold text-purple-600">Grounded</p>
              <p className="text-xs text-slate-600 font-medium">Source Material Q&A</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <p className="font-display text-2xl font-extrabold text-amber-600">Interactive</p>
              <p className="text-xs text-slate-600 font-medium">Practice Quizzes</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <p className="font-display text-2xl font-extrabold text-pink-600">Smart Review</p>
              <p className="text-xs text-slate-600 font-medium">Concept Flashcards</p>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-3xl p-10 sm:p-14 text-center shadow-xl relative overflow-hidden space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to study smarter?
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto font-normal">
              Turn your study materials into an intelligent learning experience grounded directly in your course PDFs.
            </p>
            <div className="pt-2">
              <Link
                href={effectiveAuth ? "/documents" : "/register"}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-lg text-slate-900">AI Study Buddy</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Context-aware AI companion grounded in your course materials for STEM students.
              </p>
            </div>

            <div>
              <p className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <Link href="/documents" className="hover:text-indigo-600 transition">
                    Study Materials
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="hover:text-indigo-600 transition">
                    AI Tutor Chat
                  </Link>
                </li>
                <li>
                  <Link href="/quizzes" className="hover:text-indigo-600 transition">
                    AI Quizzes
                  </Link>
                </li>
                <li>
                  <Link href="/flashcards" className="hover:text-indigo-600 transition">
                    Flashcards
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Resources</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <a href="#how-it-works" className="hover:text-indigo-600 transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-indigo-600 transition">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/summaries" className="hover:text-indigo-600 transition">
                    Summaries
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Account</p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <Link href="/login" className="hover:text-indigo-600 transition">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-indigo-600 transition">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="hover:text-indigo-600 transition">
                    User Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 AI Study Buddy. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Modules 1–7 • AI Study Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
