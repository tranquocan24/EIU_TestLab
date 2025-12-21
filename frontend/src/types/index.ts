// Global type definitions for Online Exam System

export interface CourseEnrollment {
  course: {
    id: string;
    code: string;
    name: string;
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';  // Backend returns uppercase
  email?: string;
  isActive?: boolean;
  subject?: string; // For teachers
  courses?: string[]; // Array of course codes (e.g., ["CSE301", "CSE302"]) - OLD SYSTEM
  coursesEnrolled?: CourseEnrollment[]; // NEW SYSTEM - Relational courses
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

// Notification types
export enum NotificationType {
  EXAM_CREATED = 'EXAM_CREATED',
  EXAM_UPDATED = 'EXAM_UPDATED',
  EXAM_REMINDER = 'EXAM_REMINDER',
  EXAM_STARTED = 'EXAM_STARTED',
  EXAM_ENDING = 'EXAM_ENDING',
  EXAM_ENDED = 'EXAM_ENDED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TAB_SWITCH_WARNING = 'TAB_SWITCH_WARNING',
  SCREEN_SHARING_DETECTED = 'SCREEN_SHARING_DETECTED',
  COPY_PASTE_ATTEMPT = 'COPY_PASTE_ATTEMPT',
  IP_VIOLATION = 'IP_VIOLATION',
  FINGERPRINT_MISMATCH = 'FINGERPRINT_MISMATCH',
  SYSTEM = 'SYSTEM',
  GRADE_PUBLISHED = 'GRADE_PUBLISHED',
  ATTEMPT_SUBMITTED = 'ATTEMPT_SUBMITTED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  channels: NotificationChannel[];
  examId?: string;
  exam?: {
    id: string;
    title: string;
    subject: string;
  };
  attemptId?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  sentViaEmail: boolean;
  sentViaPush: boolean;
  emailSentAt?: string;
  pushSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  enableInApp: boolean;
  enableEmail: boolean;
  enablePush: boolean;
  examCreated: boolean;
  examUpdated: boolean;
  examReminder: boolean;
  examStarted: boolean;
  examEnding: boolean;
  examEnded: boolean;
  messageReceived: boolean;
  suspiciousActivity: boolean;
  tabSwitchWarning: boolean;
  screenSharingDetected: boolean;
  copyPasteAttempt: boolean;
  ipViolation: boolean;
  fingerprintMismatch: boolean;
  system: boolean;
  gradePublished: boolean;
  attemptSubmitted: boolean;
  emailDigestEnabled: boolean;
  emailDigestFrequency: 'REALTIME' | 'DAILY' | 'WEEKLY';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationQueryParams {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}