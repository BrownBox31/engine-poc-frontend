import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Types for authentication
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

class ApiInterceptor {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (error?: unknown) => void;
  }> = [];

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token to requests
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.axiosInstance(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      this.setTokens({
        accessToken,
        refreshToken: newRefreshToken
      });

      return accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  private handleAuthFailure(): void {
    this.clearTokens();
    // Redirect to login page
    window.location.href = '/login';
  }

  // Token management methods
  public setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  public getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Public API methods
  public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  public post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  public put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }

  public patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }
}

// Create and export a singleton instance
const apiClient = new ApiInterceptor();

export default apiClient;
export { ApiInterceptor };
export type { AuthTokens, RefreshTokenResponse };
