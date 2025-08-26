declare global {
  interface Window {
    electronAPI: {
      selectVideoFolder: () => Promise<string | null>;
      selectLogoFile: () => Promise<string | null>;
      getVideoFiles: (folderPath: string) => Promise<Array<{
        name: string;
        path: string;
        lotNumber: string | null;
      }>>;
      startMonitoring: (settings: any) => Promise<{
        success: boolean;
        message: string;
      }>;
      stopMonitoring: () => Promise<{
        success: boolean;
        message: string;
      }>;
      openVideoWindow: () => Promise<{ success: boolean }>;
      closeVideoWindow: () => Promise<{ success: boolean }>;
      sendToVideoWindow: (data: any) => Promise<{ success: boolean; message?: string }>;
      notifyVideoEnded: () => Promise<{ success: boolean }>;
      
      // Auto-updater methods
      checkForUpdates: () => Promise<{ success: boolean; message: string }>;
      quitAndInstall: () => Promise<{ success: boolean; message?: string }>;
      
      // Version history and rollback
      getVersionHistory: () => Promise<{ success: boolean; history?: any[]; message?: string }>;
      rollbackVersion: () => Promise<{ success: boolean; message: string }>;
      
      onLotNumberChanged: (callback: (lotNumber: string) => void) => void;
      onMonitoringStatus: (callback: (status: string) => void) => void;
      onVideoWindowClosed: (callback: () => void) => void;
      onVideoData: (callback: (data: any) => void) => void;
      onVideoEnded: (callback: () => void) => void;
      onSendWaitingImageToPopup?: (callback: () => void) => void;
      onUpdateStatus: (callback: (status: string) => void) => void;
    };
  }
}

export {};