export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export type DocumentType =
  | 'RESUME'
  | 'COVER_LETTER'
  | 'OFFER_LETTER'
  | 'JOB_DESCRIPTION'
  | 'INTERVIEW_DOCUMENT'
  | 'OTHER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface User {
  username: string;
  role?: string;
}

export interface ApiError {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  path?: string;
}

export interface JobApplication {
  id: number;
  companyName: string;
  jobRole: string;
  location?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  jobUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JobApplicationRequest {
  companyName: string;
  jobRole: string;
  location?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  jobUrl?: string;
  notes?: string;
}

export interface PagedApplicationResponse {
  content: JobApplication[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalApplications: number;
  applied: number;
  screening: number;
  interview: number;
  offers: number;
  rejected: number;
  withdrawn: number;
}

export interface GetApplicationsParams {
  search?: string;
  status?: ApplicationStatus | '';
  fromDate?: string;
  toDate?: string;
  sortBy?: 'appliedDate' | 'companyName' | 'status' | 'jobRole' | 'createdAt';
  direction?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// Phase 10.3 Types
export interface CommentRequest {
  content: string;
}

export interface CommentResponse {
  id: number;
  applicationId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryResponse {
  id: number;
  applicationId: number;
  userId: number;
  username: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface DocumentResponse {
  id: number;
  applicationId: number;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  documentType: DocumentType;
  createdAt: string;
}
