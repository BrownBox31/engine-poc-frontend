import React, { useState, useMemo } from 'react';
import type { VehicleInspection } from '../interfaces/inspection';

interface InspectionsTableProps {
  inspections: VehicleInspection[];
  isLoading?: boolean;
  onInspectionClick?: (inspection: VehicleInspection) => void;
}

const InspectionsTable: React.FC<InspectionsTableProps> = ({
  inspections,
  isLoading = false,
  onInspectionClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Filter and sort inspections based on VIN search and inspection date
  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    if (searchTerm.trim()) {
      filtered = inspections.filter(i =>
        i.vin.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    return [...filtered].sort((a, b) => {
      const dateA = a.inspectionDate ? new Date(a.inspectionDate).getTime() : Infinity;
      const dateB = b.inspectionDate ? new Date(b.inspectionDate).getTime() : Infinity;
      return dateA - dateB; // Oldest first, latest at last
    });
  }, [inspections, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getStatusConfig = (status: string) => {
    const statusUpper = status.toUpperCase();

    switch (statusUpper) {
      case 'PASS':
        return {
          classes: 'bg-green-100 text-green-700 border-green-200',
          icon: '✓',
          label: 'PASS'
        };
      case 'FAIL':
        return {
          classes: 'bg-red-100 text-red-700 border-red-200',
          icon: '✕',
          label: 'FAIL'
        };
      case 'COMPLETED':
        return {
          classes: 'bg-green-50 text-green-700 border-green-200',
          icon: '✓',
          label: 'COMPLETED'
        };
      case 'APPROVED':
        return {
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: '✓',
          label: 'APPROVED'
        };
      case 'REJECTED':
        return {
          classes: 'bg-red-50 text-red-700 border-red-200',
          icon: '✕',
          label: 'REJECTED'
        };
      case 'UNDER_PROGRESS':
      case 'IN_PROGRESS':
        return {
          classes: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: '⟳',
          label: statusUpper.replace('_', ' ')
        };
      case 'PENDING':
        return {
          classes: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: '○',
          label: 'PENDING'
        };
      default:
        return {
          classes: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: '○',
          label: statusUpper.replace('_', ' ')
        };
    }
  };

 const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  const now = new Date();

  // Normalize both dates to midnight for correct day comparison
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfInput = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = startOfToday.getTime() - startOfInput.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffDays === 0) return `Today, ${formattedDate.split(",")[1]}`;
  if (diffDays === 1) return `Yesterday, ${formattedDate.split(",")[1]}`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return formattedDate;
};


  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderEmptyState = () => {
    if (searchTerm && filteredInspections.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-500 text-3xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No matching inspections</h3>
          <p className="text-gray-500 mb-6">
            No inspections found for VIN containing "{searchTerm}"
          </p>
          <button
            onClick={clearSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Clear search
          </button>
        </div>
      );
    }

    if (inspections.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-3xl">📋</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No inspections yet</h3>
          <p className="text-gray-500">
            Start your first vehicle inspection to see data here
          </p>
        </div>
      );
    }

    return null;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredInspections.map((inspection, index) => {
        const statusConfig = getStatusConfig(inspection.overallStatus);

        return (
          <div
            key={inspection.vin || index}
            onClick={() => onInspectionClick?.(inspection)}
            className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer relative overflow-hidden"
          >
            {/* Status indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.classes.split(' ')[0]}`}></div>

            {/* VIN Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  VIN
                </div>
                <div className="text-lg font-bold text-gray-900 font-mono">
                  {inspection.vin}
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${statusConfig.classes} flex items-center gap-1.5`}>
                <span>{statusConfig.icon}</span>
                <span>{statusConfig.label}</span>
              </div>
            </div>

            {/* Inspection Date */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{formatDate(inspection.inspectionDate)}</span>
              </div>
            </div>

            {/* View Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectionClick?.(inspection);
              }}
              className="w-full py-2.5 px-4 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white"
            >
              View Details →
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Engine No. 
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Inspection Date
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredInspections.map((inspection, index) => {
            const statusConfig = getStatusConfig(inspection.overallStatus);

            return (
              <tr
                key={inspection.vin || index}
                className="hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => onInspectionClick?.(inspection)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 font-mono">
                    {inspection.vin}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusConfig.classes}`}>
                    <span>{statusConfig.icon}</span>
                    <span>{statusConfig.label}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-700 font-medium">
                    {formatDate(inspection.inspectionDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    className="px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectionClick?.(inspection);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Engine Inspections
            </h2>
            <p className="text-sm text-gray-600">
              {filteredInspections.length} {filteredInspections.length === 1 ? 'inspection' : 'inspections'}
              {inspections.length !== filteredInspections.length && ` of ${inspections.length} total`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid
                </span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by Engine No...."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full sm:w-64 pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredInspections.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="mt-6">
            {viewMode === 'grid' ? renderGridView() : renderTableView()}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionsTable;