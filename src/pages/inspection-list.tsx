import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/button';
import InspectionCard from '../features/inspections/components/InspectionCard';
import {
  fetchInspectionsByVin,
  updateIssueStatus,
  updateIssue,
  filterInspections,
  getSelectedInspectionIssues,
  filterIssues,
  getStatusCounts,
  getStatusBadge,
  isIssueResolved,
  createIssueResolution,
  type InspectionSummary,
  type InspectionIssue,
  deleteIssueResolution,
  addFollowupComment,
  fetchReworkStations,
  updateIssueReworkStation
} from '../features/inspections/services/inspection_services';
import Loader from '../components/loader';
import { FiTrash2, FiEdit, FiCheckCircle, FiAlertCircle, FiUser, FiClock, FiGrid, FiHome, FiArrowLeft, FiSearch, FiFileText } from "react-icons/fi";
import { buildFileUrl } from "../utils/fileUrl";
import swal from "sweetalert";
import { fetchPVInspectionByVin, type PVInspection } from '../features/inspections/services/inspection_services';



const InspectionList: React.FC = () => {
  const { vin } = useParams<{ vin: string }>();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [issuesData, setIssuesData] = useState<InspectionIssue[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [issueComments, setIssueComments] = useState<Record<number, string>>({});
  const [updatingIssues, setUpdatingIssues] = useState<Set<number>>(new Set());
  const [updateSuccess, setUpdateSuccess] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [issueSearchTerm, setIssueSearchTerm] = useState<string>('');
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [, setUpdatingDescription] = useState<boolean>(false);
  const [addIssueOpen, setAddIssueOpen] = useState(false);

  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [, setNewIssueActionType] = useState('');
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [stations, setStations] = useState<
    { id: number; reworkStationName: string }[]
  >([]);
  const [editingStationForIssue, setEditingStationForIssue] =
    useState<number | null>(null);
  const [pvInspection, setPvInspection] = useState<PVInspection | null>(null);


  useEffect(() => {
    if (vin) {
      handleFetchInspections(vin);
      //  Fetch PVInspection
      fetchPVInspectionByVin(vin)
        .then(setPvInspection)
        .catch(console.error);
    }
  }, [vin]);


  useEffect(() => {
    fetchReworkStations()
      .then(setStations)
      .catch(console.error);
  }, []);



  const handleFetchInspections = async (vinNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { inspections, issuesData } = await fetchInspectionsByVin(vinNumber);
      setInspections(inspections);
      setIssuesData(issuesData);
    } catch (error) {
      setError(error as string);
      setInspections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleInspectionClick = (inspectionId: string) => {
    setSelectedInspectionId(inspectionId);
    // Reset issue-related state when selecting a new inspection
    setSelectedIssues(new Set());
    setIssueComments({});
    setUpdateSuccess({});
    setStatusFilter('all');
    setIssueSearchTerm('');
  };

  const handleBackToInspectionGrid = () => {
    setSelectedInspectionId(null);
    setSelectedIssues(new Set());
    setIssueComments({});
    setUpdateSuccess({});
    setStatusFilter('all');
    setIssueSearchTerm('');
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

  const handleUpdateIssueStatus = async (issueId: number) => {
    const comment = issueComments[issueId];
    const isSelected = selectedIssues.has(issueId);

    if (!isSelected || !comment?.trim()) {
      alert('Please select the issue and add a comment before updating.');
      return;
    }

    try {
      setUpdatingIssues(prev => new Set([...prev, issueId]));
      setUpdateSuccess(prev => ({ ...prev, [issueId]: false }));

      await updateIssueStatus(issueId, comment.trim());

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

      // Refetch the inspection data to update counts and statuses
      if (vin) {
        await handleFetchInspections(vin);
      }

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

  const handleAddFollowup = async (issueId: number) => {
    const commentText = issueComments[issueId]?.trim();

    if (!commentText) {
      alert("Please enter a follow-up comment first");
      return;
    }

    try {
      setUpdatingIssues(prev => new Set([...prev, issueId]));
      setUpdateSuccess(prev => ({ ...prev, [issueId]: false }));

      await addFollowupComment(issueId, commentText);

      // Mark success in UI (same pattern as update)
      setUpdateSuccess(prev => ({ ...prev, [issueId]: true }));

      // Clear textarea after success
      setIssueComments(prev => {
        const updated = { ...prev };
        delete updated[issueId];
        return updated;
      });

      // Show success feedback briefly
      setTimeout(() => {
        setUpdateSuccess(prev => ({ ...prev, [issueId]: false }));
      }, 3000);

      // ✅ REFRESH DATA — SAME AS handleUpdateIssueStatus
      if (vin) {
        await handleFetchInspections(vin);
      }

    } catch (err) {
      console.error("Failed to update:", err);
      alert("Failed to update. Please try again.");
    } finally {
      setUpdatingIssues(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
    }
  };



  const handleEditClick = (issueId: number, currentDesc: string) => {
    setEditingIssueId(issueId);
    setEditedDescription(currentDesc);
  };

  const handleCancelEdit = () => {
    setEditingIssueId(null);
    setEditedDescription('');
  };

  const handleSaveEdit = async (issueId: number) => {
    if (!editedDescription.trim()) {
      alert('Description cannot be empty');
      return;
    }

    try {
      setUpdatingDescription(true);
      // console.log('Updating issue description for issue ID:', issueId,  editedDescription);
      await updateIssue(issueId, {
        issueDescription: editedDescription,
      });


      // Refresh data
      if (vin) {
        await handleFetchInspections(vin);
      }

      handleCancelEdit();
    } catch (error) {
      alert('Failed to update description');
    } finally {
      setUpdatingDescription(false);
    }
  };


  // Filter inspections based on search term
  const filteredInspections = React.useMemo(() => {
    return filterInspections(inspections, searchTerm);
  }, [inspections, searchTerm]);

  // Get issues for selected inspection
  const selectedInspectionIssues = React.useMemo(() => {
    return getSelectedInspectionIssues(issuesData, selectedInspectionId);
  }, [selectedInspectionId, issuesData]);

  // Filter issues based on status and search term
  const filteredIssues = React.useMemo(() => {
    return filterIssues(selectedInspectionIssues, statusFilter, issueSearchTerm);
  }, [selectedInspectionIssues, statusFilter, issueSearchTerm]);

  // Get counts for different statuses
  const statusCounts = React.useMemo(() => {
    return getStatusCounts(selectedInspectionIssues);
  }, [selectedInspectionIssues]);

  const handleCreateIssue = async () => {
    if (!newIssueDescription.trim()) {
      alert('Description is required');
      return;
    }

    if (!selectedInspectionId) {
      alert('Inspection not selected');
      return;
    }

    try {
      setCreatingIssue(true);
      console.log(filteredInspections)
      console.log("Selected Inspection:", selectedInspectionId);
      await createIssueResolution(
        Number(selectedInspectionId),
        vin,
        newIssueDescription,
        // newIssueActionType
      );

      // Refresh issues
      if (vin) {
        await handleFetchInspections(vin);
      }

      // Reset & close modal
      setNewIssueDescription('');
      setNewIssueActionType('');
      setAddIssueOpen(false);

    } catch (error) {
      alert('Failed to create inspection issue');
    } finally {
      setCreatingIssue(false);
    }
  };



  const handleDeleteIssue = async (issueId: number, vinNumber: string) => {
    const willDelete = await swal({
      title: "Are you sure?",
      text: `Once deleted, Issue #${issueId} will be closed and cannot be recovered.`,
      icon: "warning",
      buttons: ["Cancel", "Yes, delete it"],
      dangerMode: true,
    });

    if (!willDelete) {
      return; // user cancelled
    }

    try {
      await deleteIssueResolution(issueId);

      await swal({
        title: "Deleted!",
        text: `Issue #${issueId} has been deleted successfully.`,
        icon: "success",
        timer: 2000,
        buttons: {
          confirm: false,
        }
      });

      // refresh list after delete
      const res = await fetchInspectionsByVin(vinNumber);
      setInspections(res.inspections);
      setIssuesData(res.issuesData);

    } catch (error: any) {
      console.error("Delete failed:", error);

      swal({
        title: "Error",
        text: "Failed to delete issue. Please try again.",
        icon: "error",
      });
    }
  };

  const handleStationChange = async (issueId: number, newId: number) => {
    try {
      const updated = await updateIssueReworkStation(issueId, newId);

      if (updated.reworkstation) {
        setIssuesData(prev =>
          prev?.map(it =>
            it.issueId === issueId
              ? {
                ...it,
                reworkStationId: updated.reworkstation!.id,
                reworkStationName: updated.reworkstation!.reworkStationName,
              }
              : it
          ) ?? null
        );

        // ✅ CLOSE DROPDOWN AFTER UPDATE
        setEditingStationForIssue(null);

        // ✅ SHOW CONFIRMATION
        swal({
          title: "Updated!",
          text: "Rework station updated successfully",
          icon: "success",
          timer: 1500,
          //  buttons: false,
        });
      }
    } catch (err) {
      swal({
        title: "Error",
        text: "Failed to update rework station",
        icon: "error",
      });
    }
  };
  // Donut Chart Component
  const ConfidenceDonut = ({ score }: { score: number }) => {
    const percentage = Math.round(score * 100);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
      if (percentage >= 80) return '#10b981';
      if (percentage >= 60) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className="transform -rotate-90" width="120" height="120">
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke={getColor()}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: getColor() }}>
            {percentage}%
          </span>
          <span className="text-xs text-gray-500 font-medium">CONFIDENCE</span>
        </div>
      </div>
    );
  };

  // Status Badge Component
  const StatusBadgeEnhanced = ({ status }: { status: string }) => {
    const isResolved = status === 'CLOSED' || status === 'RESOLVED';

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isResolved
        ? 'bg-green-100 text-green-800 border border-green-300'
        : 'bg-orange-100 text-orange-800 border border-orange-300'
        }`}>
        {isResolved ? (
          <FiCheckCircle className="w-3.5 h-3.5" />
        ) : (
          <FiAlertCircle className="w-3.5 h-3.5" />
        )}
        <span>{status.replace('_', ' ').toUpperCase()}</span>
      </div>
    );
  };

  // Creator Info Component
  const CreatorBadge = ({ user, timestamp }: { user: any; timestamp: string }) => {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FiUser className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <FiClock className="w-3 h-3 text-gray-500" />
            <p className="text-xs text-gray-600">
              {timestamp
                ? new Date(timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  };


  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className=" sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inspections for VIN</h1>
                <p className="text-sm text-gray-600">VIN: {vin}</p>
              </div>
              <Button onClick={handleBackToDashboard} variant="secondary">
                Back to Dashboard
              </Button>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Inspections</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => vin && handleFetchInspections(vin)} variant="primary">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (filteredInspections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inspections for VIN</h1>
                <p className="text-sm text-gray-600">VIN: {vin}</p>
              </div>
              <Button onClick={handleBackToDashboard} variant="secondary">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-3xl mb-3 block">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No Issues Found
                </h3>

                <p className="text-gray-600">
                  {searchTerm
                    ? `No inspections match "${searchTerm}". Try a different keyword.`
                    : `There are currently no active issues for VIN ${vin}.`}
                </p>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="secondary"
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show inspection details if an inspection is selected
  if (selectedInspectionId) {
    //const selectedInspection = inspections.find(insp => insp.inspectionId === selectedInspectionId);

    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-white to-gray-50 shadow-md border-b-2 border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-5">
              {/* Top Row - Title and Actions */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
                {/* Left Side - Title */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleBackToInspectionGrid}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                    title="Back to Inspections"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>

                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                      Inspection Details
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Review and manage inspection issues
                    </p>
                  </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToInspectionGrid}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
                  >
                    <FiGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Inspections</span>
                  </button>

                  <button
                    onClick={handleBackToDashboard}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
                  >
                    <FiHome className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                </div>
              </div>

              {/* Bottom Row - Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* VIN Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-900 rounded-lg border-2 border-indigo-200 shadow-sm">
                  <span className="text-xs font-medium">🚗 VIN:</span>
                  <span className="text-sm font-bold">{vin}</span>
                </div>

                {selectedInspectionIssues?.[0]?.workstationName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 rounded-lg border-2 border-teal-200 shadow-sm">
                    <span className="text-xs font-medium">🏭 Station:</span>
                    <span className="text-sm font-bold">
                      {selectedInspectionIssues[0].workstationName}
                    </span>
                  </div>
                )}

                {/* Checklist View Badge */}
                {selectedInspectionIssues?.[0]?.checklistView && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 rounded-lg border-2 border-blue-200 shadow-sm">
                    <span className="text-xs font-medium">📝 View:</span>
                    <span className="text-sm font-bold">
                      {selectedInspectionIssues[0].checklistView}
                    </span>
                  </div>
                )}

                {/* Inspection ID Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 rounded-lg border-2 border-green-200 shadow-sm">
                  <span className="text-xs font-medium">🔍 ID:</span>
                  <span className="text-sm font-bold">{selectedInspectionId}</span>
                </div>

                {/* Divider */}
                {filteredIssues.length > 0 && (
                  <div className="h-6 w-px bg-gray-300 mx-1"></div>
                )}

                {/* Issues Count Badge */}
                {filteredIssues.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 rounded-lg border-2 border-orange-200 shadow-sm">
                    <span className="text-xs font-medium">📊 Issues:</span>
                    <span className="text-sm font-bold">
                      {filteredIssues.length} of {selectedInspectionIssues.length}
                    </span>
                  </div>
                )}

                {/* Status Filter Badge */}
                {statusFilter !== 'all' && filteredIssues.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 rounded-lg border-2 border-purple-200 shadow-sm">
                    <span className="text-xs font-medium">🏷️ Filter:</span>
                    <span className="text-sm font-bold capitalize">{statusFilter}</span>
                  </div>
                )}

                {/* Search Term Badge */}
                {issueSearchTerm && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-900 rounded-lg border-2 border-pink-200 shadow-sm">
                    <span className="text-xs font-medium">🔎 Search:</span>
                    <span className="text-sm font-bold">"{issueSearchTerm}"</span>
                  </div>
                )}

                {/* Selected Issues Badge */}
                {selectedIssues.size > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg border-2 border-blue-800 shadow-md animate-pulse">
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Selected:</span>
                    <span className="text-sm font-bold">{selectedIssues.size}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Inspection Overview */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Inspection Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 🔊 ORIGINAL INSPECTION AUDIO */}
                  {(() => {
                    const rawOriginalAudio =
                      selectedInspectionIssues?.[0]?.audioUrl ?? null;
                    const originalAudioLink = buildFileUrl(rawOriginalAudio);

                    return originalAudioLink ? (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-purple-900">
                            🔊 Original Inspection Audio
                          </p>
                        </div>
                        <audio controls className="w-full h-8">
                          <source src={originalAudioLink} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-400 border border-gray-200">
                        Original Inspection Audio not available
                      </div>
                    );
                  })()}

                  {/* 🎙 DENOISED / ISSUE VOICE CLIP */}
                  {(() => {
                    const rawVoiceClip =
                      selectedInspectionIssues?.[0]?.denoisedAudioUrl ?? null;

                    const voiceClipLink = buildFileUrl(rawVoiceClip);
                    const baseFileName = rawVoiceClip
                      ? rawVoiceClip.split("_denoised")[0]
                      : null;
                    const transcriptFileName = baseFileName ? `${baseFileName}_transcript.txt` : null;
                    const issueTextFile = buildFileUrl(transcriptFileName);

                    return voiceClipLink ? (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-blue-900">
                            🎙️ Denoised Inspection Audio
                          </p>                         {issueTextFile && (
                            <a
                              href={issueTextFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Open text file"
                            >
                              <FiFileText size={20} />
                            </a>
                          )}
                        </div>
                        <audio controls className="w-full h-8">
                          <source src={voiceClipLink} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-400 border border-gray-200">
                        Issue Voice Recording not available
                      </div>
                    );
                  })()}
                </div>
                {/* 🚗 PV Inspection Cards - BELOW OVERVIEW */}
                {pvInspection && selectedInspectionIssues?.[0]?.workstationId === 3 && (
                  <div className="bg-white shadow rounded-lg mb-6 mt-3">
                    <div className="px-6 py-5">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        PV Inspection Details
                      </h3>

                      <div className="flex flex-wrap gap-4">
                        {/* Engine */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-indigo-50 to-blue-50 
          text-indigo-900 rounded-lg border-2 border-indigo-200 shadow-sm">
                          <span className="text-xs font-medium">⚙️ Engine:</span>
                          <span className="text-sm font-bold">
                            {pvInspection.engineNumber}
                          </span>
                        </div>

                        {/* Material */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-purple-50 to-pink-50 
          text-purple-900 rounded-lg border-2 border-purple-200 shadow-sm">
                          <span className="text-xs font-medium">🧱 Material:</span>
                          <span className="text-sm font-bold">
                            {pvInspection.material}
                          </span>
                        </div>

                        {/* Smoke */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-amber-50 to-yellow-50 
          text-amber-900 rounded-lg border-2 border-amber-200 shadow-sm">
                          <span className="text-xs font-medium">🌫 Smoke:</span>
                          <span className="text-sm font-bold">
                            {pvInspection.smoke}
                          </span>
                        </div>

                        {/* HC */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 
          bg-gradient-to-r from-green-50 to-emerald-50 
          text-green-900 rounded-lg border-2 border-green-200 shadow-sm">
                          <span className="text-xs font-medium">🧪 HC PPM:</span>
                          <span className="text-sm font-bold">
                            {pvInspection.hcPpm}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Filters */}
            {selectedInspectionIssues.length > 0 && (
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
                          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${statusFilter === 'all'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                            }`}
                        >
                          All ({statusCounts.total})
                        </button>
                        <button
                          onClick={() => setStatusFilter('open')}
                          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${statusFilter === 'open'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                            }`}
                        >
                          Open ({statusCounts.open})
                        </button>
                        <button
                          onClick={() => setStatusFilter('closed')}
                          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${statusFilter === 'closed'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                            }`}
                        >
                          Closed ({statusCounts.closed})
                        </button>
                      </div>
                    </div>

                    {/* Search Filter */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <input
                          type="text"
                          value={issueSearchTerm}
                          onChange={(e) => setIssueSearchTerm(e.target.value)}
                          placeholder="Search by issue description or ID..."
                          className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        {issueSearchTerm && (
                          <button
                            onClick={() => setIssueSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Add Issue Button */}
                      <button
                        onClick={() => setAddIssueOpen(true)}
                        className="px-4 py-2 text-sm font-medium border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition shadow-sm"
                      >
                        + Add Issue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inspection Issues - Analytics Style */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
              <div className="px-6 py-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Inspection Issues</h3>
                {filteredIssues.length > 0 ? (
                  <div className="space-y-6">
                    {filteredIssues.map((issue) => (
                      <div
                        key={issue.issueId}
                        className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                      >
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-md">
                              <span className="text-sm font-bold">#{issue.issueId}</span>
                            </div>
                            <StatusBadgeEnhanced status={issue.status} />
                            <input
                              type="checkbox"
                              checked={
                                isIssueResolved(issue.status) ||
                                selectedIssues.has(issue.issueId)
                              }
                              onChange={() => handleCheckboxChange(issue.issueId)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteIssue(issue.issueId, vin!)}
                              className={`p-2 rounded-lg transition-all ${isIssueResolved(issue.status)
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-red-500 hover:text-white hover:bg-red-500"
                                }`}
                              title={isIssueResolved(issue.status) ? "Cannot delete closed issue" : "Delete Issue"}
                              type="button"
                              disabled={isIssueResolved(issue.status)}
                            >
                              <FiTrash2 size={18} />
                            </button>

                            <Button
                              onClick={() =>
                                isIssueResolved(issue.status)
                                  ? handleAddFollowup(issue.issueId)
                                  : handleUpdateIssueStatus(issue.issueId)
                              }
                              disabled={
                                !issueComments[issue.issueId]?.trim() ||
                                updatingIssues.has(issue.issueId)
                              }
                              variant={updateSuccess[issue.issueId] ? 'secondary' : 'primary'}
                              size="small"
                              className={`min-w-[120px] shadow-md ${updateSuccess[issue.issueId]
                                ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                : ''
                                }`}
                            >
                              {updatingIssues.has(issue.issueId) ? (
                                <div className="flex items-center space-x-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  <span>...</span>
                                </div>
                              ) : updateSuccess[issue.issueId] ? (
                                <div className="flex items-center space-x-1">
                                  <span>✓</span>
                                  <span>Updated</span>
                                </div>
                              ) : isIssueResolved(issue.status) ? (
                                'Update Comment'
                              ) : (
                                'Add Comment'
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                          {/* Left Section - Description & Classified Text (2 columns) */}
                          <div className="xl:col-span-2 space-y-6">
                            {/* Issue Description */}
                            <div className="bg-white rounded-lg p-5 border-2 border-blue-100 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                  <span className="text-blue-600">📝</span>
                                  Original Issue Description
                                </h4>
                                {editingIssueId !== issue.issueId && (
                                  <button
                                    onClick={() =>
                                      handleEditClick(
                                        issue.issueId,
                                        issue.issueDescription || ''
                                      )
                                    }
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Edit description"
                                    type="button"
                                  >
                                    <FiEdit size={16} />
                                  </button>
                                )}

                              </div>

                              {editingIssueId === issue.issueId ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editedDescription || ''}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 text-sm border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(issue.issueId)}
                                      className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-700 leading-relaxed  font-semibold  text-lg">
                                  {issue.issueDescription || '—'}
                                </p>
                              )}
                            </div>

                            {/* Classified Text */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                              <h4 className="text-base font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <span>🏷️</span>
                                Classified Issue Description
                              </h4>
                              <p className="text-purple-800 font-semibold text-lg">
                                {issue.defectName || 'Not classified'}
                              </p>
                            </div>

                            {/* Rework Station */}
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-5 border-2 border-amber-200 shadow-sm">
                              <h4 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
                                <span>🔧</span>
                                Rework Station
                              </h4>
                              {editingStationForIssue === issue.issueId ? (
                                <select
                                  className="w-full border-2 border-amber-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500"
                                  value={issue.reworkStationId || ''}
                                  onChange={(e) =>
                                    handleStationChange(issue.issueId, Number(e.target.value))
                                  }
                                  onBlur={() => setEditingStationForIssue(null)}
                                >
                                  <option value="" disabled>
                                    Select Station
                                  </option>
                                  {stations.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.reworkStationName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="text-amber-800 font-semibold text-lg">
                                    {issue.reworkStationName || 'Not assigned'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStationForIssue(issue.issueId)}
                                    className="p-2 text-amber-600 hover:text-white hover:bg-amber-500 rounded-lg transition-all"
                                    title="Edit Rework Station"
                                  >
                                    <FiEdit size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Section - Analytics (1 column) */}
                          <div className="space-y-6">
                            {/* Confidence Score */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200 shadow-sm flex flex-col items-center justify-center">
                              <h4 className="text-base font-bold text-green-900 mb-4">                                Confidence Score
                              </h4>
                              <ConfidenceDonut score={issue.confidenceScore || 0} />
                            </div>

                            {/* Creator Info */}
                            <CreatorBadge
                              user={issue.createdByUser}
                              timestamp={issue.createdAt}
                            />
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-gray-50 rounded-lg p-5 border-2 border-gray-200">
                          <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span>💬</span>
                            Comments
                          </h4>

                          {/* Show previous resolution comments if resolved */}
                          {isIssueResolved(issue.status) && (
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
                              {issue.inspectionResolutionComments &&
                                issue.inspectionResolutionComments.length > 0 ? (
                                <div className="space-y-2">
                                  {issue.inspectionResolutionComments
                                    .filter((c) => c.type === 'RESOLUTION_COMMENT')
                                    .map((comment, index) => (
                                      <div key={index} className="text-gray-700 text-sm">
                                        {comment.comment}
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="text-green-600 italic font-medium">
                                  ✓ Issue resolved
                                </div>
                              )}
                            </div>
                          )}

                          {/* Comment Textarea */}
                          <textarea
                            value={issueComments[issue.issueId] || ''}
                            onChange={(e) => handleCommentChange(issue.issueId, e.target.value)}
                            placeholder={
                              isIssueResolved(issue.status)
                                ? 'Add follow-up comment...'
                                : 'Add your comments here...'
                            }
                            className="w-full p-4 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {/* <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-gray-400 text-2xl">📋</span>
                    </div> */}
                    {selectedInspectionIssues.length > 0 ? (
                      <div>
                        <p className="text-gray-600 text-xl font-semibold mb-2">
                          No matching issues found
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {statusFilter !== 'all' && `No ${statusFilter} issues found`}
                          {issueSearchTerm && ` matching "${issueSearchTerm}"`}
                          {(statusFilter !== 'all' || issueSearchTerm) &&
                            '. Try adjusting your filters.'}
                        </p>
                        {(statusFilter !== 'all' || issueSearchTerm) && (
                          <button
                            onClick={() => {
                              setStatusFilter('all');
                              setIssueSearchTerm('');
                            }}
                            className="px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-all shadow-sm"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 text-xl font-semibold mb-2">
                          No issues found
                        </p>
                        <p className="text-sm text-gray-500">
                          No issues were found for this inspection.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {filteredIssues.length > 0 && selectedIssues.size > 0 && (
                <div className="px-6 pb-6 flex justify-end">
                  <Button
                    onClick={() => {
                      setSelectedIssues(new Set());
                      setIssueComments({});
                      setUpdateSuccess({});
                    }}
                    variant="secondary"
                    className="shadow-md"
                  >
                    Clear All Selections
                  </Button>
                </div>
              )}
            </div>

            {/* Add Issue Modal */}
            {addIssueOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-black/10">

                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Add Inspection Issue
                  </h3>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newIssueDescription}
                      onChange={(e) => setNewIssueDescription(e.target.value)}
                      rows={5}
                      className="w-full p-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe the issue in detail..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setAddIssueOpen(false)}
                      className="px-5 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateIssue}
                      disabled={creatingIssue || !newIssueDescription.trim()}
                      className="px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      {creatingIssue ? 'Creating...' : 'Create Issue'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Show inspection grid (default view)
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className=" sticky top-0 z-50 bg-gradient-to-r from-white to-gray-50 shadow-md border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            {/* Top Row - Title and Actions */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
              {/* Left Side - Title */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                  title="Back to Dashboard"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    Inspections for VIN
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    View all issues for this vehicle
                  </p>
                </div>
              </div>

              {/* Right Side - Action Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToDashboard}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
                >
                  <FiHome className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </div>
            </div>

            {/* Bottom Row - Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* VIN Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-900 rounded-lg border-2 border-indigo-200 shadow-sm">
                <span className="text-xs font-medium">🚗 VIN:</span>
                <span className="text-sm font-bold">{vin}</span>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 mx-1"></div>

              {/* Inspections Count Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 rounded-lg border-2 border-green-200 shadow-sm">
                <span className="text-xs font-medium">📊 Total:</span>
                <span className="text-sm font-bold">
                  {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Search Term Badge */}
              {searchTerm && (
                <>
                  <div className="h-6 w-px bg-gray-300 mx-1"></div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-900 rounded-lg border-2 border-pink-200 shadow-sm">
                    <FiSearch className="w-4 h-4" />
                    <span className="text-xs font-medium">Search:</span>
                    <span className="text-sm font-bold">"{searchTerm}"</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search Filter */}
          {inspections.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Search Inspections</h3>
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by inspection ID..."
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
          )}

          {/* Inspections Grid */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Select an Inspection</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInspections.map((inspection) => (
                  <InspectionCard
                    key={inspection.inspectionId}
                    inspection={inspection}
                    onInspectionClick={handleInspectionClick}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default InspectionList;
