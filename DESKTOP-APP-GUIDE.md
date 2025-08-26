# Complete Guide: Creating Desktop App with Icon

## 📋 Prerequisites
- Your auction video player project is working
- You have Node.js installed
- You have your Ironbound logo image

## 🎯 STEP 1: Create App Icons

### Option A: Using Your Existing Logo
1. **Find your logo file** (PNG, JPG, etc.)
2. **Resize to 512x512 pixels** using any image editor:
   - Windows: Paint, GIMP, Photoshop
   - Online: https://www.iloveimg.com/resize-image
   - Mac: Preview, Photoshop

### Option B: Create Icons Online
1. **Go to icon converter websites:**
   - For Windows .ico: https://convertio.co/png-ico/
   - For macOS .icns: https://cloudconvert.com/png-to-icns
   - All formats: https://www.icoconverter.com/

2. **Upload your 512x512 logo**
3. **Download the converted files**

### Required Files:
Create these files in your project's `assets/` folder:
```
assets/
├── icon.ico     (Windows - 256x256 pixels)
├── icon.icns    (macOS - 512x512 pixels)
└── icon.png     (Linux - 512x512 pixels)
```

## 🔧 STEP 2: Verify Project Setup

### Check package.json
Make sure your `package.json` has these build scripts:
```json
{
  "scripts": {
    "build": "vite build",
    "build-win": "npm run build && electron-builder --win",
    "build-mac": "npm run build && electron-builder --mac", 
    "build-linux": "npm run build && electron-builder --linux",
    "dist": "npm run build && electron-builder --publish=never"
  }
}
```

### Check Dependencies
Run this to ensure electron-builder is installed:
```bash
npm install --save-dev electron-builder
```

## 🚀 STEP 3: Build Your Desktop App

### For Windows (Most Common):
```bash
# Open terminal in your project folder
cd path/to/your/auction-video-player

# Build the Windows installer
npm run build-win
```

**What happens:**
- Creates a Windows installer (.exe file)
- Includes your custom icon
- Sets up desktop shortcut
- Creates start menu entry

### For All Platforms:
```bash
npm run dist
```

## 📁 STEP 4: Find Your Built App

After building, look in the `dist-electron/` folder:

```
dist-electron/
├── win-unpacked/           (Windows app files)
├── Auction Video Player Setup 1.0.0.exe  (Windows installer)
├── mac/                    (macOS app - if built on Mac)
└── linux-unpacked/         (Linux app files)
```

## 💾 STEP 5: Install Your App

### Windows Installation:
1. **Double-click** `Auction Video Player Setup 1.0.0.exe`
2. **Follow installer prompts:**
   - Choose installation directory
   - Select "Create desktop shortcut" ✅
   - Select "Create start menu shortcut" ✅
3. **Click Install**

### Result:
- Desktop icon with your logo
- Start menu entry
- Taskbar icon when running
- Professional Windows app

## 🎨 STEP 6: Customize App Details (Optional)

### Update App Information:
Edit `package.json` to customize:
```json
{
  "name": "auction-video-player",
  "productName": "Ironbound Auction Video Player",
  "description": "Professional auction video automation",
  "version": "1.0.0",
  "author": "Ironbound Auctions"
}
```

### Advanced Icon Settings:
Add to `package.json` build section:
```json
{
  "build": {
    "appId": "com.ironbound.auction-video-player",
    "productName": "Ironbound Auction Video Player",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Ironbound Auction Player"
    }
  }
}
```

## 🔍 Troubleshooting

### Common Issues:

**"electron-builder not found"**
```bash
npm install --save-dev electron-builder
```

**"Icon not showing"**
- Ensure icon files are exactly in `assets/` folder
- Check file names: `icon.ico`, `icon.icns`, `icon.png`
- Verify icon dimensions (256x256 for .ico, 512x512 for others)

**"Build fails"**
```bash
# Clear cache and rebuild
npm run build
npm run build-win
```

**"App won't start"**
- Make sure `npm run dev` works first
- Check that all dependencies are installed
- Verify electron/main.cjs file exists

## ✅ Success Checklist

After installation, you should have:
- [ ] Desktop shortcut with your logo
- [ ] Start menu entry
- [ ] App launches when double-clicked
- [ ] Custom icon in taskbar when running
- [ ] Professional installer experience

## 🎯 Quick Commands Summary

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Test app works
npm run electron-dev

# 3. Build Windows desktop app
npm run build-win

# 4. Find installer in dist-electron/ folder
# 5. Run installer to create desktop shortcut
```

Your desktop app is now ready for professional use at auctions!