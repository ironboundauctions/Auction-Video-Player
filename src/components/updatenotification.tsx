import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, CheckCircle } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateStatus((status: string) => {
        console.log('Update status:', status);
        setUpdateStatus(status);
        
        // Show notification for important updates
        if (status.includes('available') || status.includes('ready') || status.includes('Downloading')) {
          setShowNotification(true);
        }
        
        // Hide notification when up to date
        if (status.includes('up to date')) {
          setTimeout(() => setShowNotification(false), 3000);
        }
      });
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) return;
    
    setIsChecking(true);
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.success) {
        setUpdateStatus('Checking for updates...');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.quitAndInstall();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  const getStatusIcon = () => {
    if (updateStatus.includes('Downloading')) {
      return <Download className="animate-bounce" size={20} />;
    }
    if (updateStatus.includes('ready')) {
      return <CheckCircle size={20} className="text-green-400" />;
    }
    if (updateStatus.includes('available')) {
      return <RefreshCw size={20} className="text-blue-400" />;
    }
    return <RefreshCw size={20} />;
  };

  const getStatusColor = () => {
    if (updateStatus.includes('ready')) return 'bg-green-600';
    if (updateStatus.includes('available')) return 'bg-blue-600';
    if (updateStatus.includes('Downloading')) return 'bg-orange-600';
    return 'bg-gray-600';
  };

  if (!showNotification && !updateStatus) {
    return (
      <button
        onClick={handleCheckForUpdates}
        disabled={isChecking}
        className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        title="Check for updates"
      >
        <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
        {isChecking ? 'Checking...' : 'Updates'}
      </button>
    );
  }

  return (
    <>
      {/* Update Status Button */}
      <button
        onClick={handleCheckForUpdates}
        disabled={isChecking}
        className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
        title="Check for updates"
      >
        <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
        {isChecking ? 'Checking...' : 'Updates'}
      </button>

      {/* Update Notification */}
      {showNotification && (
        <div className={`fixed top-4 right-4 ${getStatusColor()} text-white p-4 rounded-lg shadow-lg max-w-sm z-50`}>
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {updateStatus.includes('ready') && 'Update Ready!'}
                {updateStatus.includes('available') && 'Update Available'}
                {updateStatus.includes('Downloading') && 'Downloading Update'}
                {updateStatus.includes('up to date') && 'Up to Date'}
              </div>
              <div className="text-xs mt-1 opacity-90">
                {updateStatus}
              </div>
              
              {updateStatus.includes('ready') && (
                <button
                  onClick={handleInstallUpdate}
                  className="mt-2 bg-white text-gray-900 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  Restart & Install
                </button>
              )}
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateNotification;