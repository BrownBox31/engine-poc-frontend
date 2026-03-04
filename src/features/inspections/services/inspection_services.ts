import apiService from '../../../services/data/api_service_class';
import { ApiEndpoints } from '../../../services/data/apis';
import type { ApiResponse } from '../../../interfaces/api';
import axios from 'axios';

// Define interfaces
export interface InspectionResolutionComment {
  voiceClipUrl: string;
  comment: string;
  type: string;
}

export interface InspectionIssue {
  issueId: number;
  status: string;
  issueDescription: string;
  createdAt: string;
  inspectionId: number;
  audioUrl?: string | null;
  denoisedAudioUrl: string | null;
  view?: string | null;
  checklistView: string | null;
  workstationName?: string | null;
  workstationId?: number | null;
  reworkStationId: number | null;
  reworkStationName: string | null;
  defectId: number | null;
  defectName: string | null;
  confidenceScore: number | null;
  inspectionResolutionComments?: InspectionResolutionComment[];
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface InspectionData {
  vin: string;
  issues: InspectionIssue[];
}

export interface InspectionSummary {
  inspectionId: string;
  vin: string;
  issueCount: number;
  openIssuesCount: number;
  closedIssuesCount: number;
  createdAt: string;
  lastUpdated: string;
  status: string;
  checklistView?: string | null;
  workstationName?: string | null;
}

export interface StatusCounts {
  total: number;
  open: number;
  closed: number;
}

export type InspectionIssuesResponse = InspectionData[];

export interface PVInspection {
  id: number;
  engineNumber: string;
  material: string;
  smoke: string;
  hcPpm: string;
  vinNumber: string;
  created_at: string;
  createdBy: number;
}


// Helper functions
export const isIssueResolved = (status: string): boolean => {
  const resolvedStatuses = ['COMPLETED', 'APPROVED', 'CLOSED'];
  return resolvedStatuses.includes(status.toUpperCase());
};

export const getStatusBadge = (status: string): string => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";

