const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const AppUpdater = require('./updater.cjs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Try to import puppeteer, but have fallback ready
let puppeteer = null;
let useSystemChrome = true; // Default to system Chrome for better exe compatibility

try {
  puppeteer = require('puppeteer');
  console.log('✅ Puppeteer loaded successfully');
  // Even if Puppeteer loads, prefer system Chrome in packaged apps
  if (!isDev) {
    console.log('📦 Packaged app detected, using system Chrome instead of Puppeteer');
    useSystemChrome = true;
    puppeteer = null;
  }
} catch (error) {
  console.warn('Puppeteer not available, will use system Chrome:', error.message);
  useSystemChrome = true;
}

let mainWindow;
let videoWindow;
let browser;
let page;
let isMonitoring = false;
let currentLotNumber = null;
let chromeProcess = null;
let monitoringInterval = null;
let monitoringWindow = null;
let appUpdater = null;

// Function to find Chrome executable
function findChromeExecutable() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  
  for (const chromePath of possiblePaths) {
    try {
      if (require('fs').existsSync(chromePath)) {
        console.log('Found Chrome at:', chromePath);
        return chromePath;
      }
    } catch (e) {
      // Continue checking
    }
  }
  
  console.log('No Chrome executable found');
  return null;
}

// Create a hidden monitoring window for website scraping
function createMonitoringWindow(websiteUrl) {
  if (monitoringWindow) {
    monitoringWindow.close();
  }

  monitoringWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false, // Hidden window
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      backgroundThrottling: false // Prevent throttling when hidden
    }
  });

  monitoringWindow.loadURL(websiteUrl);
  
  monitoringWindow.on('closed', () => {
    monitoringWindow = null;
  });

  return monitoringWindow;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Auction Video Player',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    show: false
  });

  if (isDev) {
    const devServerUrl = 'http://localhost:5173/';
    console.log('Loading URL:', devServerUrl);
    
    mainWindow.loadURL(devServerUrl).then(() => {
      console.log('Successfully loaded React app');
    }).catch(err => {
      console.error('Failed to load URL:', err);
      mainWindow.loadURL('data:text/html,<h1>Error: Could not connect to dev server at http://localhost:5173</h1><p>Make sure "npm run dev" is running first.</p>');
    });
    
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Load the built React app
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production app from:', indexPath);
    mainWindow.loadFile(indexPath).then(() => {
      console.log('Successfully loaded production app');
    }).catch(err => {
      console.error('Failed to load production app:', err);
      // Try alternative path for packaged app
      const altPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
      console.log('Trying alternative path:', altPath);
      mainWindow.loadFile(altPath).catch(err2 => {
        console.error('Alternative path also failed:', err2);
        mainWindow.loadURL('data:text/html,<h1>Error loading app</h1><p>Could not find index.html</p>');
      });
    });
    
    // Don't open DevTools in production
    // DevTools disabled in production
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize auto-updater (only in production)
    if (!isDev) {
      appUpdater = new AppUpdater(mainWindow);
      
      // Check for updates 30 seconds after app starts
      setTimeout(() => {
        if (appUpdater) {
          appUpdater.checkForUpdates();
        }
      }, 30000);
    }
    
    // Initialize auto-updater (only in production)
    if (!isDev) {
      appUpdater = new AppUpdater(mainWindow);
      
      // Check for updates 30 seconds after app starts
      setTimeout(() => {
        if (appUpdater) {
          appUpdater.checkForUpdates();
        }
      }, 30000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (videoWindow) {
      videoWindow.close();
    }
  });
}

