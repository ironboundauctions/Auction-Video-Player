const { autoUpdater } = require('electron-updater');
const { dialog, app } = require('electron');
const log = require('electron-log');
const fs = require('fs').promises;
const path = require('path');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Version history management
const getVersionHistoryPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'version-history.json');
};

const saveVersionHistory = async (version, installPath) => {
  try {
    const historyPath = getVersionHistoryPath();
    let history = [];
    
    try {
      const existingHistory = await fs.readFile(historyPath, 'utf8');
      history = JSON.parse(existingHistory);
    } catch (e) {
      // File doesn't exist yet, start with empty history
    }
    
    // Add current version to history
    history.unshift({
      version: version,
      installDate: new Date().toISOString(),
      installPath: installPath
    });
    
    // Keep only last 5 versions
    history = history.slice(0, 5);
    
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    log.info('Version history saved:', version);
  } catch (error) {
    log.error('Failed to save version history:', error);
  }
};

const getVersionHistory = async () => {
  try {
    const historyPath = getVersionHistoryPath();
    const historyData = await fs.readFile(historyPath, 'utf8');
    return JSON.parse(historyData);
  } catch (error) {
    log.error('Failed to read version history:', error);
    return [];
  }
};
class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.currentVersion = app.getVersion();
    this.isUpdating = false;
    this.updateDownloaded = false;
    this.setupUpdater();
    this.saveCurrentVersion();
  }
  
  async saveCurrentVersion() {
    // Save current version to history when app starts
    await saveVersionHistory(this.currentVersion, process.execPath);
  }

  setupUpdater() {
    // Configure auto-updater
    // Don't auto-check on startup, wait for manual trigger
    autoUpdater.autoDownload = false;
    
    // Disable code signature verification for updates (since we don't have a certificate)
    process.env.ELECTRON_UPDATER_ALLOW_UNSIGNED = 'true';
    
    // Configure GitHub releases
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'ironboundauctions',
      repo: 'Auction-Video-Player'
    });
    
    console.log('Auto-updater configured for GitHub releases');

    // Event listeners
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.isUpdating = true;
      this.sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available.');
      this.sendStatusToWindow(`Update ${info.version} available`);
      
      // Show notification to user
      const response = dialog.showMessageBoxSync(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `Version ${info.version} is available`,
        detail: 'Would you like to download and install this update?',
        buttons: ['Download Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      });
      
      if (response === 0) {
        this.sendStatusToWindow('Downloading update...');
        autoUpdater.downloadUpdate();
      } else {
        this.isUpdating = false;
        this.sendStatusToWindow('Update available - click to download');
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available.');
      this.isUpdating = false;
      this.sendStatusToWindow('App is up to date');
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      this.isUpdating = false;
      this.updateDownloaded = false;
      this.sendStatusToWindow(`Update error: ${err.message}`);
      
      // Show detailed error to user
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Update Error',
        message: 'Failed to update the application',
        detail: `Error: ${err.message}\n\nThis might be due to:\n• Insufficient permissions\n• Antivirus blocking the update\n• File conflicts\n\nTry running as administrator or temporarily disable antivirus.`,
        buttons: ['OK']
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = `Download speed: ${progressObj.bytesPerSecond}`;
      log_message += ` - Downloaded ${progressObj.percent}%`;
      log_message += ` (${progressObj.transferred}/${progressObj.total})`;
      
      log.info(log_message);
      this.sendStatusToWindow(`Downloading update: ${Math.round(progressObj.percent)}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded');
      this.updateDownloaded = true;
      this.isUpdating = false;
      this.sendStatusToWindow(`Update ${info.version} ready - restart to apply`);
      
      // Save version info before update
      this.saveVersionBeforeUpdate(info.version);
      
      // Show install prompt to user
      this.promptForInstall(info);
    });
  }
  
  promptForInstall(info) {
    const response = dialog.showMessageBoxSync(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded and is ready to install.`,
      detail: 'The application will restart to complete the installation. Make sure to save any work first.',
      buttons: ['Install Now', 'Install Later'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (response === 0) {
      // User chose to install now
      this.quitAndInstall();
    } else {
      // User chose to install later
      this.sendStatusToWindow('Update ready - click "Install Now" when ready');
    }
  }
  
  async saveVersionBeforeUpdate(newVersion) {
    // Save the version we're updating to
    await saveVersionHistory(newVersion, process.execPath);
  }

  sendStatusToWindow(text) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', text);
    }
  }

  checkForUpdates() {
    if (this.isUpdating) {
      log.info('Update already in progress, skipping check');
      return;
    }
    
    if (this.updateDownloaded) {
      log.info('Update already downloaded, prompting for install');
      this.sendStatusToWindow('Update ready - restart to apply');
      return;
    }
    
    console.log('Starting update check...');
    this.isUpdating = true;
    autoUpdater.checkForUpdatesAndNotify();
  }

  quitAndInstall() {
    if (!this.updateDownloaded) {
      log.error('No update downloaded to install');
      this.sendStatusToWindow('No update ready to install');
      return;
    }
    
    try {
      log.info('Attempting to quit and install update...');
      this.sendStatusToWindow('Installing update...');
      
      // Force quit and install
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      log.error('Failed to quit and install:', error);
      this.sendStatusToWindow(`Install failed: ${error.message}`);
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Installation Failed',
        message: 'Could not install the update',
        detail: `Error: ${error.message}\n\nPlease try:\n1. Running as administrator\n2. Temporarily disabling antivirus\n3. Manually downloading from GitHub`,
        buttons: ['OK']
      });
    }
  }
  
  async getVersionHistory() {
    return await getVersionHistory();
  }
  
  async rollbackToPreviousVersion() {
    try {
      const history = await getVersionHistory();
      
      if (history.length < 2) {
        return {
          success: false,
          message: 'No previous version available for rollback'
        };
      }
      
      // Get the previous version (index 1, since index 0 is current)
      const previousVersion = history[1];
      
      const response = dialog.showMessageBoxSync(this.mainWindow, {
        type: 'warning',
        title: 'Confirm Rollback',
        message: `Rollback to version ${previousVersion.version}?`,
        detail: `This will revert your app to version ${previousVersion.version} installed on ${new Date(previousVersion.installDate).toLocaleDateString()}. You may lose some newer features.`,
        buttons: ['Rollback Now', 'Cancel'],
        defaultId: 1,
        cancelId: 1
      });
      
      if (response === 0) {
        // User confirmed rollback
        this.sendStatusToWindow(`Rolling back to version ${previousVersion.version}...`);
        
        // Note: Actual rollback implementation would require more complex logic
        // For now, we'll show instructions to the user
        dialog.showMessageBoxSync(this.mainWindow, {
          type: 'info',
          title: 'Rollback Instructions',
          message: 'Manual Rollback Required',
          detail: `To rollback to version ${previousVersion.version}:\n\n1. Download the previous installer from your releases\n2. Uninstall the current version\n3. Install the previous version\n\nAutomatic rollback will be available in a future update.`,
          buttons: ['OK']
        });
        
        return {
          success: true,
          message: `Rollback instructions shown for version ${previousVersion.version}`
        };
      }
      
      return {
        success: false,
        message: 'Rollback cancelled by user'
      };
      
    } catch (error) {
      log.error('Rollback failed:', error);
      return {
        success: false,
        message: `Rollback failed: ${error.message}`
      };
    }
  }
}

module.exports = AppUpdater;