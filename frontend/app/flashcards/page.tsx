"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import {
  FlashcardDeckResponse,
  FlashcardDeckSummaryResponse,
  FlashcardDifficulty,
  FlashcardItem,
  Subject,
} from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers,
  Loader2,
  RotateCw,
  Sparkles,
  ThumbsUp,
  Zap,
} from "lucide-react";

export default function FlashcardsPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const [decks, setDecks] = useState<FlashcardDeckSummaryResponse[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeckResponse | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(true);
  const [isLoadingDecks, setIsLoadingDecks] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const isDevAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
    if (!isAuthenticated && !isDevAuthBypass) {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, router]);

  // Fetch user subjects
  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    setError(null);
    try {
      const response = await api.get<Subject[]>("/subjects");
      setSubjects(response.data);
      if (response.data.length > 0) {
        setSelectedSubjectId(response.data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load subjects");
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubjects();
    }
  }, [isAuthenticated, fetchSubjects]);

  // Fetch decks for selected subject
  const fetchDecks = useCallback(async (subjId: string) => {
    if (!subjId) return;
    setIsLoadingDecks(true);
    setError(null);
    try {
      const response = await api.get<FlashcardDeckSummaryResponse[]>(
        `/flashcards/subject/${subjId}`
      );
      setDecks(response.data);
      if (response.data.length > 0 && !activeDeck) {
        loadDeck(response.data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load flashcard decks");
    } finally {
      setIsLoadingDecks(false);
    }
  }, [activeDeck]);

  useEffect(() => {
    if (selectedSubjectId) {
      setActiveDeck(null);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      fetchDecks(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchDecks]);

  // Load a specific deck
  const loadDeck = async (deckId: string) => {
    setError(null);
    try {
      const response = await api.get<FlashcardDeckResponse>(`/flashcards/deck/${deckId}`);
      setActiveDeck(response.data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load flashcard deck");
    }
  };

  // Generate a new deck
  const handleGenerateDeck = async () => {
    if (!selectedSubjectId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.post<FlashcardDeckResponse>("/flashcards/generate", {
        subject_id: selectedSubjectId,
        total_cards: 5,
      });
      setActiveDeck(response.data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      // Refresh deck list
      fetchDecks(selectedSubjectId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate flashcard deck");
    } finally {
      setIsGenerating(false);
    }
  };

  // Self-grade card review
  const handleReviewCard = async (rating: FlashcardDifficulty) => {
    if (!activeDeck || !activeDeck.cards[currentCardIndex]) return;
    const currentCard = activeDeck.cards[currentCardIndex];
    setIsSubmittingReview(true);
    try {
      const response = await api.post<FlashcardItem>(
        `/flashcards/card/${currentCard.id}/review`,
        { difficulty_rating: rating }
      );
      // Update local card state
      const updatedCards = [...activeDeck.cards];
      updatedCards[currentCardIndex] = response.data;
      setActiveDeck({
        ...activeDeck,
        cards: updatedCards,
      });

      // Automatically flip and advance to next card after grading
      setIsFlipped(false);
      if (currentCardIndex < activeDeck.cards.length - 1) {
        setTimeout(() => {
          setCurrentCardIndex((prev) => prev + 1);
        }, 150);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to log review rating");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Navigation handlers
  const handleNextCard = () => {
    if (activeDeck && currentCardIndex < activeDeck.cards.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleResetDeck = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (isFlipped && e.key === "1") {
        e.preventDefault();
        handleReviewCard("EASY");
      } else if (isFlipped && e.key === "2") {
        e.preventDefault();
        handleReviewCard("MEDIUM");
      } else if (isFlipped && e.key === "3") {
        e.preventDefault();
        handleReviewCard("HARD");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeck, currentCardIndex, isFlipped]);

  const currentCard = activeDeck?.cards[currentCardIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <Brain className="w-7 h-7 text-purple-400" />
            <span>AI Flashcard Engine</span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Link
            href="/documents"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Materials</span>
          </Link>
          <Link
            href="/quizzes"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Quizzes</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto p-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar: Subject Selector & Deck List */}
        <aside className="w-full md:w-80 flex flex-col gap-6">
          {/* Subject Selector Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <GraduationCap className="w-4 h-4" />
              <span>Select Study Subject</span>
            </div>

            {isLoadingSubjects ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No subjects found. Please create a subject first.
              </div>
            ) : (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleGenerateDeck}
              disabled={isGenerating || !selectedSubjectId}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting Flashcards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate New Deck</span>
                </>
              )}
            </button>
          </div>

          {/* Saved Decks Drawer */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Saved Decks</span>
              </div>
              <span className="text-xs text-slate-500">{decks.length} Decks</span>
            </div>

            {isLoadingDecks ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No flashcard decks generated yet for this subject.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
                {decks.map((deck) => {
                  const isActive = activeDeck?.deck_id === deck.id;
                  return (
                    <button
                      key={deck.id}
                      onClick={() => loadDeck(deck.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition flex justify-between items-center ${
                        isActive
                          ? "bg-purple-950/60 border-purple-600/80 text-white font-semibold"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-medium">{deck.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-purple-300">
                        {deck.card_count} cards
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area: Flashcard Flip Review */}
        <main className="flex-1 flex flex-col justify-between">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium mb-4 flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {!activeDeck ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 border-dashed">
              <Brain className="w-16 h-16 text-purple-500/40 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-white mb-2">No Active Flashcard Deck</h3>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                Select a subject and click <strong>Generate New Deck</strong> to extract 5 active recall concept pairs from your uploaded study materials.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 justify-between">
              {/* Deck Header & Progress */}
              <div className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">{activeDeck.title}</h2>
                  <p className="text-xs text-slate-400">
                    Card {currentCardIndex + 1} of {activeDeck.cards.length}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                      style={{
                        width: `${((currentCardIndex + 1) / activeDeck.cards.length) * 100}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={handleResetDeck}
                    title="Reset Deck to Card 1"
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[320px] h-80 cursor-pointer relative group perspective-1000"
              >
                <div
                  className={`w-full h-full duration-500 rounded-3xl p-8 border shadow-2xl transition-transform transform-style-3d flex flex-col justify-between ${
                    isFlipped
                      ? "bg-slate-900/95 border-emerald-600/60 shadow-emerald-950/40 rotate-y-180"
                      : "bg-slate-900/90 border-indigo-600/60 shadow-indigo-950/40"
                  }`}
                >
                  {!isFlipped ? (
                    /* Front Side (Question / Term) */
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800/80 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                          Front • Prompt / Question
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          Click card or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px]">Space</kbd> to flip
                        </span>
                      </div>

                      <div className="my-auto py-4 text-center">
                        <p className="text-xl md:text-2xl font-bold text-slate-100 leading-relaxed max-w-xl mx-auto">
                          {currentCard?.front_text}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Difficulty: <strong className="text-indigo-400">{currentCard?.difficulty_rating}</strong></span>
                        <span className="flex items-center gap-1 text-purple-400 font-medium">
                          Flip Answer <RotateCw className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Back Side (Answer / Concept) */
                    <div className="flex-1 flex flex-col justify-between rotate-y-180">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                          Back • Answer / Concept
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Select self-grade rating below
                        </span>
                      </div>

                      <div className="my-auto py-4 text-center">
                        <p className="text-lg md:text-xl font-medium text-emerald-200 leading-relaxed max-w-xl mx-auto">
                          {currentCard?.back_text}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Rate Recall Difficulty</span>
                        <span className="text-emerald-400 font-medium">Self-Grade Below</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls & Self-Grade Rating */}
              <div className="space-y-4">
                {isFlipped ? (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-center text-slate-400 mb-2">
                      How well did you recall this answer?
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleReviewCard("EASY")}
                        disabled={isSubmittingReview}
                        className="py-3 px-4 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <ThumbsUp className="w-4 h-4 text-emerald-400" />
                        <span>1. Easy</span>
                      </button>
                      <button
                        onClick={() => handleReviewCard("MEDIUM")}
                        disabled={isSubmittingReview}
                        className="py-3 px-4 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>2. Medium</span>
                      </button>
                      <button
                        onClick={() => handleReviewCard("HARD")}
                        disabled={isSubmittingReview}
                        className="py-3 px-4 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <RotateCw className="w-4 h-4 text-rose-400" />
                        <span>3. Hard</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center gap-4">
                    <button
                      onClick={handlePrevCard}
                      disabled={currentCardIndex === 0}
                      className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous Card</span>
                    </button>

                    <span className="text-xs text-slate-500 font-medium">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">Space</kbd> to Flip
                    </span>

                    <button
                      onClick={handleNextCard}
                      disabled={currentCardIndex === activeDeck.cards.length - 1}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
                    >
                      <span>Next Card</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
