// API client for Online Exam System
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Exam,
  Question,
  ExamSubmission,
  Class,
  LoginForm,
  ExamForm,
  QuestionForm
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/auth/login', credentials);

    // NestJS returns { user, access_token }, transform to expected format
    return {
      success: true,
      data: {
        user: response.data.user,
        token: response.data.access_token,
      },
      message: 'Login successful',
    };
  }

  async logout(): Promise<ApiResponse<null>> {
    // JWT is stateless, just clear token on client side
    // No need to call backend API
    return {
      success: true,
      data: null,
      message: 'Đăng xuất thành công'
    };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get('/auth/me');
    return response.data;
  }

  // User endpoints
  async getUsers(params?: { page?: number; limit?: number; role?: string }): Promise<User[]> {
    const response: AxiosResponse<User[]> =
      await this.client.get('/users', { params });
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: Partial<User> & { password?: string }): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> =
      await this.client.post('/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> =
      await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // Class endpoints
  async getClasses(): Promise<ApiResponse<Class[]>> {
    const response: AxiosResponse<ApiResponse<Class[]>> = await this.client.get('/classes');
    return response.data;
  }

  async getClassById(id: string): Promise<ApiResponse<Class>> {
    const response: AxiosResponse<ApiResponse<Class>> = await this.client.get(`/classes/${id}`);
    return response.data;
  }

  // Exam endpoints
  async getExams(params?: { page?: number; limit?: number; subject?: string }): Promise<any[]> {
    const response: AxiosResponse<any[]> =
      await this.client.get('/exams', { params });
    return response.data;
  }

  async getExamById(id: string): Promise<ApiResponse<Exam>> {
    const response: AxiosResponse<ApiResponse<Exam>> = await this.client.get(`/exams/${id}`);
    return response.data;
  }

  async createExam(examData: ExamForm): Promise<ApiResponse<Exam>> {
    const response: AxiosResponse<ApiResponse<Exam>> =
      await this.client.post('/exams', examData);
    return response.data;
  }

  async updateExam(id: string, examData: Partial<ExamForm>): Promise<ApiResponse<Exam>> {
    const response: AxiosResponse<ApiResponse<Exam>> =
      await this.client.put(`/exams/${id}`, examData);
    return response.data;
  }

  async deleteExam(id: string): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> = await this.client.delete(`/exams/${id}`);
    return response.data;
  }

  // Question endpoints
  async getQuestions(examId: string): Promise<ApiResponse<Question[]>> {
    const response: AxiosResponse<ApiResponse<Question[]>> =
      await this.client.get(`/exams/${examId}/questions`);
    return response.data;
  }

  async createQuestion(examId: string, questionData: QuestionForm): Promise<ApiResponse<Question>> {
    const response: AxiosResponse<ApiResponse<Question>> =
      await this.client.post(`/exams/${examId}/questions`, questionData);
    return response.data;
  }

  async updateQuestion(examId: string, questionId: string, questionData: Partial<QuestionForm>): Promise<ApiResponse<Question>> {
    const response: AxiosResponse<ApiResponse<Question>> =
      await this.client.put(`/exams/${examId}/questions/${questionId}`, questionData);
    return response.data;
  }

  async deleteQuestion(examId: string, questionId: string): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> =
      await this.client.delete(`/exams/${examId}/questions/${questionId}`);
    return response.data;
  }

  // Exam submission endpoints
  async startExam(examId: string): Promise<ApiResponse<ExamSubmission>> {
    const response: AxiosResponse<ApiResponse<ExamSubmission>> =
      await this.client.post(`/exams/${examId}/start`);
    return response.data;
  }

  async submitExam(submissionId: string, answers: Record<string, any>): Promise<ApiResponse<ExamSubmission>> {
    const response: AxiosResponse<ApiResponse<ExamSubmission>> =
      await this.client.post(`/submissions/${submissionId}/submit`, { answers });
    return response.data;
  }

  async getSubmission(submissionId: string): Promise<ApiResponse<ExamSubmission>> {
    const response: AxiosResponse<ApiResponse<ExamSubmission>> =
      await this.client.get(`/submissions/${submissionId}`);
    return response.data;
  }

  async getSubmissions(params?: {
    examId?: string;
    userId?: string;
    page?: number;
    limit?: number
  }): Promise<PaginatedResponse<ExamSubmission>> {
    const response: AxiosResponse<PaginatedResponse<ExamSubmission>> =
      await this.client.get('/submissions', { params });
    return response.data;
  }

  // Dashboard/Stats endpoints
  async getDashboardStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/dashboard/stats');
    return response.data;
  }

  async getExamStats(examId: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.client.get(`/dashboard/exams/${examId}/stats`);
    return response.data;
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;