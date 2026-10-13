import { authStorage } from '../utils/authStorage';
import type {
  ApiError,
  CommentRequest,
  CommentResponse,
  DashboardSummary,
  DocumentResponse,
  DocumentType,
  GetApplicationsParams,
  HistoryResponse,
  JobApplication,
  JobApplicationRequest,
  PagedApplicationResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  isMultipart?: boolean;
}

export class ApiException extends Error {
  status: number;
  error?: string;
  path?: string;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiException';
    this.status = apiError.status;
    this.error = apiError.error;
    this.path = apiError.path;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, isMultipart = false, headers: customHeaders, ...restOptions } = options;

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = { ...((customHeaders as Record<string, string>) || {}) };

  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined = undefined;

  if (body) {
    if (isMultipart) {
      requestBody = body as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        status: response.status,
        error: response.statusText,
        message: `HTTP Error ${response.status}: ${response.statusText}`,
      };
    }

    if (response.status === 401 && endpoint !== '/api/auth/login') {
      authStorage.removeToken();
    }

    throw new ApiException(errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData, isMultipart: true }),
};

// Application Management, Comments, History & Documents REST API Functions
export const applicationService = {
  getDashboardSummary: (): Promise<DashboardSummary> =>
    api.get<DashboardSummary>('/api/dashboard/summary'),

  getRecentApplications: (): Promise<JobApplication[]> =>
    api.get<JobApplication[]>('/api/dashboard/recent'),

  getApplications: (params: GetApplicationsParams = {}): Promise<PagedApplicationResponse> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.direction) query.append('direction', params.direction);
    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.size !== undefined) query.append('size', params.size.toString());

    const queryString = query.toString();
    const endpoint = `/api/applications${queryString ? `?${queryString}` : ''}`;
    return api.get<PagedApplicationResponse>(endpoint);
  },

  getApplication: (id: number): Promise<JobApplication> =>
    api.get<JobApplication>(`/api/applications/${id}`),

  createApplication: (data: JobApplicationRequest): Promise<JobApplication> =>
    api.post<JobApplication>('/api/applications', data),

  updateApplication: (id: number, data: JobApplicationRequest): Promise<JobApplication> =>
    api.put<JobApplication>(`/api/applications/${id}`, data),

  deleteApplication: (id: number): Promise<void> =>
    api.delete<void>(`/api/applications/${id}`),

  // Comments
  getComments: (applicationId: number): Promise<CommentResponse[]> =>
    api.get<CommentResponse[]>(`/api/applications/${applicationId}/comments`),

  createComment: (applicationId: number, data: CommentRequest): Promise<CommentResponse> =>
    api.post<CommentResponse>(`/api/applications/${applicationId}/comments`, data),

  updateComment: (
    applicationId: number,
    commentId: number,
    data: CommentRequest
  ): Promise<CommentResponse> =>
    api.put<CommentResponse>(`/api/applications/${applicationId}/comments/${commentId}`, data),

  deleteComment: (applicationId: number, commentId: number): Promise<void> =>
    api.delete<void>(`/api/applications/${applicationId}/comments/${commentId}`),

  // History / Activity Timeline
  getApplicationHistory: (applicationId: number): Promise<HistoryResponse[]> =>
    api.get<HistoryResponse[]>(`/api/applications/${applicationId}/history`),

  // Documents
  getDocuments: (applicationId: number): Promise<DocumentResponse[]> =>
    api.get<DocumentResponse[]>(`/api/applications/${applicationId}/documents`),

  uploadDocument: (
    applicationId: number,
    file: File,
    documentType: DocumentType
  ): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return api.upload<DocumentResponse>(`/api/applications/${applicationId}/documents`, formData);
  },

  downloadDocument: async (
    applicationId: number,
    documentId: number,
    fallbackFileName?: string
  ): Promise<void> => {
    const url = `${BASE_URL}/api/applications/${applicationId}/documents/${documentId}/download`;
    const token = authStorage.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          error: response.statusText,
          message: `Failed to download file (${response.status})`,
        };
      }
      throw new ApiException(errorData);
    }

    const disposition = response.headers.get('Content-Disposition');
    let filename = fallbackFileName || `document_${documentId}`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },

  deleteDocument: (applicationId: number, documentId: number): Promise<void> =>
    api.delete<void>(`/api/applications/${applicationId}/documents/${documentId}`),
};
