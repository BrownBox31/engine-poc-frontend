import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/button';
import apiService from '../services/data/api_service_class';
import { ApiEndpoints } from '../services/data/apis';
import type { ApiResponse } from '../interfaces/api';

// Define interface based on actual API response structure
interface InspectionResolutionComment {
  voiceClipUrl: string;
  comment: string;
  type: string;
}

interface InspectionIssue {
  id: number;
  status: string;
  vin: string;
  issueDescription: string;
  createdAt: string;
  inspectionId: string;

  audioUrl?: string | null;
  view?: string | null;

  InspectionResolutionComments?: InspectionResolutionComment[];

  createdByUserId: {
    id: number;
    firstName: string;
    lastName: string;
  };
}


// API returns an array of inspection issues
type InspectionDetailsResponse = InspectionIssue[];

const InspectionDetails: React.FC = () => {
  const { vin, inspectionId } = useParams<{ vin: string; inspectionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [inspection, setInspection] = useState<InspectionDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [issueComments, setIssueComments] = useState<Record<number, string>>({});
  const [updatingIssues, setUpdatingIssues] = useState<Set<number>>(new Set());
  const [updateSuccess, setUpdateSuccess] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Check if we have data from navigation state first
    const navigationState = location.state as {
      inspection?: any;
      issues?: InspectionIssue[];
      allIssues?: InspectionIssue[];
    } | null;

    if (navigationState?.issues && navigationState.issues.length > 0) {
      // Use data from navigation state
      setInspection(navigationState.issues);
      setIsLoading(false);
      
    } else if (vin && inspectionId) {
      // Fallback: fetch data if navigation state is missing
      fetchInspectionDetails(vin, inspectionId);
    }
  }, [vin, inspectionId, location.state]);

const fetchInspectionDetailss = async (vinNumber: string) => {
  console.log('fetchInspectionDetails called with:', vinNumber);

  try {
    const url = `${ApiEndpoints.INSPECTION_DETAILS}${vinNumber}`;
    console.log('Final API URL:', url);

    const response = await apiService.get(url);
    console.log('API RESPONSE:', response);
  } catch (error) {
    console.error('API ERROR:', error);
  }
};