function createVideoWindow() {
  if (videoWindow) {
    videoWindow.focus();
    return;
  }

  videoWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    title: 'Auction Video Player',
    show: false,
    autoHideMenuBar: true
  });

  const videoPlayerHTML = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Video Player</title>',
    '  <script src="https://cdn.tailwindcss.com"></script>',
    '</head>',
    '<body class="bg-gray-900 text-white">',
    '  <div class="min-h-screen relative">',
    '    <main class="absolute inset-0 flex items-center justify-center">',
    '      <div id="waiting-state" class="absolute inset-0 flex items-center justify-center">',
    '        <div id="waiting-image-container" class="hidden absolute inset-0 flex items-center justify-center">',
    '          <img id="waiting-image" class="w-full h-full object-cover" alt="Waiting">',
    '        </div>',
    '        <div id="default-waiting" class="text-center text-gray-400 z-10">',
    '          <div class="text-6xl mb-4">📺</div>',
    '          <p class="text-xl">Waiting for video...</p>',
    '          <p class="text-sm mt-2">Videos will appear here when lot numbers change</p>',
    '        </div>',
    '      </div>',
    '      <video id="video-player" class="absolute inset-0 w-full h-full hidden" controls muted></video>',
    '      <div id="logo-container" class="hidden cursor-pointer absolute inset-0 flex items-center justify-center">',
    '        <img id="logo-image" class="w-full h-full object-contain" alt="Logo">',
    '      </div>',
    '    </main>',
    '    <!-- Floating lot info overlay -->',
    '    <div id="lot-info" class="absolute top-4 left-4 bg-black bg-opacity-70 px-3 py-2 rounded-lg text-sm hidden z-20">',
    '      <span class="text-gray-300">Lot: </span>',
    '      <span id="lot-number" class="text-white font-bold"></span>',
    '    </div>',
    '  </div>',
    '  <script>',
    '    const videoPlayer = document.getElementById("video-player");',
    '    const logoContainer = document.getElementById("logo-container");',
    '    const logoImage = document.getElementById("logo-image");',
    '    const waitingState = document.getElementById("waiting-state");',
    '    const waitingImageContainer = document.getElementById("waiting-image-container");',
    '    const waitingImage = document.getElementById("waiting-image");',
    '    const defaultWaiting = document.getElementById("default-waiting");',
    '    const lotInfo = document.getElementById("lot-info");',
    '    const lotNumber = document.getElementById("lot-number");',
    '    ',
    '    let customWaitingImagePath = null;',
    '    ',
    '    if (window.electronAPI) {',
    '      window.electronAPI.onVideoData(function(data) {',
    '        console.log("POPUP: Received data:", data);',
    '        ',
    '        // IMMEDIATELY stop any playing video when receiving ANY command',
    '        if (videoPlayer.src && !videoPlayer.paused) {',
    '          console.log("POPUP: FORCE STOPPING current video before processing new command");',
    '          videoPlayer.pause();',
    '          videoPlayer.removeAttribute("src");',
    '          videoPlayer.load();',
    '          videoPlayer.currentTime = 0;',
    '        }',
    '        ',
    '        if (data.type === "video" && data.videoPath) {',
    '          showVideo(data.videoPath, data.lotNumber);',
    '        } else if (data.type === "logo" && data.logoPath) {',
    '          showLogo(data.logoPath);',
    '        } else if (data.type === "waiting-image" && data.imagePath) {',
    '          customWaitingImagePath = data.imagePath;',
    '          console.log("POPUP: Setting waiting image to:", data.imagePath);',
    '          waitingImage.src = "file://" + data.imagePath;',
    '          waitingImage.onload = function() {',
    '            console.log("POPUP: Waiting image loaded successfully");',
    '            waitingImageContainer.classList.remove("hidden");',
    '            defaultWaiting.classList.add("hidden");',
    '          };',
    '          waitingImage.onerror = function() {',
    '            console.log("POPUP: Failed to load waiting image");',
    '          };',
    '          // Immediately show waiting state after setting image',
    '          showWaiting();',
    '        } else if (data.type === "clear") {',
    '          showWaiting();',
    '        }',
    '      });',
    '    }',
    '    ',
    '    function showVideo(videoPath, lotNum) {',
    '      // FIRST: Force stop any existing video',
    '      if (videoPlayer.src) {',
    '        videoPlayer.pause();',
    '        videoPlayer.removeAttribute("src");',
    '        videoPlayer.load();',
    '        videoPlayer.currentTime = 0;',
    '      }',
    '      ',
    '      // Reset play count for new video',
    '      videoPlayer.playCount = 0;',
    '      ',
    '      waitingState.classList.add("hidden");',
    '      logoContainer.classList.add("hidden");',
    '      videoPlayer.classList.remove("hidden");',
    '      videoPlayer.src = "file://" + videoPath;',
    '      videoPlayer.load();',
    '      videoPlayer.play();',
    '      ',
    '      if (lotNum) {',
    '        lotNumber.textContent = lotNum;',
    '        lotInfo.classList.remove("hidden");',
    '      } else {',
    '        lotInfo.classList.add("hidden");',
    '      }',
    '    }',
    '    ',
    '    function showLogo(logoPath) {',
    '      // FORCE STOP video when showing logo',
    '      if (videoPlayer.src) {',
    '        console.log("POPUP: FORCE STOPPING video for logo display");',
    '        videoPlayer.pause();',
    '        videoPlayer.removeAttribute("src");',
    '        videoPlayer.load();',
    '        videoPlayer.currentTime = 0;',
    '      }',
    '      ',
    '      waitingState.classList.add("hidden");',
    '      videoPlayer.classList.add("hidden");',
    '      lotInfo.classList.add("hidden");',
    '      logoImage.src = "file://" + logoPath;',
    '      logoContainer.classList.remove("hidden");',
    '    }',
    '    ',
    '    function showWaiting() {',
    '      videoPlayer.classList.add("hidden");',
    '      logoContainer.classList.add("hidden");',
    '      lotInfo.classList.add("hidden");',
    '      waitingState.classList.remove("hidden");',
    '      ',
    '      // FORCE STOP any playing video IMMEDIATELY',
    '      if (videoPlayer.src) {',
    '        console.log("POPUP: FORCE STOPPING video playback");',
    '        videoPlayer.pause();',
    '        videoPlayer.removeAttribute("src");',
    '        videoPlayer.load();',
    '        videoPlayer.currentTime = 0;',
    '        // Force remove all source elements',
    '        while (videoPlayer.firstChild) {',
    '          videoPlayer.removeChild(videoPlayer.firstChild);',
    '        }',
    '      }',
    '      ',
    '      console.log("POPUP: showWaiting called, customWaitingImagePath:", customWaitingImagePath);',
    '      if (customWaitingImagePath) {',
    '        console.log("POPUP: Showing custom waiting image");',
    '        waitingImageContainer.classList.remove("hidden");',
    '        defaultWaiting.classList.add("hidden");',
    '      } else {',
    '        console.log("POPUP: Showing default waiting (TV icon)");',
    '        waitingImageContainer.classList.add("hidden");',
    '        defaultWaiting.classList.remove("hidden");',
    '      }',
    '    }',
    '    ',
    '    videoPlayer.addEventListener("ended", function() {',
    '      // Track play count for replaying',
    '      if (!videoPlayer.playCount) videoPlayer.playCount = 0;',
    '      videoPlayer.playCount++;',
    '      ',
    '      console.log("POPUP: Video ended, play count:", videoPlayer.playCount);',
    '      ',
    '      if (videoPlayer.playCount < 2) {',
    '        console.log("POPUP: Replaying video...");',
    '        videoPlayer.currentTime = 0;',
    '        videoPlayer.play().catch(console.error);',
    '        return;',
    '      }',
    '      ',
    '      console.log("POPUP: Video ended, notifying main window");',
    '      // FORCE STOP and hide video immediately',
    '      videoPlayer.classList.add("hidden");',
    '      videoPlayer.pause();',
    '      videoPlayer.removeAttribute("src");',
    '      videoPlayer.load();',
    '      videoPlayer.currentTime = 0;',
    '      videoPlayer.playCount = 0; // Reset for next video',
    '      ',
    '      // Show waiting state',
    '      showWaiting();',
    '      ',
    '      // Notify main window',
    '      if (window.electronAPI && window.electronAPI.notifyVideoEnded) {',
    '        window.electronAPI.notifyVideoEnded();',
    '      }',
    '    });',
    '  </script>',
    '</body>',
    '</html>'
  ].join('\n');
  
  videoWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(videoPlayerHTML));

  videoWindow.once('ready-to-show', () => {
    videoWindow.show();
    
    // Send waiting image immediately when window opens
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('send-waiting-image-to-popup');
      }
    }, 1000);
  });

  videoWindow.on('closed', () => {
    videoWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('video-window-closed');
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (browser) {
    browser.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('open-video-window', async () => {
  createVideoWindow();
  return { success: true };
});

ipcMain.handle('close-video-window', async () => {
  if (videoWindow) {
    videoWindow.close();
  }
  return { success: true };
});

ipcMain.handle('send-to-video-window', async (event, data) => {
  if (videoWindow && !videoWindow.isDestroyed()) {
    videoWindow.webContents.send('video-data', data);
    return { success: true };
  }
  return { success: false, message: 'Video window not available' };
});

ipcMain.handle('notify-video-ended', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('video-ended');
  }
  return { success: true };
});

// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  if (appUpdater) {
    appUpdater.checkForUpdates();
    return { success: true, message: 'Checking for updates...' };
  }
  return { success: false, message: 'Auto-updater not available in development' };
});

