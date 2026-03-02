// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}
