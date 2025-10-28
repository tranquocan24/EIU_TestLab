// Global type definitions for Online Exam System
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';  // Backend returns uppercase
  email?: string;
  isActive?: boolean;
  subject?: string; // For teachers
  createdAt: string;
  updatedAt?: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description?: string;
  duration: number; // in minutes
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  allowReview: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  allowedClasses: string[];
  questions?: Question[];
}

export interface Question {
  id: string;
  examId: string;
  questionOrder: number;
  questionType: 'multiple-choice' | 'multiple-select' | 'text';
  questionText: string;
  points: number;
  explanation?: string;
  correctAnswer: any; // JSON value
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionOrder: number;
  optionText: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number; // in seconds
  isTimeUp: boolean;
  totalScore?: number;
  totalPoints?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answers?: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  answerValue?: any; // JSON value
  isCorrect?: boolean;
  pointsEarned: number;
}

export interface LoginHistory {
  id: string;
  userId: string;
  loginTime: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface ExamForm {
  title: string;
  subject: string;
  description?: string;
  duration: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  allowReview: boolean;
  allowedClasses: string[];
}

export interface QuestionForm {
  questionType: 'multiple-choice' | 'multiple-select' | 'text';
  questionText: string;
  points: number;
  explanation?: string;
  options?: string[];
  correctAnswer: any;
}

// Socket.IO event types
export interface SocketEvents {
  // Client to server
  'exam:start': { examId: string; userId: string };
  'exam:submit': { submissionId: string; answers: Record<string, any> };
  'exam:heartbeat': { submissionId: string };

  // Server to client
  'exam:started': { submissionId: string };
  'exam:time-warning': { timeLeft: number };
  'exam:force-submit': { reason: string };
  'exam:submitted': { submissionId: string; score?: number };
}

// Store types (Zustand)
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

export interface ExamState {
  currentExam: Exam | null;
  currentSubmission: ExamSubmission | null;
  timeLeft: number;
  isSubmitting: boolean;
  startExam: (examId: string) => Promise<void>;
  submitExam: (answers: Record<string, any>) => Promise<void>;
  updateTimeLeft: (time: number) => void;
  resetExam: () => void;
}