ipcMain.handle('quit-and-install', async () => {
  if (appUpdater) {
    appUpdater.quitAndInstall();
    return { success: true };
  }
  return { success: false, message: 'No update available' };
});

// Version history and rollback handlers
ipcMain.handle('get-version-history', async () => {
  if (appUpdater) {
    const history = await appUpdater.getVersionHistory();
    return { success: true, history };
  }
  return { success: false, message: 'Version history not available' };
});

ipcMain.handle('rollback-version', async () => {
  if (appUpdater) {
    const result = await appUpdater.rollbackToPreviousVersion();
    return result;
  }
  return { success: false, message: 'Rollback not available' };
});


ipcMain.handle('select-video-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Video Folder'
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-logo-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Select Logo Image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-video-files', async (event, folderPath) => {
  console.log('=== GET-VIDEO-FILES IPC HANDLER ===');
  console.log('Requested folder path:', folderPath);
  
  try {
    console.log('Reading directory...');
    const files = await fs.readdir(folderPath);
    console.log('Found files:', files);
    
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'];
    
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      console.log(`File: ${file}, Extension: ${ext}, Is video: ${videoExtensions.includes(ext)}`);
      return videoExtensions.includes(ext);
    });
    
    console.log('Filtered video files:', videoFiles);
    
    const result = videoFiles.map(file => {
      const lotNumber = extractLotNumber(file);
      console.log(`Processing ${file} -> lot ${lotNumber}`);
      return {
      name: file,
      path: path.join(folderPath, file),
      lotNumber: lotNumber
      };
    });
    
    console.log('Final result:', result);
    console.log('=== END GET-VIDEO-FILES IPC HANDLER ===');
    return result;
  } catch (error) {
    console.error('Error reading video folder:', error);
    console.error('Error details:', error.message);
    console.log('=== END GET-VIDEO-FILES IPC HANDLER (ERROR) ===');
    return [];
  }
});

