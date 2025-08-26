const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectVideoFolder: () => ipcRenderer.invoke('select-video-folder'),
  selectLogoFile: () => ipcRenderer.invoke('select-logo-file'),
  getVideoFiles: (folderPath) => ipcRenderer.invoke('get-video-files', folderPath),
  startMonitoring: (settings) => ipcRenderer.invoke('start-monitoring', settings),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  openVideoWindow: () => ipcRenderer.invoke('open-video-window'),
  closeVideoWindow: () => ipcRenderer.invoke('close-video-window'),
  sendToVideoWindow: (data) => ipcRenderer.invoke('send-to-video-window', data),
  notifyVideoEnded: () => ipcRenderer.invoke('notify-video-ended'),
  
  // Auto-updater methods
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  
  // Version history and rollback
  getVersionHistory: () => ipcRenderer.invoke('get-version-history'),
  rollbackVersion: () => ipcRenderer.invoke('rollback-version'),
  
  // Version history and rollback
  getVersionHistory: () => ipcRenderer.invoke('get-version-history'),
  rollbackVersion: () => ipcRenderer.invoke('rollback-version'),
  
  // Event listeners
  onLotNumberChanged: (callback) => {
    ipcRenderer.on('lot-number-changed', (event, lotNumber) => callback(lotNumber));
  },
  onVideoWindowClosed: (callback) => {
    ipcRenderer.on('video-window-closed', callback);
  },
  onVideoData: (callback) => {
    ipcRenderer.on('video-data', (event, data) => callback(data));
  },
  onVideoEnded: (callback) => {
    ipcRenderer.on('video-ended', callback);
  },
  onMonitoringStatus: (callback) => {
    ipcRenderer.on('monitoring-status', (event, status) => callback(status));
  },
  onSendWaitingImageToPopup: (callback) => {
    ipcRenderer.on('send-waiting-image-to-popup', callback);
  },
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, status) => callback(status));
  }
});