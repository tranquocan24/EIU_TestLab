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
  QuestionForm,
  Notification,
  NotificationPreference,
  NotificationStats,
  NotificationQueryParams,
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
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 401) {
          console.warn('Unauthorized - Redirecting to login');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }

        // Enhance error message
        if (error.response?.data?.message) {
          error.message = error.response.data.message;
        } else if (error.response?.status) {
          const statusMessages: { [key: number]: string } = {
            400: 'Yêu cầu không hợp lệ',
            401: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại',
            403: 'Bạn không có quyền thực hiện thao tác này',
            404: 'Không tìm thấy tài nguyên',
            500: 'Lỗi máy chủ nội bộ',
          };
          error.message = statusMessages[error.response.status] || `Lỗi ${error.response.status}`;
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

  async importUsers(users: Array<{
    username: string;
    password: string;
    name: string;
    email?: string;
    role: string;
    courses?: string;
  }>): Promise<{ success: number; failed: number; errors: string[] }> {
    const response: AxiosResponse<{ success: number; failed: number; errors: string[] }> =
      await this.client.post('/users/import', { users });
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

  async getExamById(id: string): Promise<any> {
    const response = await this.client.get(`/exams/${id}`);
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
    try {
      const response: AxiosResponse<ApiResponse<null>> = await this.client.delete(`/exams/${id}`);
      console.log('Delete exam response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Delete exam error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async importMarkdownExam(markdownContent: string): Promise<any> {
    const response = await this.client.post('/exams/import-markdown', { 
      markdownContent 
    });
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
  async startExam(examId: string): Promise<any> {
    const response = await this.client.post('/attempts/start', { examId });
    return response.data;
  }

  async submitAnswer(attemptId: string, questionId: string, selectedOption: string, answerText?: string): Promise<any> {
    const response = await this.client.put(`/attempts/${attemptId}/answer`, {
      questionId,
      selectedOption: selectedOption || undefined,
      answerText: answerText || undefined
    });
    return response.data;
  }

  async submitAttempt(attemptId: string, timeSpent: number): Promise<any> {
    const response = await this.client.put(`/attempts/${attemptId}/submit`, {
      timeSpent
    });
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

  // Attempts endpoints
  async getMyAttempts(): Promise<any[]> {
    const response = await this.client.get('/attempts/my-attempts');
    return response.data;
  }

  async getAttemptDetail(attemptId: string): Promise<any> {
    const response = await this.client.get(`/attempts/${attemptId}`);
    return response.data;
  }

  async getExamAttempts(examId: string): Promise<any[]> {
    const response = await this.client.get(`/attempts/exam/${examId}`);
    return response.data;
  }

  // Essay grading endpoints (for teachers)
  async getAttemptsNeedingGrading(): Promise<any[]> {
    const response = await this.client.get('/attempts/grading/pending');
    return response.data;
  }

  async gradeEssayAnswer(attemptId: string, questionId: string, points: number): Promise<any> {
    const response = await this.client.put(`/attempts/${attemptId}/grade/${questionId}`, {
      points
    });
    return response.data;
  }

  // Dashboard/Stats endpoints
  async getDashboardStats(): Promise<any> {
    const response = await this.client.get('/stats/dashboard');
    return response.data;
  }

  async getLoginStats(days: number = 7): Promise<Array<{ date: string; logins: number }>> {
    const response = await this.client.get('/stats/login-history', { params: { days } });
    return response.data;
  }

  async getExamStatsBySubject(): Promise<Array<{
    subject: string;
    totalExams: number;
    totalSubmissions: number;
    averageScore: number;
  }>> {
    const response = await this.client.get('/stats/exams');
    return response.data;
  }

  async getExamStats(examId: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.client.get(`/dashboard/exams/${examId}/stats`);
    return response.data;
  }

  // Notification endpoints
  async getNotifications(params?: NotificationQueryParams): Promise<PaginatedResponse<Notification>> {
    const response: AxiosResponse<PaginatedResponse<Notification>> =
      await this.client.get('/notifications', { params });
    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response: AxiosResponse<number> =
      await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async getNotificationStats(): Promise<NotificationStats> {
    const response: AxiosResponse<NotificationStats> =
      await this.client.get('/notifications/stats');
    return response.data;
  }

  async markNotificationsAsRead(notificationIds?: string[]): Promise<{ count: number }> {
    const response: AxiosResponse<{ count: number }> =
      await this.client.post('/notifications/mark-read', { notificationIds });
    return response.data;
  }

  async deleteNotification(id: string): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> =
      await this.client.delete(`/notifications/${id}`);
    return response.data;
  }

  async deleteAllReadNotifications(): Promise<{ count: number }> {
    const response: AxiosResponse<{ count: number }> =
      await this.client.delete('/notifications/read/all');
    return response.data;
  }

  async getNotificationPreferences(): Promise<NotificationPreference> {
    const response: AxiosResponse<NotificationPreference> =
      await this.client.get('/notifications/preferences');
    return response.data;
  }

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const response: AxiosResponse<NotificationPreference> =
      await this.client.put('/notifications/preferences', preferences);
    return response.data;
  }

  // Courses endpoints
  async getCourses(): Promise<any[]> {
    const response = await this.client.get('/courses');
    return response.data;
  }

  async getCourse(id: string): Promise<any> {
    const response = await this.client.get(`/courses/${id}`);
    return response.data;
  }

  async createCourse(data: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await this.client.post('/courses', data);
    return response.data;
  }

  async updateCourse(id: string, data: {
    code?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<any> {
    const response = await this.client.patch(`/courses/${id}`, data);
    return response.data;
  }

  async deleteCourse(id: string): Promise<void> {
    await this.client.delete(`/courses/${id}`);
  }

  async enrollUsers(courseId: string, userIds: string[]): Promise<any> {
    const response = await this.client.post(`/courses/${courseId}/enroll`, { userIds });
    return response.data;
  }

  async unenrollUsers(courseId: string, userIds: string[]): Promise<any> {
    const response = await this.client.post(`/courses/${courseId}/unenroll`, { userIds });
    return response.data;
  }

  async getEnrolledUsers(courseId: string): Promise<any[]> {
    const response = await this.client.get(`/courses/${courseId}/enrolled-users`);
    return response.data;
  }

  async getAvailableUsers(courseId: string): Promise<any[]> {
    const response = await this.client.get(`/courses/${courseId}/available-users`);
    return response.data;
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;