function extractLotNumber(filename) {
  console.log('Extracting lot number from filename:', filename);
  const match = filename.match(/(?:lot|video)?[_-]?(\d+)/i);
  const result = match ? match[1].padStart(3, '0') : null;
  console.log('Extracted lot number:', result);
  return result;
}

// Monitoring functions
ipcMain.handle('start-monitoring', async (event, settings) => {
  console.log('Starting monitoring with settings:', settings);
  
  const sendStatus = (message) => {
    console.log('Sending status to renderer:', message);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('monitoring-status', message);
    }
  };
  
  if (isMonitoring) {
    return { success: false, message: 'Already monitoring' };
  }

  try {
    sendStatus('Starting website monitoring...');
    
    // Create hidden monitoring window
    sendStatus('Creating monitoring window...');
    monitoringWindow = createMonitoringWindow(settings.websiteUrl);
    
    isMonitoring = true;
    sendStatus('Starting monitoring loop...');
    
    // Start monitoring with the hidden window
    monitorWebsiteWithWindow(settings, sendStatus);
    
    return { success: true, message: 'Monitoring started' };
  } catch (error) {
    console.error('Error starting monitoring:', error);
    sendStatus(`Error: ${error.message}`);
    isMonitoring = false;
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-monitoring', async () => {
  console.log('Stopping monitoring...');
  isMonitoring = false;
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  if (monitoringWindow) {
    monitoringWindow.close();
    monitoringWindow = null;
  }
  
  if (browser) {
    console.log('Closing browser...');
    await browser.close();
    browser = null;
    page = null;
  }
  
  if (chromeProcess) {
    console.log('Killing Chrome process...');
    chromeProcess.kill();
    chromeProcess = null;
  }
  
  console.log('Monitoring stopped');
  return { success: true, message: 'Monitoring stopped' };
});

