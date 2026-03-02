import type { VehicleInfo } from './vehicle';

// Actual Vehicle Inspection Data Structure (as returned by API)
export interface VehicleInspection {
  vin: string;
  overallStatus: string;
  inspectionCount: number;
  inspectionDate: string ;
}

// Detailed Vehicle Inspection Types (for future use)
export interface DetailedVehicleInspection {
  id: string;
  vehicleId: string;
  inspectorId: string;
  inspectionDate: string;
  status: InspectionStatus;
  vehicleInfo: VehicleInfo;
  inspectionItems: InspectionItem[];
  overallScore: number;
  notes?: string;
  images: InspectionImage[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionItem {
  id: string;
  category: InspectionCategory;
  itemName: string;
  status: InspectionItemStatus;
  severity?: InspectionSeverity;
  description?: string;
  recommendations?: string;
  images: string[];
}

export interface InspectionImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  category: InspectionCategory;
  uploadedAt: string;
}

export const InspectionStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type InspectionStatus = typeof InspectionStatus[keyof typeof InspectionStatus];

export const InspectionItemStatus = {
  PASS: 'pass',
  FAIL: 'fail',
  WARNING: 'warning',
  NOT_APPLICABLE: 'not_applicable'
} as const;

export type InspectionItemStatus = typeof InspectionItemStatus[keyof typeof InspectionItemStatus];

export const InspectionSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type InspectionSeverity = typeof InspectionSeverity[keyof typeof InspectionSeverity];

export const InspectionCategory = {
  ENGINE: 'engine',
  TRANSMISSION: 'transmission',
  BRAKES: 'brakes',
  TIRES: 'tires',
  LIGHTS: 'lights',
  ELECTRICAL: 'electrical',
  BODY: 'body',
  INTERIOR: 'interior',
  SAFETY: 'safety',
  EMISSIONS: 'emissions'
} as const;

export type InspectionCategory = typeof InspectionCategory[keyof typeof InspectionCategory];

// API Request/Response Types
export interface CreateInspectionRequest {
  vehicleInfo: VehicleInfo;
  inspectionDate?: string;
  notes?: string;
}

export interface UpdateInspectionRequest {
  status?: InspectionStatus;
  inspectionItems?: InspectionItem[];
  notes?: string;
  overallScore?: number;
}

// The API returns a direct array of VehicleInspection objects
export type InspectionListResponse = VehicleInspection[];

export interface InspectionFilters extends Record<string, unknown> {
  status?: InspectionStatus[];
  inspectorId?: string;
  vehicleMake?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'score' | 'status';
  sortOrder?: 'asc' | 'desc';
}
