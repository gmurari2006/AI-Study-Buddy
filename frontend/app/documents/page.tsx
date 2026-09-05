"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DocumentChunk,
  DocumentStatusResponse,
  DocumentUploadResponse,
  StudyMaterial,
  Subject,
} from "@/types";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";

export default function DocumentsPage() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Chunk Modal state
  const [inspectMaterial, setInspectMaterial] = useState<StudyMaterial | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // Delete modal state
  const [deletingMaterial, setDeletingMaterial] = useState<StudyMaterial | null>(null);

  const fetchSubjects = React.useCallback(async () => {
    try {
      const res = await api.get<Subject[]>("/subjects");
      setSubjects(res.data);
      if (res.data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(res.data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load subjects.");
    }
  }, [selectedSubjectId]);

  const fetchMaterials = async (subjectId: string) => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<StudyMaterial[]>(`/documents/subject/${subjectId}`);
      setMaterials(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load study materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchMaterials(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files (.pdf) are allowed.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError("File size exceeds maximum limit of 15MB.");
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a PDF file to upload.");
      return;
    }
    if (!selectedSubjectId) {
      setError("Please select a subject.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("subject_id", selectedSubjectId);
    formData.append("file", selectedFile);

    try {
      const res = await api.post<DocumentUploadResponse>("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg(`File "${res.data.file_name}" uploaded successfully! Status: ${res.data.status}`);
      setSelectedFile(null);
      await fetchMaterials(selectedSubjectId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const openInspectChunks = async (material: StudyMaterial) => {
    setInspectMaterial(material);
    setChunksLoading(true);
    try {
      const res = await api.get<DocumentChunk[]>(`/documents/${material.id}/chunks`);
      setChunks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load document chunks.");
    } finally {
      setChunksLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deletingMaterial) return;
    try {
      await api.delete(`/documents/${deletingMaterial.id}`);
      setSuccessMsg("Document deleted successfully!");
      setDeletingMaterial(null);
      await fetchMaterials(selectedSubjectId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete document.");
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
              href="/subjects"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Subjects</span>
            </Link>
            <Link
              href="/profile"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>{user?.full_name || "Profile"}</span>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="w-full max-w-5xl space-y-6">
          {/* Header Card & Subject Selection */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-400" />
                <h1 className="text-2xl font-extrabold text-white">Study Material Ingestion</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Upload course PDFs for text extraction, chunking, and 768-dim vector embeddings
              </p>
            </div>

            {/* Subject Selector */}
            <div className="w-full sm:w-auto">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.length === 0 ? (
                  <option value="">No Subjects Created</option>
                ) : (
                  subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || "No Code"})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Feedback Messages */}
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
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Upload PDF Study Material
            </h2>

            {subjects.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex justify-between items-center">
                <span>Please create a subject first before uploading study materials.</span>
                <Link href="/subjects" className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] transition">
                  Create Subject
                </Link>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer transition">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload-input"
                  />
                  <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-2 block">
                    <FileText className="w-10 h-10 text-indigo-400 mx-auto opacity-80" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {selectedFile ? selectedFile.name : "Click or drag & drop PDF file here"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedFile
                          ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                          : "Supports PDF format (Max 15MB)"}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{uploading ? "Ingesting & Embedding..." : "Start Ingestion"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Uploaded Materials List */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Ingested Documents for Subject
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading documents...</span>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No materials ingested for this subject yet. Upload a PDF above to begin.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {materials.map((mat) => (
                  <div key={mat.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-white">{mat.file_name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mat.status === "COMPLETED"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                              : mat.status === "FAILED"
                              ? "bg-red-950 text-red-300 border border-red-800/50"
                              : "bg-amber-950 text-amber-300 border border-amber-800/50"
                          }`}
                        >
                          {mat.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {(mat.file_size_bytes / 1024).toFixed(1)} KB • {mat.page_count} Pages • Uploaded {new Date(mat.created_at).toLocaleDateString()}
                      </p>
                      {mat.error_message && (
                        <p className="text-xs text-red-400 font-mono mt-1">{mat.error_message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openInspectChunks(mat)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Chunks</span>
                      </button>
                      <button
                        onClick={() => setDeletingMaterial(mat)}
                        className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chunks Inspection Modal */}
        {inspectMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Parsed Chunks: {inspectMaterial.file_name}
                  </h3>
                  <p className="text-xs text-slate-400">500-char recursive split with 768-dim embeddings</p>
                </div>
                <button onClick={() => setInspectMaterial(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                {chunksLoading ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-400">Loading chunks...</span>
                  </div>
                ) : chunks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">No chunks generated.</div>
                ) : (
                  chunks.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                      <div className="flex justify-between text-[11px] font-mono text-indigo-400">
                        <span>Chunk #{c.chunk_index}</span>
                        <span>Page #{c.page_number}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                        {c.chunk_text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-center">
              <div className="inline-flex p-3 rounded-full bg-red-950/60 border border-red-800/60 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Study Material?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-white">{deletingMaterial.file_name}</span>? All associated text chunks and vector embeddings will be permanently removed.
              </p>

              <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingMaterial(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMaterial}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