  switch (status.toLowerCase()) {
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'in_progress':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'pending':
      return `${baseClasses} bg-orange-100 text-orange-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

// Data processing functions
export const processApiResponse = (response: unknown): InspectionIssuesResponse | null => {
  let issuesData: InspectionIssuesResponse | null = null;

  if (response && typeof response === 'object') {
    if ('data' in response && response.data) {
      issuesData = response.data as InspectionIssuesResponse;
    } else {
      // Check if response has ApiResponse structure
      const apiResponse = response as ApiResponse<InspectionIssuesResponse>;
      if (apiResponse.success && apiResponse.data) {
        issuesData = apiResponse.data;
      } else {
        // Handle direct array response
        if (Array.isArray(response)) {
          issuesData = response as InspectionIssuesResponse;
        } else {
          issuesData = response as unknown as InspectionIssuesResponse;
        }
      }
    }
  }

  return issuesData;
};

export const groupIssuesByInspection = (issues: InspectionIssue[]): Record<string, InspectionIssue[]> => {
  // Group issues by inspectionId
  return issues.reduce((groups: Record<string, InspectionIssue[]>, issue) => {
    const inspectionId = String(issue.inspectionId || 'unknown');
    if (!groups[inspectionId]) {
      groups[inspectionId] = [];
    }
    groups[inspectionId].push(issue);
    return groups;
  }, {});
};

export const createInspectionSummaries = (inspectionGroups: Record<string, InspectionIssue[]>, vinNumber: string): InspectionSummary[] => {
  const inspectionSummaries: InspectionSummary[] = Object.entries(inspectionGroups).map(
    ([inspectionId, issues]) => {
      const openIssues = issues.filter(issue => !isIssueResolved(issue.status));
      const closedIssues = issues.filter(issue => isIssueResolved(issue.status));

      // Sort issues by creation date to get the earliest and latest
      const sortedIssues = [...issues].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const earliestIssue = sortedIssues[0];
      const latestIssue = sortedIssues[sortedIssues.length - 1];

      const workstationSource =
        latestIssue.workstationName || earliestIssue.workstationName || null;


      // Determine overall inspection status
      let status = 'completed';
      if (openIssues.length > 0) {
        status = openIssues.length === issues.length ? 'pending' : 'in_progress';
      }

      return {
        inspectionId,
        vin: vinNumber,
        issueCount: issues.length,
        openIssuesCount: openIssues.length,
        closedIssuesCount: closedIssues.length,
        createdAt: earliestIssue.createdAt,
        lastUpdated: latestIssue.createdAt,
        checklistView: earliestIssue.checklistView,
        status,
        workstationName: workstationSource
      };
    }
  );


  // Sort inspections by creation date (newest first)
  return inspectionSummaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const filterInspections = (inspections: InspectionSummary[], searchTerm: string): InspectionSummary[] => {
  if (!searchTerm.trim()) return inspections;

  const searchLower = searchTerm.toLowerCase();
  return inspections.filter(inspection =>
    inspection.inspectionId.toLowerCase().includes(searchLower)
  );
};

export const getSelectedInspectionIssues = (
  issuesData: InspectionIssue[] | null,
  selectedInspectionId: string | null
): InspectionIssue[] => {
  if (!selectedInspectionId || !issuesData) return [];

  return issuesData.filter(issue =>
    String(issue.inspectionId) === selectedInspectionId
  );
};

export const filterIssues = (
  issues: InspectionIssue[],
  statusFilter: 'all' | 'open' | 'closed',
  searchTerm: string
): InspectionIssue[] => {
  if (!issues.length) return [];

  let filtered = issues;

  // Filter by status
  if (statusFilter === 'open') {
    filtered = filtered.filter(issue => !isIssueResolved(issue.status));
  } else if (statusFilter === 'closed') {
    filtered = filtered.filter(issue => isIssueResolved(issue.status));
  }

  // Filter by search term
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(issue =>
      issue.issueDescription.toLowerCase().includes(searchLower) ||
      issue.issueId.toString().includes(searchLower)
    );
  }

  return filtered;
};

export const getStatusCounts = (issues: InspectionIssue[]): StatusCounts => {
  if (!issues.length) {
    return { total: 0, open: 0, closed: 0 };
  }

  const total = issues.length;
  const closed = issues.filter(issue => isIssueResolved(issue.status)).length;
  const open = total - closed;

  return { total, open, closed };
};

// API service functions
export const fetchInspectionsByVin = async (vinNumber: string): Promise<{
  inspections: InspectionSummary[];
  issuesData: InspectionIssue[];
}> => {
  try {
    // Use the inspection details endpoint to get all issues for this VIN
    const url = `${ApiEndpoints.INSPECTION_DETAILS}${vinNumber}`;
    const response = await apiService.get<InspectionIssuesResponse>(url);

    // Process the API response
    const inspectionData = processApiResponse(response);

    if (Array.isArray(inspectionData)) {
      // Find the data for the specific VIN
      const vinData = inspectionData.find(data => data.vin === vinNumber);

      if (vinData && vinData.issues) {
        // Group issues by inspection
        const inspectionGroups = groupIssuesByInspection(vinData.issues);

        // Create inspection summaries
        const inspections = createInspectionSummaries(inspectionGroups, vinNumber);

        return { inspections, issuesData: vinData.issues };
      } else {
        return { inspections: [], issuesData: [] };
      }
    } else {
      return { inspections: [], issuesData: [] };
    }
  } catch (error) {
    throw new Error(`Failed to fetch inspections: ${error}`);
  }
};

export const updateIssueStatus = async (issueId: number, comment: string): Promise<void> => {
  try {
    const url = `${ApiEndpoints.UPDATE_ISSUE_STATUS}${issueId}`;
    const payload = {
      status: "closed",
      comments: comment.trim()
    };

    await apiService.patch(url, payload);
  } catch (error) {
    throw new Error(`Failed to update issue status: ${error}`);
  }
};

export const updateIssue = async (
  issueId: number,
  data: {
    status?: 'open' | 'closed';
    comments?: string;
    issueDescription?: string;
  }
): Promise<void> => {
  try {
    const url = `${ApiEndpoints.UPDATE_ISSUE_STATUS}${issueId}`;

    // Build payload dynamically (ONLY include passed fields)
    const payload: Record<string, any> = {};

    if (data.status) {
      payload.status = data.status;
    }

    if (data.comments?.trim()) {
      payload.comments = data.comments.trim();
    }

    if (data.issueDescription?.trim()) {
      payload.issueDescription = data.issueDescription.trim();
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('No valid fields provided to update');
    }

    await apiService.patch(url, payload);
  } catch (error) {
    throw new Error(`Failed to update issue: ${error}`);
  }
};

// inspection_services.ts
export const createIssueResolution = async (
  inspectionId: number,
  vin: string | undefined,
  issueDescription: string,
  // actionType?: string
): Promise<void> => {
  try {
    const payload = {
      inspectionId,
      vin,
      issueDescription: issueDescription.trim(),
      //  action_type: actionType ?? '',

      //  Optional fields – enable when needed
      // attachment_urls: [],       // string[]
      // voice_clip_url: '',        // string
    };
    console.log("payload", payload);
    await apiService.post('/resolution/create/issue', payload);
  } catch (error) {
    throw new Error(`Failed to create issue resolution: ${error}`);
  }
};

export const deleteIssueResolution = async (issueId: number): Promise<void> => {
  try {
    const url = `${ApiEndpoints.DELETE_RESOLUTION_ISSUE}${issueId}`;
    await apiService.delete(url);
  } catch (error) {
    throw new Error(`Failed to delete issue: ${error}`);
  }
};

export const addFollowupComment = async (
  inspectionIssueId: number,
  comment: string
): Promise<void> => {
  try {
    if (!comment?.trim()) {
      throw new Error("Follow-up comment cannot be empty");
    }

    const url = `/resolution/issue/${inspectionIssueId}/comment`;

    await apiService.patch(url, {
      comment: comment.trim(),
    });
  } catch (error) {
    throw new Error(`Failed to add follow-up comment: ${error}`);
  }
};

// ---------- NEW: GET REWORK STATIONS ----------
export type ReworkStation = {
  id: number;
  reworkStationName: string;
};

export const fetchReworkStations = async (): Promise<ReworkStation[]> => {
  try {
    const url = `${ApiEndpoints.REWORK_STATIONS}`;

    const response = await apiService.get(url);

    // Handle all possible response shapes from your backend
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    // Fallback safety
    return [];
  } catch (error) {
    console.error("Error fetching rework stations:", error);
    return []; // never return {}
  }
};

export const updateIssueReworkStation = async (
  issueId: number,
  reworkStationId: number
): Promise<{
  reworkstation?: { id: number; reworkStationName: string } | null;
}> => {
  try {
    const url = `${ApiEndpoints.UPDATE_ISSUE_REWORK_STATION}${issueId}/rework-station`;

    const res = await apiService.patch(url, { reworkStationId });

    const data = res?.data ?? res;

    // normalize response so TS never complains
    if (!data) {
      return { reworkstation: null };
    }

    return data;
  } catch (error) {
    console.error("Failed to update rework station:", error);
    return { reworkstation: null };
  }
};

export const fetchPVInspectionByVin = async (
  vinNumber: string
): Promise<PVInspection | null> => {
  try {
    const url = `${ApiEndpoints.PV_INSPECTION_BY_VIN}${vinNumber}`;

    const response = await apiService.getRaw<PVInspection>(url);

    console.log("PV Inspection response:", response);

    return response || null; // ✅ THIS IS CORRECT
  } catch (error) {
    console.error("Failed to fetch PV inspection:", error);
    return null;
  }
};

// ---------- CREATE INSPECTION (WITH AUDIO UPLOAD) ----------
// export const createInspection = async (params: {
//   engineNoNumber: string;
//   workstationId: number;
//   descriptionAudio: File | Blob;
//   view: string;
// }): Promise<any> => {
//   try {
//     const formData = new FormData();

//     formData.append("engineNoNumber", params.engineNoNumber);
//     formData.append("workstationId", String(params.workstationId));
//     formData.append("descriptionAudio", params.descriptionAudio);
//     formData.append("view", params.view);

//     const url = `${ApiEndpoints.CREATE_INSPECTION}`;

//     const response = await apiService.post(url, formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });
// console.log("Create Inspection response:", response);
//     return response?.data ?? response;
//   } catch (error) {
//     console.error("Failed to create inspection:", error);
//     throw new Error(`Failed to create inspection: ${error}`);
//   }
// };

export const createInspection = async (params: {
  vinNumber: string;
  workstationId: number;
  descriptionAudio: File;
  view: string;
}) => {
  const formData = new FormData();

  formData.append("vinNumber", params.vinNumber);
  formData.append("workstationId", String(params.workstationId));
  formData.append("view", params.view);
  formData.append("descriptionAudio", params.descriptionAudio);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  return axios.post(
      `${API_BASE_URL}inspection/create-inspection/`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // or get from storage
      },
    }
  );
};







