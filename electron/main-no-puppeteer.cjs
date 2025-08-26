const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let videoWindow;

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
    // Load the built React app - fix the path
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production app from:', indexPath);
    mainWindow.loadFile(indexPath).then(() => {
      console.log('Successfully loaded production app');
    }).catch(err => {
      console.error('Failed to load production app:', err);
      // Try alternative path
      const altPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
      console.log('Trying alternative path:', altPath);
      mainWindow.loadFile(altPath).catch(err2 => {
        console.error('Alternative path also failed:', err2);
        mainWindow.loadURL('data:text/html,<h1>Error loading app</h1><p>Could not find index.html</p>');
      });
    });
    
    // Temporarily enable DevTools in production for debugging
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
    '      <video id="video-player" class="absolute inset-0 w-full h-full hidden" controls></video>',
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
    '        if (data.type === "video" && data.videoPath) {',
    '          showVideo(data.videoPath, data.lotNumber);',
    '        } else if (data.type === "logo" && data.logoPath) {',
    '          showLogo(data.logoPath);',
    '        } else if (data.type === "waiting-image" && data.imagePath) {',
    '          customWaitingImagePath = data.imagePath;',
    '          waitingImage.src = "file://" + data.imagePath;',
    '          waitingImageContainer.classList.remove("hidden");',
    '          defaultWaiting.classList.add("hidden");',
    '          console.log("Set waiting image:", data.imagePath);',
    '        } else if (data.type === "clear") {',
    '          showWaiting();',
    '        }',
    '      });',
    '    }',
    '    ',
    '    function showVideo(videoPath, lotNum) {',
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
    '      if (customWaitingImagePath) {',
    '        console.log("Showing custom waiting image:", customWaitingImagePath);',
    '        waitingImageContainer.classList.remove("hidden");',
    '        defaultWaiting.classList.add("hidden");',
    '      } else {',
    '        console.log("Showing default waiting state");',
    '        waitingImageContainer.classList.add("hidden");',
    '        defaultWaiting.classList.remove("hidden");',
    '      }',
    '      ',
    '      if (videoPlayer.src) {',
    '        videoPlayer.pause();',
    '        videoPlayer.src = "";',
    '      }',
    '    }',
    '    ',
    '    videoPlayer.addEventListener("ended", function() {',
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

// Monitoring functions - disabled without Puppeteer
ipcMain.handle('start-monitoring', async (event, settings) => {
  console.log('Website monitoring not available - Puppeteer not installed');
  return { 
    success: false, 
    message: 'Website monitoring not available in this version. Use the test buttons to simulate lot changes.' 
  };
});

ipcMain.handle('stop-monitoring', async () => {
  console.log('Monitoring stopped (was not running)');
  return { success: true, message: 'Monitoring stopped' };
});