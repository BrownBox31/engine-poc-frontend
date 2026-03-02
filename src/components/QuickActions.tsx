import React from 'react';
import Button from './button';

interface QuickActionsProps {
  onNewInspection?: () => void;
  onViewHistory?: () => void;
  onGenerateReports?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onNewInspection = () => alert('New Inspection feature will be implemented'),
  onViewHistory = () => alert('View History feature will be implemented'),
  onGenerateReports = () => alert('Generate Reports feature will be implemented')
}) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="primary"
            className="w-full"
            onClick={onNewInspection}
          >
            Start New Inspection
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onViewHistory}
          >
            View Inspection History
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onGenerateReports}
          >
            Generate Reports
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
