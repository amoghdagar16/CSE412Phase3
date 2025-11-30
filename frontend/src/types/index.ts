// User types
export type UserRole = 'student' | 'professor' | 'ta' | 'admin';

export interface User {
  universityID: number;
  name: string;
  username: string;
  universityEmail: string;
  role: UserRole;
  college?: string;
  gender?: string;
  age?: number;
}

export interface Student extends User {
  role: 'student';
  totalGPA: number;
  year: string;
  classes: string[];
  estimatedGradTerm?: string;
  inGradSchool: boolean;
}

export interface Professor extends User {
  role: 'professor';
  employmentTime: string;
  officeHours: string;
  salary: number;
  classes: string[];
}

export interface TA extends Student {
  role: 'ta';
  classesTAingFor: string[];
  officeHours: string;
  status: 'UGTA' | 'GTA';
}

// Class types
export interface Class {
  classID: number;
  title: string;
  professorID: number;
  professorName?: string;
  size: number;
  session: 'A' | 'B' | 'C';
  time?: string;
  days?: string;
  location?: string;
  isHonors: boolean;
  term: string;
  enrolledStudents?: number;
  building?: string;
  address?: string;
}

// Classroom types
export interface Classroom {
  abbreviatedName: string;
  address?: string;
  building?: string;
  floor?: number;
}

// Auth types
export interface LoginCredentials {
  universityID: number;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Course content types (for LMS features)
export interface CourseContent {
  id: string;
  classID: number;
  title: string;
  type: 'chapter' | 'lecture' | 'assignment' | 'quiz';
  content: string;
  publishedBy: number;
  publishedAt: string;
  order: number;
}

export interface Chapter {
  id: string;
  classID: number;
  title: string;
  description: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface EnrollmentStats {
  term: string;
  totalClasses: number;
  totalCapacity: number;
  totalEnrolled: number;
  avgClassSize: number;
}

export interface BuildingUtilization {
  building: string;
  totalClasses: number;
  termsUsed: string;
  uniqueProfessors: number;
}
