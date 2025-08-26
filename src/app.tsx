import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Square, Monitor, FolderOpen, Image, AlertCircle, ExternalLink, X } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import SettingsPanel from './components/SettingsPanel';
import StatusBar from './components/StatusBar';

interface AppSettings {
  websiteUrl: string;
  lotNumberSelector: string;
  videoFolderPath: string;
  logoPath: string;
  waitingImagePath: string;
  autoPlay: boolean;
}

interface VideoFile {
  name: string;
  path: string;
  lotNumber: string | null;
}

function App() {
  const [settings, setSettings] = useState<AppSettings>({
    websiteUrl: 'https://bid.ironboundauctions.com/auctions/live-sale/id/170',
    lotNumberSelector: 'span.lot-label',
    videoFolderPath: 'C:\\Users\\ironb\\OneDrive\\Desktop\\Auction Video Player\\Active auction videos',
    logoPath: '',
    waitingImagePath: 'C:\\Users\\ironb\\Downloads\\ironbound_primarylogog.png',
    autoPlay: true
  });
  
  const [showSettings, setShowSettings] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentLotNumber, setCurrentLotNumber] = useState<string | null>(null);
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [showWaiting, setShowWaiting] = useState(true);
  const [currentState, setCurrentState] = useState<'waiting' | 'video' | 'logo'>('waiting');
  const [status, setStatus] = useState<string>('Ready to start');
  const [videoWindowOpen, setVideoWindowOpen] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      // Listen for lot number changes
      window.electronAPI.onLotNumberChanged((lotNumber: string) => {
        console.log('🎯 Lot number changed event received:', lotNumber);
        setCurrentLotNumber(lotNumber);
      });

      // Listen for monitoring status updates

      // Listen for video window events
      window.electronAPI.onVideoWindowClosed(() => {
        console.log('Video window closed');
        setVideoWindowOpen(false);
      });

      window.electronAPI.onVideoEnded(() => {
        console.log('Video ended in popup window');
        handleVideoEnd();
      });
    }
  }, [settings.logoPath, settings.waitingImagePath, videoWindowOpen]);

  const handleVideoEnd = () => {
    console.log('🏁 Video ended - handling transition');
    
    if (settings.logoPath) {
      console.log('📺 Showing logo after video end');
      setCurrentState('logo');
      setShowLogo(true);
      setShowWaiting(false);
      setCurrentVideo(null);
      setStatus('Displaying logo');
      
      // Send logo to popup
      if (videoWindowOpen && window.electronAPI) {
        window.electronAPI.sendToVideoWindow({
          type: 'logo',
          logoPath: settings.logoPath
        });
      }
    } else {
      console.log('📺 Showing waiting image after video end');
      setCurrentState('waiting');
      setShowLogo(false);
      setShowWaiting(true);
      setCurrentVideo(null);
      setStatus('Video completed - showing waiting screen');
      
      // Send waiting to popup
      if (videoWindowOpen && window.electronAPI) {
        if (settings.waitingImagePath) {
          window.electronAPI.sendToVideoWindow({
            type: 'waiting-image',
            imagePath: settings.waitingImagePath
          });
        } else {
          window.electronAPI.sendToVideoWindow({
            type: 'clear'
          });
        }
      }
    }
  };

  // Also handle video end in main window
  const handleMainVideoEnd = () => {
    console.log('🏁 Main window video ended');
    handleVideoEnd();
  };
      
  // Listen for request to send waiting image to popup
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onSendWaitingImageToPopup?.(() => {
        if (settings.waitingImagePath && videoWindowOpen) {
          window.electronAPI.sendToVideoWindow({
            type: 'waiting-image',
            imagePath: settings.waitingImagePath
          });
        }
      });
    }
  }, []);

  // Send waiting image to popup when it opens or settings change
  useEffect(() => {
    if (videoWindowOpen && settings.waitingImagePath && window.electronAPI) {
      console.log('=== MAIN: Sending waiting image to popup ===', settings.waitingImagePath);
      window.electronAPI.sendToVideoWindow({
        type: 'waiting-image',
        imagePath: settings.waitingImagePath
      }).then(result => {
        console.log('=== MAIN: Waiting image send result ===', result);
      }).catch(error => {
        console.error('=== MAIN: Failed to send waiting image ===', error);
      });
    }
  }, [videoWindowOpen, settings.waitingImagePath]);

  // Handle lot number changes
  useEffect(() => {
    if (currentLotNumber && videoFiles.length > 0 && settings.autoPlay) {
      console.log('🔍 Lot number changed effect triggered for:', currentLotNumber);
      console.log('🔍 Video files available:', videoFiles.length);
      console.log('🔍 Auto-play enabled:', settings.autoPlay);
      
      handleLotNumberChange(currentLotNumber);
    }
  }, [currentLotNumber, videoFiles, settings.autoPlay]);

  const loadVideoFiles = async () => {
    if (!window.electronAPI || !window.electronAPI.getVideoFiles) {
      setStatus('File system access not available');
      return;
    }
    
    try {
      console.log('📁 Loading video files from:', settings.videoFolderPath);
      const files = await window.electronAPI.getVideoFiles(settings.videoFolderPath);
      console.log('📁 Loaded video files:', files);
      setVideoFiles(files);
      setStatus(`Loaded ${files.length} video files`);
    } catch (error) {
      console.error('Error loading video files:', error);
      setStatus('Error loading video files');
    }
  };

  const handleLotNumberChange = (lotNumber: string) => {
    console.log('🎬 handleLotNumberChange called with:', lotNumber);
    console.log('🎬 Available video files:', videoFiles.map(v => `${v.name} -> ${v.lotNumber}`));
    
    const matchingVideo = videoFiles.find(video => {
      console.log(`🔍 Comparing: "${video.lotNumber}" === "${lotNumber}"`);
      return video.lotNumber === lotNumber;
    });
    
    if (matchingVideo) {
      console.log('✅ Found matching video:', matchingVideo.name);
      // Immediately update state to show video
      setCurrentVideo(matchingVideo.path);
      setShowLogo(false);
      setShowWaiting(false);
      setCurrentState('video');
      setStatus(`Playing video for lot ${lotNumber}: ${matchingVideo.name}`);
      
      // Send to video window if open
      if (videoWindowOpen && window.electronAPI) {
        window.electronAPI.sendToVideoWindow({
          type: 'video',
          videoPath: matchingVideo.path,
          lotNumber: lotNumber
        });
      }
    } else {
      console.log('❌ No matching video found for lot:', lotNumber);
      console.log('Available lot numbers:', videoFiles.map(v => v.lotNumber).filter(Boolean));
      
      // IMMEDIATELY stop any playing video and show waiting
      setCurrentVideo(null);
      setShowLogo(false);
      setShowWaiting(true);
      setCurrentState('waiting');
      setStatus(`No video found for lot ${lotNumber}`);
      
      // Send waiting state to popup immediately
      if (videoWindowOpen && window.electronAPI) {
        console.log('🛑 SENDING IMMEDIATE STOP TO POPUP for lot with no video');
        // First send clear to stop video immediately
        window.electronAPI.sendToVideoWindow({
          type: 'clear'
        });
        
        // Then send waiting image if available
        if (settings.waitingImagePath) {
          setTimeout(() => {
            window.electronAPI.sendToVideoWindow({
              type: 'waiting-image',
              imagePath: settings.waitingImagePath
            });
          }, 100);
        }
      }
    }
  };

  const handleVideoDoubleClick = (video: VideoFile) => {
    console.log('🖱️ Double-clicked video:', video.name);
    
    // Manually play the selected video
    setCurrentVideo(video.path);
    setShowLogo(false);
    setShowWaiting(false);
    setCurrentState('video');
    setStatus(`Manually playing: ${video.name} (Lot ${video.lotNumber || 'Unknown'})`);
    
    // Send to video window if open
    if (videoWindowOpen && window.electronAPI) {
      window.electronAPI.sendToVideoWindow({
        type: 'video',
        videoPath: video.path,
        lotNumber: video.lotNumber || 'Manual'
      });
    }
  };
  const startMonitoring = async () => {
    if (!window.electronAPI) return;
    
    if (!settings.websiteUrl || !settings.lotNumberSelector) {
      setStatus('Please configure website URL and lot number selector');
      return;
    }

    try {
      const result = await window.electronAPI.startMonitoring(settings);
      if (result.success) {
        setIsMonitoring(true);
        setStatus('Monitoring auction website...');
      } else {
        setStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      setStatus('Failed to start monitoring');
    }
  };

  const stopMonitoring = async () => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.stopMonitoring();
      setIsMonitoring(false);
      setStatus('Monitoring stopped');
      setMonitoringStatus([]);
    } catch (error) {
      setStatus('Error stopping monitoring');
    }
  };

  const openVideoWindow = async () => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.openVideoWindow();
      setVideoWindowOpen(true);
      
      // Wait a moment for popup to load, then send waiting image
      setTimeout(async () => {
        if (settings.waitingImagePath) {
          console.log('MAIN: Sending waiting image to popup:', settings.waitingImagePath);
          await window.electronAPI.sendToVideoWindow({
            type: 'waiting-image',
            imagePath: settings.waitingImagePath
          });
        }
        
        // Then send current state
        if (currentState === 'video' && currentVideo) {
          await window.electronAPI.sendToVideoWindow({
            type: 'video',
            videoPath: currentVideo,
            lotNumber: currentLotNumber
          });
        } else if (currentState === 'logo' && settings.logoPath) {
          await window.electronAPI.sendToVideoWindow({
            type: 'logo',
            logoPath: settings.logoPath
          });
        } else {
          await window.electronAPI.sendToVideoWindow({
            type: 'clear'
          });
        }
      }, 2000); // Wait 2 seconds for popup to fully load
      
    } catch (error) {
      console.error('Error opening video window:', error);
    }
  };

  const closeVideoWindow = async () => {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.closeVideoWindow();
      setVideoWindowOpen(false);
    } catch (error) {
      console.error('Error closing video window:', error);
    }
  };


  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-900">
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
          onSave={loadVideoFiles}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-400">Auction Video Player</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Settings size={18} />
              Settings
            </button>
            
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Play size={18} />
                Start Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Square size={18} />
                Stop Monitoring
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Status Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={20} className="text-orange-400" />
                <span className="font-semibold">Current Lot</span>
              </div>
              <span className="text-2xl font-bold">
                {currentLotNumber || 'Waiting...'}
              </span>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={20} className="text-green-400" />
                <span className="font-semibold">Videos Loaded</span>
              </div>
              <span className="text-2xl font-bold">{videoFiles.length}</span>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className={isMonitoring ? 'text-green-400' : 'text-yellow-400'} />
                <span className="font-semibold">Status</span>
              </div>
              <span className={`font-semibold ${isMonitoring ? 'text-green-400' : 'text-yellow-400'}`}>
                {isMonitoring ? 'Monitoring' : 'Stopped'}
              </span>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink size={20} className={videoWindowOpen ? 'text-blue-400' : 'text-gray-400'} />
                <span className="font-semibold">Video Window</span>
              </div>
              <div className="flex gap-2">
                {!videoWindowOpen ? (
                  <button
                    onClick={openVideoWindow}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Open
                  </button>
                ) : (
                  <button
                    onClick={closeVideoWindow}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Video Player */}
          {/* Main Content Area - Video Player and Files List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Video Player */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-300">Main Video Player</h3>
              
              {currentVideo ? (
                <VideoPlayer
                  videoPath={currentVideo}
                  onVideoEnd={handleMainVideoEnd}
                  isFullscreen={isFullscreen}
                  setIsFullscreen={setIsFullscreen}
                />
              ) : showLogo && settings.logoPath ? (
                <div className="flex items-center justify-center min-h-96 bg-gray-900 rounded-lg">
                  <img
                    src={`file://${settings.logoPath}`}
                    alt="Logo"
                    className="max-w-full max-h-96 object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-96 bg-gray-900 rounded-lg">
                  {showWaiting && settings.waitingImagePath ? (
                    <img
                      src={`file://${settings.waitingImagePath}`}
                      alt="Waiting"
                      className="max-w-full max-h-96 object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-4">📺</div>
                      <p className="text-xl">Waiting for video...</p>
                      <p className="text-sm mt-2">
                        {isMonitoring 
                          ? 'Monitoring auction website for lot number changes'
                          : 'Click "Start Monitoring" to begin watching the auction'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Video Files List - Right Side */}
            {videoFiles.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-orange-300">
                  Loaded Videos ({videoFiles.length})
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {videoFiles.map((video, index) => (
                    <div 
                      key={index} 
                      onDoubleClick={() => handleVideoDoubleClick(video)}
                      className={`bg-gray-700 p-3 rounded-lg transition-colors ${
                        currentVideo === video.path ? 'ring-2 ring-orange-400 bg-orange-900' : 'hover:bg-gray-600 cursor-pointer'
                      }`}
                      title="Double-click to play this video"
                    >
                      <div className="font-semibold text-white text-sm mb-1 truncate" title={video.name}>
                        {video.name}
                      </div>
                      <div className="text-xs text-gray-300">
                        Lot: <span className={`font-bold ${video.lotNumber ? 'text-orange-400' : 'text-red-400'}`}>
                          {video.lotNumber || 'No lot detected'}
                        </span>
                      </div>
                      {currentVideo === video.path && (
                        <div className="text-xs text-orange-400 mt-1 font-semibold">
                          ▶ Currently Playing
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Double-click to play
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


        </div>
      </main>

      {/* Status Bar */}
      <StatusBar status={status} />
    </div>
  );
}

export default App;