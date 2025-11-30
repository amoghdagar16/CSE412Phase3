import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
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
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear auth and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== Authentication ====================
  async login(university_id: string, password: string) {
    const response = await this.client.post('/api/auth/login', {
      university_id,
      password,
    });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
  }

  async register(userData: {
    university_id: string;
    username: string;
    password: string;
    name: string;
    email: string;
    requested_role: 'student' | 'professor' | 'ta';
    reason?: string;
  }) {
    const response = await this.client.post('/api/auth/register', userData);
    return response.data;
  }

  // ==================== Admin Endpoints ====================
  async getAdminDashboard() {
    const response = await this.client.get('/api/admin/dashboard');
    return response.data;
  }

  async getAllUsers(role?: string) {
    const params = role ? `?role=${role}` : '';
    const response = await this.client.get(`/api/admin/users${params}`);
    return response.data;
  }

  async createUser(userData: {
    university_id: string;
    username: string;
    password: string;
    name: string;
    email: string;
    role: 'professor' | 'student';
  }) {
    const response = await this.client.post('/api/admin/users/create', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: {
    name?: string;
    email?: string;
    is_active?: boolean;
  }) {
    const response = await this.client.patch(`/api/admin/users/${userId}`, userData);
    return response.data;
  }

  async resetUserPassword(userId: number, newPassword: string) {
    const response = await this.client.post(`/api/admin/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
    return response.data;
  }

  async getAllClasses() {
    const response = await this.client.get('/api/admin/classes');
    return response.data;
  }

  async createClass(classData: {
    class_code: string;
    title: string;
    description?: string;
    professor_id: number;
    term?: string;
    schedule?: string;
    location?: string;
    max_students?: number;
  }) {
    const response = await this.client.post('/api/admin/classes/create', classData);
    return response.data;
  }

  async enrollStudent(classId: number, studentId: number) {
    const response = await this.client.post('/api/admin/enrollments/create', {
      class_id: classId,
      student_id: studentId,
    });
    return response.data;
  }

  async getClassStudents(classId: number) {
    const response = await this.client.get(`/api/admin/classes/${classId}/students`);
    return response.data;
  }

  async getAllContent(filters?: {
    class_id?: number;
    content_type?: string;
    visibility?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const response = await this.client.get(`/api/admin/content?${params.toString()}`);
    return response.data;
  }

  async updateContentVisibility(contentId: number, visibility: 'public' | 'private' | 'enrolled') {
    const response = await this.client.patch(`/api/admin/content/${contentId}/visibility`, {
      visibility,
    });
    return response.data;
  }

  async getPendingRegistrations(status?: string) {
    const params = status ? `?status=${status}` : '';
    const response = await this.client.get(`/api/admin/pending-registrations${params}`);
    return response.data;
  }

  async approveRegistration(registrationId: number, approved: boolean) {
    const response = await this.client.post('/api/admin/approve-registration', {
      registration_id: registrationId,
      approved,
    });
    return response.data;
  }

  // ==================== Professor Endpoints ====================
  async getProfessorClasses() {
    const response = await this.client.get('/api/professor/my-classes');
    return response.data;
  }

  async getClassRoster(classId: number) {
    const response = await this.client.get(`/api/professor/classes/${classId}/roster`);
    return response.data;
  }

  async createContent(contentData: {
    class_id: number;
    title: string;
    content_type: 'lecture' | 'assignment' | 'material' | 'announcement';
    description?: string;
    content?: string;
    visibility: 'public' | 'private' | 'enrolled';
    due_date?: string;
  }) {
    const response = await this.client.post('/api/professor/content/create', contentData);
    return response.data;
  }

  async getProfessorContent(filters?: {
    class_id?: number;
    content_type?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const response = await this.client.get(`/api/professor/content?${params.toString()}`);
    return response.data;
  }

  async updateContent(contentId: number, contentData: {
    title?: string;
    description?: string;
    content?: string;
    visibility?: 'public' | 'private' | 'enrolled';
    due_date?: string;
  }) {
    const response = await this.client.patch(`/api/professor/content/${contentId}`, contentData);
    return response.data;
  }

  async deleteContent(contentId: number) {
    const response = await this.client.delete(`/api/professor/content/${contentId}`);
    return response.data;
  }

  async assignTA(classId: number, studentId: number) {
    const response = await this.client.post('/api/professor/ta/assign', {
      class_id: classId,
      student_id: studentId,
    });
    return response.data;
  }

  async removeTA(taId: number) {
    const response = await this.client.delete(`/api/professor/ta/${taId}`);
    return response.data;
  }

  async getClassTAs(classId: number) {
    const response = await this.client.get(`/api/professor/classes/${classId}/tas`);
    return response.data;
  }

  // ==================== Student Endpoints ====================
  async getStudentClasses() {
    const response = await this.client.get('/api/student/my-classes');
    return response.data;
  }

  async getAccessibleContent(filters?: {
    class_id?: number;
    content_type?: string;
    visibility?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const response = await this.client.get(`/api/student/content?${params.toString()}`);
    return response.data;
  }

  async getContentDetails(contentId: number) {
    const response = await this.client.get(`/api/student/content/${contentId}`);
    return response.data;
  }

  async getMyTAAssignments() {
    const response = await this.client.get('/api/student/ta/my-assignments');
    return response.data;
  }

  async getStudentDashboard() {
    const response = await this.client.get('/api/student/dashboard');
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
