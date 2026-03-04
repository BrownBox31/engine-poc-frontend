import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import Button from '../components/button';
import InspectionsTable from '../components/InspectionsTable';
import { navigationUtils } from '../services/routes/constants';
import apiService from '../services/data/api_service_class';
import { ApiEndpoints } from '../services/data/apis';
import type { VehicleInspection, InspectionListResponse } from '../interfaces/inspection';
import { FiActivity, FiBarChart2, FiLogOut } from 'react-icons/fi';
import { BiUserVoice } from 'react-icons/bi';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<VehicleInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get<InspectionListResponse>(ApiEndpoints.ALL_INSPECTIONS);
      // The API is returning the data directly, not wrapped in a data property
      let fetchedInspections: VehicleInspection[] = [];
      if (Array.isArray(response)) {
        // Response is directly an array
        fetchedInspections = response;
      } else if (response && typeof response === 'object') {
        // Check if response has a data property
        if ('data' in response && Array.isArray(response.data)) {
          fetchedInspections = response.data;
        } else if ('data' in response && response.data && typeof response.data === 'object') {
          // Check if data has an inspections property
          const responseData = response.data as InspectionListResponse;
          if ('inspections' in responseData && Array.isArray(responseData.inspections)) {
            fetchedInspections = responseData.inspections;
          }
        }
      }

      setInspections(fetchedInspections);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setInspections([]);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigationUtils.logout();
  };

  const handleInspectionClick = (inspection: VehicleInspection) => {
    navigate(`/inspection/${inspection.vin}`);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inspections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className=" sticky top-0 z-50 bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-lg border-b-2 border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            {/* Top Row - Title and Actions */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              {/* Left Side - Title and Branding */}
              <div className="flex items-center gap-4">
                {/* Logo/Icon */}
                {/* <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                <span className="text-3xl">🚗</span>
              </div> */}

                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    Vehicle Inspection Expert
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <FiActivity className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-600">
                      Dashboard Overview
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex items-center gap-3">
                    <button
                  onClick={() => navigate('/EngineInspector')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
                >
                  <BiUserVoice className="w-4 h-4" />
                  <span>Record Inspection</span>
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
                >
                  <FiBarChart2 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <InspectionsTable
            inspections={inspections}
            isLoading={isLoading}
            onInspectionClick={handleInspectionClick}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
