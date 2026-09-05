"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Subject, SubjectCreateRequest, SubjectUpdateRequest } from "@/types";
import {
  BookOpen,
  CheckCircle2,
  Edit2,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";

const PRESET_COLORS = [
  "#4F46E5", // Indigo
  "#0EA5E9", // Sky
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate
];

export default function SubjectsPage() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createColor, setCreateColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  // Delete Modal state
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Subject[]>("/subjects");
      setSubjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setError("Subject name cannot be empty.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: SubjectCreateRequest = {
        name: createName.trim(),
        code: createCode.trim() || undefined,
        color_code: createColor,
      };
      await api.post<Subject>("/subjects", payload);
      setSuccessMsg("Subject created successfully!");
      setIsCreateOpen(false);
      setCreateName("");
      setCreateCode("");
      setCreateColor(PRESET_COLORS[0]);
      await fetchSubjects();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create subject.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
    setEditCode(subject.code || "");
    setEditColor(subject.color_code || PRESET_COLORS[0]);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!editName.trim()) {
      setError("Subject name cannot be empty.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: SubjectUpdateRequest = {
        name: editName.trim(),
        code: editCode.trim() || undefined,
        color_code: editColor,
      };
      await api.put<Subject>(`/subjects/${editingSubject.id}`, payload);
      setSuccessMsg("Subject updated successfully!");
      setEditingSubject(null);
      await fetchSubjects();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update subject.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/subjects/${deletingSubject.id}`);
      setSuccessMsg("Subject deleted successfully!");
      setDeletingSubject(null);
      await fetchSubjects();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete subject.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
        {/* Top Header */}
        <header className="w-full max-w-5xl flex justify-between items-center py-4 px-6 mb-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 font-bold text-lg hover:text-indigo-300 transition">
            <GraduationCap className="w-6 h-6" />
            <span>AI Study Buddy</span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/profile"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>{user?.full_name || "Profile"}</span>
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="w-full max-w-5xl space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                <h1 className="text-2xl font-extrabold text-white">Subject Management</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Organize your academic courses, subjects, and study modules
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Subjects Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading your subjects...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-4">
              <div className="inline-flex p-4 rounded-full bg-slate-800/60 text-slate-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">No Subjects Added Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first subject (e.g. Operating Systems, Data Structures) to start organizing your study materials.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Subject</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  className="group relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-lg backdrop-blur-sm flex flex-col justify-between transition duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: subj.color_code || "#4F46E5" }}
                      >
                        {subj.code || "SUBJECT"}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEditModal(subj)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingSubject(subj)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition">
                      {subj.name}
                    </h3>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Created: {new Date(subj.created_at).toLocaleDateString()}</span>
                    <span className="font-mono text-[10px] text-slate-600">{subj.id.substring(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Subject Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Add New Subject
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-301"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Color Tag</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCreateColor(color)}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          createColor === color ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Create Subject</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subject Modal */}
        {editingSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-400" />
                  Edit Subject
                </h3>
                <button
                  onClick={() => setEditingSubject(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Color Tag</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          editColor === color ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Subject Confirmation Modal */}
        {deletingSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-center">
              <div className="inline-flex p-3 rounded-full bg-red-950/60 border border-red-800/60 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Subject?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-white">{deletingSubject.name}</span>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingSubject(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubject}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
