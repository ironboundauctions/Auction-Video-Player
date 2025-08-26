const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupUpdater();
  }

  setupUpdater() {
    // Configure auto-updater
    autoUpdater.checkForUpdatesAndNotify();
    
    // Set update server URL (you'll need to set this up)
    // autoUpdater.setFeedURL({
    //   provider: 'github',
    //   owner: 'your-username',
    //   repo: 'auction-video-player'
    // });

    // Event listeners
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available.');
      this.sendStatusToWindow('Update available - downloading...');
      
      // Show notification to user
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. It will be downloaded in the background.',
        detail: `Version ${info.version} is now available. The update will be installed when you restart the app.`,
        buttons: ['OK']
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available.');
      this.sendStatusToWindow('App is up to date');
    });

    autoUpdater.on('error', (err) => {
      log.error('Error in auto-updater:', err);
      this.sendStatusToWindow('Update error occurred');
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
      this.sendStatusToWindow('Update ready - restart to apply');
      
      // Show dialog to restart now or later
      const response = dialog.showMessageBoxSync(this.mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update has been downloaded successfully!',
        detail: 'The application will restart to apply the update.',
        buttons: ['Restart Now', 'Restart Later'],
        defaultId: 0,
        cancelId: 1
      });

      if (response === 0) {
        // User chose to restart now
        autoUpdater.quitAndInstall();
      }
    });
  }

  sendStatusToWindow(text) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', text);
    }
  }

  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall();
  }
}

module.exports = AppUpdater;