// New monitoring function using hidden Electron window (works in packaged apps)
async function monitorWebsiteWithWindow(settings, sendStatus) {
  console.log('Starting window-based monitoring...');
  
  if (!sendStatus) {
    sendStatus = (message) => {
      console.log('Sending status to renderer:', message);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('monitoring-status', message);
      }
    };
  }
  
  let iterationCount = 0;
  
  const checkLotNumber = async () => {
    if (!isMonitoring || !monitoringWindow || monitoringWindow.isDestroyed()) {
      console.log('Monitoring stopped or window destroyed');
      return;
    }
    
    try {
      iterationCount++;
      console.log(`Window monitoring iteration ${iterationCount}`);
      sendStatus(`Checking website... (${iterationCount})`);
      
      // Execute JavaScript in the hidden monitoring window
      const result = await monitoringWindow.webContents.executeJavaScript(`
        (() => {
          try {
            // Try user's selector first
            let element = document.querySelector('${settings.lotNumberSelector}');
            if (element) {
              const text = element.textContent || element.innerText || '';
              const match = text.match(/\\d+/);
              if (match) {
                return {
                  success: true,
                  lotNumber: match[0].padStart(3, '0'),
                  source: 'user-selector',
                  text: text.trim().substring(0, 50)
                };
              }
            }
            
            // Try common selectors as fallback
            const commonSelectors = [
              '#lblLotNo',
              '#lblLotNo span',
              '#lotNumber',
              '#lot-number',
              '.lot-number',
              '.current-lot',
              '.lot-label',
              'span.lot-label',
              '[data-lot-number]',
              '.lot-display',
              '.auction-lot'
            ];
            
            for (const selector of commonSelectors) {
              try {
                element = document.querySelector(selector);
                if (element) {
                  const text = element.textContent || element.innerText || '';
                  const match = text.match(/\\d+/);
                  if (match) {
                    return {
                      success: true,
                      lotNumber: match[0].padStart(3, '0'),
                      source: selector,
                      text: text.trim().substring(0, 50)
                    };
                  }
                }
              } catch (e) {
                // Skip invalid selectors
              }
            }
            
            return {
              success: false,
              error: 'No lot number found',
              url: window.location.href,
              title: document.title
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        })()
      `);
      
      if (result.success && result.lotNumber) {
        const lotNumber = result.lotNumber;
        console.log(`Found lot number: ${lotNumber} (source: ${result.source})`);
        sendStatus(`✅ Found lot: ${lotNumber} via ${result.source}`);
        
        if (lotNumber !== currentLotNumber) {
          console.log(`🎯 LOT CHANGED: ${currentLotNumber} -> ${lotNumber}`);
          currentLotNumber = lotNumber;
          sendStatus(`🎯 LOT CHANGED: ${lotNumber}`);
          
          // Send to main window
          if (mainWindow && !mainWindow.isDestroyed()) {
            console.log('📤 Sending lot number change to main window');
            mainWindow.webContents.send('lot-number-changed', lotNumber);
          }
        } else {
          sendStatus(`Lot unchanged: ${lotNumber}`);
        }
      } else {
        console.log('No lot number found:', result.error);
        sendStatus(`❌ ${result.error || 'No lot number detected'}`);
      }
      
      // Reload page periodically
      if (iterationCount % 20 === 0) {
        console.log('🔄 Reloading monitoring page...');
        sendStatus('🔄 Refreshing page...');
        try {
          await monitoringWindow.webContents.reload();
          sendStatus('✅ Page refreshed');
        } catch (reloadError) {
          console.error('Reload failed:', reloadError);
          sendStatus(`Reload failed: ${reloadError.message}`);
        }
      }
      
    } catch (error) {
      console.error('Window monitoring error:', error);
      sendStatus(`Monitoring error: ${error.message}`);
      
      // Try to recreate window if it's destroyed
      if (error.message.includes('destroyed') || error.message.includes('closed')) {
        console.log('Recreating monitoring window...');
        sendStatus('Recreating monitoring window...');
        try {
          monitoringWindow = createMonitoringWindow(settings.websiteUrl);
          sendStatus('✅ Monitoring window recreated');
        } catch (recreateError) {
          console.error('Failed to recreate window:', recreateError);
          sendStatus(`Failed to recreate window: ${recreateError.message}`);
          isMonitoring = false;
        }
      }
    }
  };
  
  // Check every 3 seconds
  monitoringInterval = setInterval(checkLotNumber, 3000);
  
  // Run first check immediately
  setTimeout(checkLotNumber, 2000);
  
  console.log('Window-based monitoring started');
  sendStatus('✅ Website monitoring active');
}