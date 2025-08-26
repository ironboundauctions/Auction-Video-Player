import React from 'react';
import { Save, FolderOpen, Image, X } from 'lucide-react';
import UpdateNotification from './UpdateNotification';

interface AppSettings {
  websiteUrl: string;
  lotNumberSelector: string;
  videoFolderPath: string;
  logoPath: string;
  waitingImagePath: string;
  autoPlay: boolean;
}

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
  onSave?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, 
  onSettingsChange, 
  onClose,
  onSave
}) => {
  const handleInputChange = (key: keyof AppSettings, value: string | boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const selectVideoFolder = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const folderPath = await window.electronAPI.selectVideoFolder();
        if (folderPath) {
          handleInputChange('videoFolderPath', folderPath);
        }
      } catch (error: any) {
        console.error('Error selecting video folder:', error);
        alert(`Error selecting folder: ${error.message}`);
      }
    } else {
      alert('This feature is only available in the Electron desktop app.');
    }
  };

  const selectLogoFile = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const logoPath = await window.electronAPI.selectLogoFile();
        if (logoPath) {
          handleInputChange('logoPath', logoPath);
        }
      } catch (error: any) {
        console.error('Error selecting logo file:', error);
        alert(`Error selecting file: ${error.message}`);
      }
    } else {
      alert('This feature is only available in the Electron desktop app.');
    }
  };

  const selectWaitingImage = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const imagePath = await window.electronAPI.selectLogoFile();
        if (imagePath) {
          handleInputChange('waitingImagePath', imagePath);
        }
      } catch (error: any) {
        console.error('Error selecting waiting image:', error);
        alert(`Error selecting file: ${error.message}`);
      }
    } else {
      alert('This feature is only available in the Electron desktop app.');
    }
  };

  const handleSaveAndClose = () => {
    if (onSave) {
      onSave();
    }
    onClose();
  };

  const isValid = settings.websiteUrl && settings.lotNumberSelector && settings.videoFolderPath;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-orange-400">Settings</h2>
          <div className="flex gap-2 items-center">
            <UpdateNotification />
            {isValid && (
              <button
                onClick={onClose}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Website Configuration */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-300">Auction Website</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={settings.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  placeholder="https://bid.ironboundauctions.com/auctions/live-sale/id/170"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Note: Update the URL for each new auction event (the ID number changes)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Lot Number CSS Selector
                </label>
                <input
                  type="text"
                  value={settings.lotNumberSelector}
                  onChange={(e) => handleInputChange('lotNumberSelector', e.target.value)}
                  placeholder="#lot-number, .current-lot, [data-lot]"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  CSS selector to find the lot number element on the webpage
                </p>
              </div>
            </div>
          </div>

          {/* File Paths */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-300">Files & Media</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video Folder Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.videoFolderPath}
                    readOnly
                    placeholder="Select folder containing video files"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={selectVideoFolder}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FolderOpen size={18} />
                    Browse
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Video files should be named with lot numbers (e.g., lot001.mp4, video_123.avi)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Logo Image Path (Optional) - Shows after videos end
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logoPath}
                    readOnly
                    placeholder="Select logo image to display after videos end"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={selectLogoFile}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Image size={18} />
                    Browse
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  This logo will be displayed after each video completes playing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Waiting Image Path (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.waitingImagePath}
                    readOnly
                    placeholder="Select image to display while waiting for videos"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={selectWaitingImage}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Image size={18} />
                    Browse
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  This image will be shown when no video is playing (instead of the TV icon)
                </p>
              </div>
            </div>
          </div>

          {/* Playback Options */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-300">Playback Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Auto-play videos</span>
                <p className="text-sm text-gray-400">
                  Automatically play videos when lot number changes
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => handleInputChange('autoPlay', e.target.checked)}
                className="w-5 h-5 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSaveAndClose}
              disabled={!isValid}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${
                isValid
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save size={20} />
              {isValid ? 'Save Settings & Continue' : 'Please Complete Required Fields'}
            </button>
          </div>

          {!isValid && (
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-200">
                Please configure the required settings:
              </p>
              <ul className="list-disc ml-6 mt-2 text-yellow-300">
                {!settings.websiteUrl && <li>Website URL</li>}
                {!settings.lotNumberSelector && <li>Lot Number CSS Selector</li>}
                {!settings.videoFolderPath && <li>Video Folder Path</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;