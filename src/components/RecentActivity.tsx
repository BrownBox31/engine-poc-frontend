import React from 'react';

interface ActivityItem {
  id: string;
  type: 'inspection' | 'approval' | 'report';
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  maxItems?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = [],
  maxItems = 10
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return 'I';
      case 'approval':
        return 'A';
      case 'report':
        return 'R';
      default:
        return '•';
    }
  };

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        {displayedActivities.length > 0 ? (
          <div className="space-y-3">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {getTypeIcon(activity.type)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className={`text-xs ${getStatusColor(activity.status)}`}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity to display</p>
            <p className="text-sm text-gray-400 mt-2">
              Start your first inspection to see activity here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
