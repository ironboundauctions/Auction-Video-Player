import React from 'react';
import { Activity } from 'lucide-react';

interface StatusBarProps {
  status: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Activity size={16} className="text-orange-400" />
        <span>{status}</span>
        <span className="ml-auto text-gray-500">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </footer>
  );
};

export default StatusBar;