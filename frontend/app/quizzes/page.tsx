"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  QuestionAnswerSubmission,
  QuizResponse,
  QuizSubmitResponse,
  QuizSummaryResponse,
  Subject,
} from "@/types";

export default function QuizzesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");

  const [quizzesList, setQuizzesList] = useState<QuizSummaryResponse[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizResponse | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzesList = useCallback(async (subjectId: string) => {
    if (!subjectId) return;
    setLoadingQuizzes(true);
    try {
      const res = await api.get<QuizSummaryResponse[]>(`/quizzes/subject/${subjectId}`);
      setQuizzesList(res.data);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const res = await api.get<Subject[]>("/subjects");
      const data = res.data;
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
        fetchQuizzesList(data[0].id);
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
  }, [fetchQuizzesList, router]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveQuiz(null);
    setQuizResult(null);
    setError(null);
    fetchQuizzesList(subjectId);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedSubjectId) {
      setError("Please select a subject to generate a quiz.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setActiveQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);

    try {
      const res = await api.post<QuizResponse>("/quizzes/generate", {
        subject_id: selectedSubjectId,
        total_questions: 5,
        topic_filter: topicFilter || undefined,
      });
      setActiveQuiz(res.data);
      fetchQuizzesList(selectedSubjectId);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to generate quiz. Please try again.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectQuiz = async (quizId: string) => {
    setIsGenerating(true);
    setError(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);

    try {
      const res = await api.get<QuizResponse>(`/quizzes/${quizId}`);
      setActiveQuiz(res.data);
    } catch (err: any) {
      setError("Failed to fetch target quiz details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Build payload
    const submissionAnswers: QuestionAnswerSubmission[] = activeQuiz.questions.map((q) => ({
      question_id: q.id,
      selected_option_index: selectedAnswers[q.id] ?? 0,
    }));

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post<QuizSubmitResponse>(`/quizzes/${activeQuiz.quiz_id}/submit`, {
        answers: submissionAnswers,
      });
      setQuizResult(res.data);
    } catch (err: any) {
      setError("Failed to submit quiz attempt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header Navigation */}
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
            <span className="text-sm font-semibold text-purple-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Practice Quizzes
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm font-medium">
            <Link href="/documents" className="text-slate-400 hover:text-white transition">
              Documents
            </Link>
            <Link href="/chat" className="text-slate-400 hover:text-white transition">
              AI Tutor Chat
            </Link>
            <Link href="/summaries" className="text-slate-400 hover:text-white transition">
              Summaries
            </Link>
            <Link href="/subjects" className="text-slate-400 hover:text-white transition">
              Subjects
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            AI MCQ Quiz Engine
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              FR-07 / AI-04
            </span>
          </h1>
          <p className="text-slate-400 mt-2">
            Auto-generate grounded 5-question multiple-choice practice quizzes directly from your course materials and track your scores.
          </p>
        </div>

        {/* Generator & Subject Config Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                1. Select Subject
              </label>
              {loadingSubjects ? (
                <div className="h-10 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                2. Topic Filter (Optional)
              </label>
              <input
                type="text"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                placeholder="e.g. Relational Algebra"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || !selectedSubjectId}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold text-white shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate 5-Question Quiz
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Past Quizzes List Bar */}
          {quizzesList.length > 0 && !activeQuiz && !quizResult && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-400" /> Recent Quizzes for Subject
              </div>
              <div className="flex flex-wrap gap-2">
                {quizzesList.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuiz(q.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-2 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    {q.title} ({q.total_questions} MCQs)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Active Quiz Taking Interface */}
        {activeQuiz && !quizResult && (
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-sm text-slate-400 border-b border-slate-800 pb-4">
              <div className="font-semibold text-purple-400">
                {activeQuiz.title}
              </div>
              <div className="text-xs font-mono bg-purple-500/10 px-3 py-1 rounded-full text-purple-300 border border-purple-500/20">
                Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
              </div>
            </div>

            {/* Question Display */}
            {(() => {
              const q = activeQuiz.questions[currentQuestionIdx];
              const selectedIdx = selectedAnswers[q.id];
              return (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white leading-relaxed">
                      {currentQuestionIdx + 1}. {q.question_text}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 shrink-0 font-mono">
                      {q.topic_tag}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((optText, optIdx) => {
                      const isSelected = selectedIdx === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(q.id, optIdx)}
                          className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                              : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-purple-600 text-white"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span className="text-sm">{optText}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <button
                      onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                      disabled={currentQuestionIdx === 0}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium disabled:opacity-40 transition flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx((p) => Math.min(activeQuiz.questions.length - 1, p + 1))}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Submit Quiz Answers
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Quiz Results Panel */}
        {quizResult && (
          <div className="space-y-8">
            {/* Score Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden shadow-2xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white">
                  Score: {quizResult.score_achieved} / {quizResult.total_score} ({quizResult.percentage_score}%)
                </h2>
                <p className="text-slate-300 mt-2 font-medium max-w-xl mx-auto">
                  {quizResult.feedback}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setQuizResult(null);
                    setCurrentQuestionIdx(0);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" /> Generate New Quiz
                </button>
              </div>
            </div>

            {/* Question Results Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Detailed Question Breakdown</h3>

              {quizResult.question_results.map((resItem, idx) => (
                <div
                  key={resItem.question_id}
                  className={`p-6 rounded-2xl border ${
                    resItem.is_correct
                      ? "bg-slate-900/90 border-emerald-500/30"
                      : "bg-slate-900/90 border-red-500/30"
                  } shadow-lg space-y-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {resItem.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      <h4 className="font-semibold text-white text-base">
                        {idx + 1}. {resItem.question_text}
                      </h4>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">
                      {resItem.topic_tag}
                    </span>
                  </div>

                  {/* Options List with status formatting */}
                  <div className="grid grid-cols-1 gap-2 pl-7">
                    {resItem.options.map((optText, optIdx) => {
                      const isUserSelection = resItem.selected_option_index === optIdx;
                      const isCorrectAnswer = resItem.correct_option_index === optIdx;

                      let itemStyle = "bg-slate-950/60 border-slate-800 text-slate-400";
                      if (isCorrectAnswer) {
                        itemStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium";
                      } else if (isUserSelection && !resItem.is_correct) {
                        itemStyle = "bg-red-500/10 border-red-500/40 text-red-300 line-through";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-between ${itemStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span>{optText}</span>
                          </div>
                          {isCorrectAnswer && (
                            <span className="text-xs font-semibold text-emerald-400">
                              Correct Answer
                            </span>
                          )}
                          {isUserSelection && !isCorrectAnswer && (
                            <span className="text-xs font-semibold text-red-400">
                              Your Selection
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Card */}
                  <div className="ml-7 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-purple-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Explanation
                    </div>
                    <p className="leading-relaxed">{resItem.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
