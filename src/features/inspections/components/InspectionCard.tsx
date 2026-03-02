import React from 'react';
import Button from '../../../components/button';
import { type InspectionSummary } from '../services/inspection_services';

interface InspectionCardProps {
  inspection: InspectionSummary;
  onInspectionClick: (inspectionId: string) => void;
  getStatusBadge: (status: string) => string;
}

const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  onInspectionClick,
  getStatusBadge
}) => {
  return (
    <div
      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-blue-300"
      onClick={() => onInspectionClick(inspection.inspectionId)}
    >
      {/* Inspection ID Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          ID: {inspection.inspectionId}
        </h4>
        <span className={getStatusBadge(inspection.status)}>
          {inspection.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Statistics */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Total Issues:</span>
          <span className="text-sm font-semibold text-gray-900">{inspection.issueCount}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Open Issues:</span>
          <span className={`text-sm font-semibold ${inspection.openIssuesCount > 0 ? 'text-orange-600' : 'text-gray-900'
            }`}>
            {inspection.openIssuesCount}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Closed Issues:</span>
          <span className={`text-sm font-semibold ${inspection.closedIssuesCount > 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
            {inspection.closedIssuesCount}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">View:</span>
          <span className="text-sm font-semibold text-gray-900">
            {inspection.checklistView ?? 'N/A'}
          </span>
        </div>
          <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Station:</span>
          <span className="text-sm font-semibold text-gray-900">
            {inspection.workstationName ?? 'N/A'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round((inspection.closedIssuesCount / inspection.issueCount) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(inspection.closedIssuesCount / inspection.issueCount) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2 text-xs text-gray-500">
        <div>
          <span className="font-medium">Created:</span> {' '}
          {new Date(inspection.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div>
          <span className="font-medium">Last Updated:</span> {' '}
          {new Date(inspection.lastUpdated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* View Details Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Button
          onClick={() => onInspectionClick(inspection.inspectionId)}
          variant="primary"
          size="small"
          className="w-full"
        >
          View Issues ({inspection.issueCount})
        </Button>
      </div>
    </div>
  );
};

export default InspectionCard;
