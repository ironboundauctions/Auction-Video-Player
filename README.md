<<<<<<< HEAD
# Auction Video Player

A desktop application that monitors live auction websites and automatically plays corresponding videos based on lot numbers.

## Features

- **Real-time Website Monitoring**: Continuously monitors your auction website for lot number changes
- **Automatic Video Playback**: Plays videos from local folder based on current lot number
- **Logo Display**: Shows your logo after each video completes
- **Professional Interface**: Clean, auction-optimized UI with dark theme
- **Configurable Settings**: Easy setup for website URL, CSS selectors, and file paths

## Setup Instructions

### 1. Initial Configuration

When you first run the app, you'll need to configure:

- **Website URL**: The live auction page URL
- **CSS Selector**: The CSS selector to find the lot number on your webpage
- **Video Folder**: Local folder containing your video files
- **Logo Image**: Optional logo to display after videos (PNG, JPG, etc.)

### 2. Video File Naming

Name your video files to include the lot number:
- `lot001.mp4`
- `video_123.avi`
- `auction-456.mov`

The app will extract the number and match it to lot numbers from the website.

### 3. CSS Selector Examples

Common CSS selectors for lot numbers:
- `#lot-number` (element with ID "lot-number")
- `.current-lot` (element with class "current-lot")
- `[data-lot]` (element with data-lot attribute)
- `.lot-display span` (span inside element with class "lot-display")

### 4. Running the App

Development mode:
```bash
npm run electron-dev
```

Build for distribution:
```bash
npm run dist
```

Build for specific platforms:
```bash
# Windows installer
npm run build-win

# macOS app
npm run build-mac

# Linux AppImage
npm run build-linux
```

## How It Works

1. **Website Monitoring**: Uses Puppeteer to monitor your auction website
2. **Lot Detection**: Extracts lot numbers using your CSS selector
3. **Video Matching**: Matches lot numbers to video files in your folder
4. **Auto-Playback**: Automatically plays the corresponding video
5. **Logo Display**: Shows your logo when video completes

## System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Node.js**: Version 16 or higher
- **Video Formats**: MP4, AVI, MOV, WMV, MKV, WebM
- **Image Formats**: PNG, JPG, JPEG, GIF, WebP

## Troubleshooting

### Videos Not Playing
- Check that video files are named with lot numbers
- Ensure video folder path is correct
- Verify video format compatibility

### Website Not Monitored
- Confirm website URL is accessible
- Check CSS selector accuracy using browser developer tools
- Ensure website doesn't block automated access

### Logo Not Showing
- Verify logo file path is correct
- Check image format is supported
- Ensure file permissions allow reading

## Support

For technical support or feature requests, please refer to the application settings panel for configuration guidance.
=======
# Auction-Video-Player
Desktop app for playing auction lot videos automatically
>>>>>>> 57ae2b997478e3df883cfaf8d34a1084fe4eab8f
