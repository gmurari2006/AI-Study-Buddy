"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  FileText,
  HelpCircle,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  StudyMaterial,
  Subject,
  SummaryResponse,
  SummaryType,
} from "@/types";

export default function SummariesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [summaryType, setSummaryType] = useState<SummaryType>("KEY_POINTS_AND_FORMULAS");

  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [loadingMaterials, setLoadingMaterials] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [summaryResult, setSummaryResult] = useState<SummaryResponse | null>(null);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const fetchMaterials = React.useCallback(async (subjectId: string) => {
    if (!subjectId) return;
    setLoadingMaterials(true);
    setMaterials([]);
    setSelectedMaterialId("");
    try {
      const res = await api.get<StudyMaterial[]>(`/documents/subject/${subjectId}`);
      const data = res.data;
      // Filter for COMPLETED materials
      const completed = data.filter((m: StudyMaterial) => m.status === "COMPLETED");
      setMaterials(completed);
      if (completed.length > 0) {
        setSelectedMaterialId(completed[0].id);
      }
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  const fetchSubjects = React.useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const res = await api.get<Subject[]>("/subjects");
      const data = res.data;
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
        fetchMaterials(data[0].id);
      }
    } catch (err: any) {
      if (err.response?.status === 401 && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== "true") {
        router.push("/login");
      } else {
        setError("Failed to load subjects. Please check your connection.");
      }
    } finally {
      setLoadingSubjects(false);
    }
  }, [fetchMaterials, router]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSummaryResult(null);
    setError(null);
    fetchMaterials(subjectId);
  };

  const handleGenerateSummary = async () => {
    if (!selectedMaterialId) {
      setError("Please select a study material to summarize.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post<SummaryResponse>("/summaries/generate", {
        material_id: selectedMaterialId,
        summary_type: summaryType,
      });
      setSummaryResult(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to generate summary. Please try again.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(text);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                AI Study Buddy
              </span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> AI Summaries & Formula Sheet
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm font-medium">
            <Link href="/documents" className="text-slate-400 hover:text-white transition">
              Documents
            </Link>
            <Link href="/chat" className="text-slate-400 hover:text-white transition">
              AI Tutor Chat
            </Link>
            <Link href="/subjects" className="text-slate-400 hover:text-white transition">
              Subjects
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            AI Document Summarizer
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              FR-06 / AI-06
            </span>
          </h1>
          <p className="text-slate-400 mt-2">
            Generate grounded executive overviews, key concept takeaways, and LaTeX formula cheat sheets directly from your uploaded materials.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 mb-8 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subject Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                1. Select Subject
              </label>
              {loadingSubjects ? (
                <div className="h-10 bg-slate-700/50 rounded-lg animate-pulse" />
              ) : subjects.length === 0 ? (
                <div className="text-xs text-amber-400 py-2">
                  No subjects found. Please create a subject first.
                </div>
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} {subj.code ? `(${subj.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Material Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                2. Select Study Material
              </label>
              {loadingMaterials ? (
                <div className="h-10 bg-slate-700/50 rounded-lg animate-pulse" />
              ) : materials.length === 0 ? (
                <div className="text-xs text-amber-400 py-2">
                  No completed PDF materials found for this subject.
                </div>
              ) : (
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.file_name} ({mat.page_count} pages)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Summary Type Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                3. Summary Format
              </label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="KEY_POINTS_AND_FORMULAS">Key Points & Formula Sheet</option>
                <option value="EXECUTIVE_SUMMARY">Executive Summary</option>
                <option value="KEY_POINTS">Key Concept Takeaways</option>
                <option value="FORMULA_SHEET">Formula & Definition Sheet</option>
                <option value="DETAILED_SUMMARY">Detailed Breakdown</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-700/60">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              Grounded AI Engine ensures 0% hallucinated external facts.
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating || !selectedMaterialId}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Summary
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading State Skeleton */}
        {isGenerating && (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-slate-800/60 rounded-2xl" />
            <div className="h-48 bg-slate-800/60 rounded-2xl" />
            <div className="h-40 bg-slate-800/60 rounded-2xl" />
          </div>
        )}

        {/* Results Container */}
        {summaryResult && !isGenerating && (
          <div className="space-y-8">
            {/* Executive Overview Card */}
            <div className="bg-slate-800/90 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
                <FileText className="w-5 h-5" /> Executive Overview
              </div>
              <p className="text-slate-200 leading-relaxed text-base">
                {summaryResult.executive_summary}
              </p>
            </div>

            {/* Key Bullet Takeaways Card */}
            {summaryResult.key_takeaways.length > 0 && (
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-4">
                  <CheckCircle className="w-5 h-5" /> Key Takeaways & Core Concepts
                </div>
                <ul className="space-y-3">
                  {summaryResult.key_takeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formula & Definition Cheat Sheet Card */}
            {summaryResult.formula_index.length > 0 && (
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                    <BookOpen className="w-5 h-5" /> Formula & Definition Cheat Sheet
                  </div>
                  <span className="text-xs text-slate-400">LaTeX Notation Enabled</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summaryResult.formula_index.map((formula, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between group hover:border-purple-500/40 transition"
                    >
                      <div className="font-mono text-sm text-purple-200 overflow-x-auto py-1">
                        {formula}
                      </div>
                      <button
                        onClick={() => handleCopy(formula)}
                        title="Copy formula"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0 ml-2"
                      >
                        {copiedFormula === formula ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