useEffect(() => {
  console.log('useEffect triggered');
  console.log('VIN inside useEffect:', vin);

  if (!vin) {
    console.log('VIN missing, API will not be called');
    return;
  }

  fetchInspectionDetailss(vin);
}, [vin]);




  const fetchInspectionDetails = async (vinNumber: string, inspectionIdParam: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construct the full URL by appending the VIN to the endpoint
      const url = `${ApiEndpoints.INSPECTION_DETAILS}${vinNumber}`;
      const response = await apiService.get<InspectionDetailsResponse>(url);
console.log("Inspection Details Response:", response);
      // Handle response based on API structure
      let inspectionData: InspectionDetailsResponse | null = null;
      
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) {
          inspectionData = response.data as InspectionDetailsResponse;
        } else {
          // Check if response has ApiResponse structure
          const apiResponse = response as ApiResponse<InspectionDetailsResponse>;
          if (apiResponse.success && apiResponse.data) {
            inspectionData = apiResponse.data;
          } else {
            // Handle direct array response
            if (Array.isArray(response)) {
              inspectionData = response as InspectionDetailsResponse;
            } else {
              inspectionData = response as unknown as InspectionDetailsResponse;
            }
          }
        }
      }
      
      // Filter issues for the specific VIN and inspectionId if we have an array
      if (Array.isArray(inspectionData)) {
        inspectionData = inspectionData.filter(issue => 
          issue.vin === vinNumber && 
          issue.inspectionId === inspectionIdParam
        );
      }
      
      setInspection(inspectionData);
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBackToInspectionList = () => {
    navigate(`/inspection/${vin}`);
  };

  const handleCheckboxChange = (issueId: number) => {
    setSelectedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const handleCommentChange = (issueId: number, comment: string) => {
    setIssueComments(prev => ({
      ...prev,
      [issueId]: comment
    }));
  };

  const updateIssueStatus = async (issueId: number) => {
    const comment = issueComments[issueId];
    const isSelected = selectedIssues.has(issueId);
    
    if (!isSelected || !comment?.trim()) {
      alert('Please select the issue and add a comment before updating.');
      return;
    }

    try {
      setUpdatingIssues(prev => new Set([...prev, issueId]));
      setUpdateSuccess(prev => ({ ...prev, [issueId]: false }));
      
      const url = `${ApiEndpoints.UPDATE_ISSUE_STATUS}${issueId}`;
      const payload = {
        status: "closed",
        comments: comment.trim()
      };

      await apiService.patch(url, payload);
      
      // Update the issue status in local state to reflect the change
      setInspection(prev => {
        if (!prev || !Array.isArray(prev)) return prev;
        
        return prev.map(issue => 
          issue.id === issueId 
            ? { ...issue, status: 'closed' }
            : issue
        );
      });
      
      // Mark as successfully updated
      setUpdateSuccess(prev => ({ ...prev, [issueId]: true }));
      
      // Remove from selected issues after successful update
      setSelectedIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
      
      // Clear the comment for this issue since it's now resolved
      setIssueComments(prev => {
        const updated = { ...prev };
        delete updated[issueId];
        return updated;
      });
      
      // Show success feedback briefly
      setTimeout(() => {
        setUpdateSuccess(prev => ({ ...prev, [issueId]: false }));
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update issue status. Please try again.';
      alert(errorMessage);
    } finally {
      setUpdatingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
    }
  };

  // Extract S3 audio link from the first issue (assuming all have the same link)
  const audioLink = inspection && Array.isArray(inspection) && inspection.length > 0 
    && inspection[0].InspectionResolutionComments 
    && inspection[0].InspectionResolutionComments.length > 0
    ? inspection[0].InspectionResolutionComments[0].voiceClipUrl 
    : null;
  


  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'APPROVED':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'UNDER_PROGRESS':
      case 'IN_PROGRESS':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'PENDING':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'OPEN':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Helper function to check if an issue is resolved
  const isIssueResolved = (status: string): boolean => {
    const resolvedStatuses = ['COMPLETED', 'APPROVED', 'CLOSED'];
    return resolvedStatuses.includes(status.toUpperCase());
  };

  // Filter issues based on status and search term
  const filteredIssues = React.useMemo(() => {
    if (!inspection || !Array.isArray(inspection)) return [];
    
    let filtered = inspection;
    
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
        issue.id.toString().includes(searchLower)
      );
    }
    
    return filtered;
  }, [inspection, statusFilter, searchTerm]);

  // Get counts for different statuses
  const statusCounts = React.useMemo(() => {
    if (!inspection || !Array.isArray(inspection)) {
      return { total: 0, open: 0, closed: 0 };
    }
    
    const total = inspection.length;
    const closed = inspection.filter(issue => isIssueResolved(issue.status)).length;
    const open = total - closed;
    
    return { total, open, closed };
  }, [inspection]);



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inspection details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inspection Details</h1>
                <p className="text-sm text-gray-600">VIN: {vin} • Inspection ID: {inspectionId}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleBackToInspectionList} variant="secondary">
                  Back to Inspections
                </Button>
                <Button onClick={handleBackToDashboard} variant="secondary">
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Details</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => vin && inspectionId && fetchInspectionDetails(vin, inspectionId)} variant="primary">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!inspection || (Array.isArray(inspection) && inspection.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inspection Details</h1>
                <p className="text-sm text-gray-600">VIN: {vin} • Inspection ID: {inspectionId}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleBackToInspectionList} variant="secondary">
                  Back to Inspections
                </Button>
                <Button onClick={handleBackToDashboard} variant="secondary">
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-xl">📋</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspection Found</h3>
                <p className="text-gray-600">No inspection details found for VIN: {vin}, Inspection ID: {inspectionId}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
                          <div>
                <h1 className="text-2xl font-bold text-gray-900">Inspection Details</h1>
                <p className="text-sm text-gray-600">
                VIN: {vin} • Inspection ID: {inspectionId}
                {Array.isArray(inspection) && inspection.length > 0 && (
                  <>
                    {` • ${filteredIssues.length} of ${inspection.length} issue${inspection.length !== 1 ? 's' : ''}`}
                    {statusFilter !== 'all' && ` (${statusFilter})`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </>
                )}
                {selectedIssues.size > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {selectedIssues.size} selected
                  </span>
                )}
              </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleBackToInspectionList} variant="secondary">
                  Back to Inspections
                </Button>
                <Button onClick={handleBackToDashboard} variant="secondary">
                  Dashboard
                </Button>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          {Array.isArray(inspection) && inspection.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Status Filter */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                          statusFilter === 'all'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        All ({statusCounts.total})
                      </button>
                      <button
                        onClick={() => setStatusFilter('open')}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                          statusFilter === 'open'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        Open ({statusCounts.open})
                      </button>
                      <button
                        onClick={() => setStatusFilter('closed')}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                          statusFilter === 'closed'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        Closed ({statusCounts.closed})
                      </button>
                    </div>
                  </div>
                  
                  {/* Search Filter */}
                  <div className="flex items-center space-x-2 flex-1 max-w-md">
                    <span className="text-sm font-medium text-gray-700">Search:</span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by issue description or ID..."
                        className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inspection Overview */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inspection Overview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">VIN</p>
                  <p className="mt-1 text-sm font-mono text-gray-900">{vin}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">
                    {statusFilter === 'all' ? 'Total Issues' : 
                     statusFilter === 'open' ? 'Open Issues' : 'Closed Issues'}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {filteredIssues.length}
                    {statusFilter === 'all' && Array.isArray(inspection) && inspection.length > 0 && (
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        of {inspection.length}
                      </span>
                    )}
                  </p>
                </div>
                
                {filteredIssues.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Status Distribution</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Array.from(new Set(filteredIssues.map(issue => issue.status))).map(status => (
                        <span key={status} className={getStatusBadge(status)} style={{fontSize: '10px', padding: '2px 6px'}}>
                          {status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Audio Player - Show only if we have audioLink */}
                {audioLink && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-2">Resolution Audio</p>
                    <audio controls className="w-full h-8">
                      <source src={audioLink} type="audio/mpeg" />
                      <source src={audioLink} type="audio/wav" />
                      <source src={audioLink} type="audio/ogg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inspection Issues Cards */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inspection Issues</h3>
              
              {filteredIssues.length > 0 ? (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <div key={issue.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <span className="text-sm font-medium text-gray-900">#{issue.id}</span>
                          <span className={getStatusBadge(issue.status)}>
                            {issue.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <input
                            type="checkbox"
                            checked={isIssueResolved(issue.status) || selectedIssues.has(issue.id)}
                            onChange={() => handleCheckboxChange(issue.id)}
                            disabled={isIssueResolved(issue.status)}
                            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                              isIssueResolved(issue.status) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!isIssueResolved(issue.status) ? (
                            <Button
                              onClick={() => updateIssueStatus(issue.id)}
                              disabled={!selectedIssues.has(issue.id) || !issueComments[issue.id]?.trim() || updatingIssues.has(issue.id)}
                              variant={updateSuccess[issue.id] ? "secondary" : "primary"}
                              size="small"
                              className={`min-w-[80px] ${
                                updateSuccess[issue.id] 
                                  ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                                  : ''
                              }`}
                            >
                              {updatingIssues.has(issue.id) ? (
                                <div className="flex items-center space-x-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  <span>...</span>
                                </div>
                              ) : updateSuccess[issue.id] ? (
                                <div className="flex items-center space-x-1">
                                  <span>✓</span>
                                  <span>Updated</span>
                                </div>
                              ) : (
                                'Update'
                              )}
                            </Button>
                          ) : (
                            <span className="text-sm text-green-600 font-medium">
                              ✓ Resolved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Issue Description */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Description:</h4>
                        <p className="text-sm text-gray-900">{issue.issueDescription}</p>
                      </div>

                      {/* Meta Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Created by:</span>
                          <div className="text-gray-600">
                            {issue.createdByUserId.firstName} {issue.createdByUserId.lastName}
                            <span className="text-xs text-gray-400 ml-1">(ID: {issue.createdByUserId.id})</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Created at:</span>
                          <div className="text-gray-600">
                            {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Comments:</h4>
                        {isIssueResolved(issue.status) ? (
                          <div className="w-full p-3 text-sm border border-gray-300 rounded-md bg-gray-50">
                            {issue.InspectionResolutionComments && issue.InspectionResolutionComments.length > 0 ? (
                              <div>
                                {issue.InspectionResolutionComments
                                  .filter(comment => comment.type === "RESOLUTION_COMMENT")
                                  .map((comment, index) => (
                                    <div key={index} className="mb-2 last:mb-0">
                                      <div className="text-gray-700 mb-1">{comment.comment}</div>
                                      {comment.voiceClipUrl && (
                                        <div className="mt-2">
                                          <audio controls className="w-full h-8">
                                            <source src={comment.voiceClipUrl} type="audio/mpeg" />
                                            <source src={comment.voiceClipUrl} type="audio/wav" />
                                            <source src={comment.voiceClipUrl} type="audio/ogg" />
                                            Your browser does not support the audio element.
                                          </audio>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                {issue.InspectionResolutionComments.filter(comment => comment.type === "RESOLUTION_COMMENT").length === 0 && (
                                  <div className="text-gray-500 italic">No resolution comments available</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500 italic">Issue resolved</div>
                            )}
                          </div>
                        ) : (
                          <textarea
                            value={issueComments[issue.id] || ''}
                            onChange={(e) => handleCommentChange(issue.id, e.target.value)}
                            placeholder="Add comments..."
                            className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 text-xl">📋</span>
                  </div>
                  {Array.isArray(inspection) && inspection.length > 0 ? (
                    <div>
                      <p className="text-gray-500 text-lg mb-2">No matching issues found</p>
                      <p className="text-sm text-gray-400">
                        {statusFilter !== 'all' && `No ${statusFilter} issues found`}
                        {searchTerm && ` matching "${searchTerm}"`}
                        {(statusFilter !== 'all' || searchTerm) && '. Try adjusting your filters.'}
                      </p>
                      {(statusFilter !== 'all' || searchTerm) && (
                        <button
                          onClick={() => {
                            setStatusFilter('all');
                            setSearchTerm('');
                          }}
                          className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 text-lg mb-2">No inspection issues found</p>
                      <p className="text-sm text-gray-400">
                        No issues were found for this VIN.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            {filteredIssues.length > 0 && selectedIssues.size > 0 && (
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setSelectedIssues(new Set());
                    setIssueComments({});
                    setUpdateSuccess({});
                  }}
                  variant="secondary"
                >
                  Clear All Selections
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InspectionDetails;
