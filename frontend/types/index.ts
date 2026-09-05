export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  academic_year?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  academic_year?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface UserProfileUpdateRequest {
  full_name?: string;
  academic_year?: string;
}

export interface MessageResponse {
  message: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code?: string | null;
  color_code?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface SubjectCreateRequest {
  name: string;
  code?: string;
  color_code?: string;
}

export interface SubjectUpdateRequest {
  name?: string;
  code?: string;
  color_code?: string;
}

export interface StudyMaterial {
  id: string;
  subject_id: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  page_count: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error_message?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentUploadResponse {
  material_id: string;
  file_name: string;
  status: string;
  message: string;
}

export interface DocumentStatusResponse {
  material_id: string;
  status: string;
  page_count: number;
  chunks_created: number;
  error_message?: string | null;
}

export interface DocumentChunk {
  id: string;
  material_id: string;
  subject_id: string;
  chunk_index: number;
  chunk_text: string;
  page_number: number;
  created_at: string;
}

export type SummaryType =
  | "KEY_POINTS_AND_FORMULAS"
  | "EXECUTIVE_SUMMARY"
  | "KEY_POINTS"
  | "FORMULA_SHEET"
  | "DETAILED_SUMMARY";

export interface SummaryGenerateRequest {
  material_id: string;
  summary_type?: SummaryType;
}

export interface SummaryResponse {
  material_id: string;
  summary_type: SummaryType;
  executive_summary: string;
  key_takeaways: string[];
  formula_index: string[];
}

export interface QuizGenerateRequest {
  subject_id: string;
  total_questions?: number;
  topic_filter?: string;
}

export interface QuizQuestionItem {
  id: string;
  question_text: string;
  options: string[];
  topic_tag: string;
}

export interface QuizResponse {
  quiz_id: string;
  title: string;
  total_questions: number;
  questions: QuizQuestionItem[];
  created_at: string;
}

export interface QuizSummaryResponse {
  id: string;
  subject_id: string;
  title: string;
  total_questions: number;
  created_at: string;
}

export interface QuestionAnswerSubmission {
  question_id: string;
  selected_option_index: number;
}

export interface QuizSubmitRequest {
  answers: QuestionAnswerSubmission[];
}

export interface QuestionResultItem {
  question_id: string;
  question_text: string;
  options: string[];
  selected_option_index: number;
  correct_option_index: number;
  is_correct: boolean;
  explanation: string;
  topic_tag: string;
}

export interface QuizSubmitResponse {
  quiz_id: string;
  score_achieved: number;
  total_score: number;
  percentage_score: number;
  feedback: string;
  question_results: QuestionResultItem[];
}

export type FlashcardDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface FlashcardGenerateRequest {
  subject_id: string;
  material_id?: string;
  total_cards?: number;
}

export interface FlashcardItem {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  difficulty_rating: FlashcardDifficulty;
  last_reviewed_at?: string | null;
}

export interface FlashcardDeckResponse {
  deck_id: string;
  title: string;
  subject_id: string;
  card_count: number;
  created_at: string;
  cards: FlashcardItem[];
}

export interface FlashcardDeckSummaryResponse {
  id: string;
  subject_id: string;
  title: string;
  card_count: number;
  created_at: string;
}

export interface FlashcardReviewRequest {
  difficulty_rating: FlashcardDifficulty;
}



