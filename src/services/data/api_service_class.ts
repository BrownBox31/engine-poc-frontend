import apiClient from './interceptor';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '../../interfaces';

// ============================
// GENERIC API SERVICE CLASS
// ============================

class ApiService {
  /**
   * Generic GET request
   * @param url - API endpoint URL
   * @param config - Optional axios request configuration
   * @returns Promise with typed API response
   */
  async get<T = unknown>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'GET request failed');
    }
  }
async getRaw<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    throw this.handleError(error, 'GET request failed');
  }
}

  /**
   * Generic POST request
   * @param url - API endpoint URL
   * @param data - Request payload
   * @param config - Optional axios request configuration
   * @returns Promise with typed API response
   */
  async post<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      console.log(config);
      // const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config);
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, {"headers": {"Access-Control-Allow-Origin": "*"}});
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'POST request failed');
    }
  }

  /**
   * Generic PUT request
   * @param url - API endpoint URL
   * @param data - Request payload
   * @param config - Optional axios request configuration
   * @returns Promise with typed API response
   */
  async put<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'PUT request failed');
    }
  }

  /**
   * Generic PATCH request
   * @param url - API endpoint URL
   * @param data - Request payload
   * @param config - Optional axios request configuration
   * @returns Promise with typed API response
   */
  async patch<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'PATCH request failed');
    }
  }

  /**
   * Generic DELETE request
   * @param url - API endpoint URL
   * @param config - Optional axios request configuration
   * @returns Promise with typed API response
   */
  async delete<T = unknown>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'DELETE request failed');
    }
  }

  // ============================
  // UTILITY METHODS
  // ============================

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return apiClient.getAccessToken();
  }

  /**
   * Set authentication tokens
   */
  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    apiClient.setTokens(tokens);
  }

  /**
   * Clear authentication tokens
   */
  clearTokens(): void {
    apiClient.clearTokens();
  }

  /**
   * Build query parameters from an object
   * @param params - Object with query parameters
   * @returns URLSearchParams or object for axios params
   */
  buildQueryParams(params?: Record<string, unknown>): Record<string, string> {
    if (!params) return {};
    
    const queryParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = String(value);
        }
      }
    });
    
    return queryParams;
  }

  /**
   * Handle API errors consistently
   * @param error - The error object from axios
   * @param defaultMessage - Default error message
   * @returns Formatted API error
   */
  private handleError(error: unknown, defaultMessage: string): ApiError {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { 
        response?: { 
          data?: { message?: string; errors?: string[] }; 
          status?: number 
        } 
      };
      
      return {
        message: axiosError.response?.data?.message || defaultMessage,
        status: axiosError.response?.status,
        details: axiosError.response?.data?.errors
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message || defaultMessage
      };
    }
    
    return {
      message: defaultMessage
    };
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiService };