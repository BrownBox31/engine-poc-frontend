import apiService from '../../services/data/api_service_class';
import { ApiEndpoints } from '../../services/data/apis';
import type { ApiResponse } from '../../interfaces/api';

/* =======================
   TYPES & INTERFACES
======================= */

export interface CommentCount {
  comment: string;
  comment_count: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCommentCountsResponse {
  success: boolean;
  data: CommentCount[];
  meta: PaginationMeta;
}

/* =======================
   HELPER FUNCTIONS
======================= */

/**
 * Safely extract paginated analytics response
 */
export const processAnalyticsResponse = (
  response: unknown,
): PaginatedCommentCountsResponse | null => {
  if (response && typeof response === 'object') {
    if (
      'success' in response &&
      'data' in response &&
      'meta' in response
    ) {
      return response as PaginatedCommentCountsResponse;
    }
  }
  return null;
};

/* =======================
   API CALLS
======================= */

/**
 * Fetch paginated issue frequency counts
 */
export const fetchCommentCounts = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  data: CommentCount[];
  meta: PaginationMeta;
}> => {
  try {
    const { page = 1, limit = 20, search = '' } = params;

    const response = await apiService.get<PaginatedCommentCountsResponse>(
      ApiEndpoints.ANALYTICS_COMMENT_COUNTS,
      {
        params: {
          page,
          limit,
          search,
        },
      },
    );

    const processed = processAnalyticsResponse(response);

    if (!processed) {
      throw new Error('Invalid analytics API response structure');
    }

    return {
      data: processed.data,
      meta: processed.meta,
    };
  } catch (error) {
    console.error('Failed to fetch comment counts', error);
    throw new Error(`Failed to fetch comment counts: ${error}`);
  }
};

/**
 * Export all issue frequencies (no pagination)
 * Useful for CSV / Excel export
 */
export const fetchAllCommentCounts = async (): Promise<CommentCount[]> => {
  try {
    const response = await apiService.get<ApiResponse<CommentCount[]>>(
      ApiEndpoints.ANALYTICS_COMMENT_COUNTS_ALL,
    );

    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response)) {
      return response as CommentCount[];
    }

    throw new Error('Invalid response while exporting analytics data');
  } catch (error) {
    console.error('Failed to export analytics data', error);
    throw new Error(`Failed to export analytics data: ${error}`);
  }
};

export interface DefectCount {
  day: string;
  comment: string;
  defect_count: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T;
  meta: PaginatedMeta;
}

export const fetchDefectCounts = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedApiResponse<DefectCount[]>> => {
  const queryParams: Record<string, any> = {};

  // page is always safe
  if (params.page !== undefined) {
    queryParams.page = params.page;
  }

  // ONLY send limit when defined (critical for ALL TIME)
  if (params.limit !== undefined) {
    queryParams.limit = params.limit;
  }

  // ONLY send search when non-empty
  if (params.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }

  const response = await apiService.get<DefectCount[]>(
    ApiEndpoints.ANALYTICS_DEFECT_COUNTS,
    {
      params: queryParams,
    },
  );

  /**
   * response is ApiResponse<DefectCount[]>
   * backend ALSO sends meta
   */
  const paginatedResponse =
    response as unknown as PaginatedApiResponse<DefectCount[]>;

  if (!paginatedResponse.success) {
    throw new Error('Invalid defect analytics response');
  }

  return paginatedResponse;
};




