# 🐙 Complete GitHub Setup Walkthrough

Follow these exact steps to set up auto-updates for your Auction Video Player:

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the green "New" button** (or the "+" icon in top right → "New repository")
3. **Fill out the form:**
   - Repository name: `auction-video-player` (exactly this name)
   - Description: `Desktop app for playing auction lot videos automatically`
   - Make it **Public** ✅ (required for free GitHub releases)
   - ✅ Check "Add a README file"
   - Leave everything else as default
4. **Click "Create repository"**

## Step 2: Get Your GitHub Username

After creating the repo, you'll see a URL like:
`https://github.com/YOUR_USERNAME/auction-video-player`

**Copy your username** from this URL - you'll need it for the next step.

## Step 3: Update package.json

Replace `YOUR_GITHUB_USERNAME` in your package.json with your actual username:

```json
"publish": {
  "provider": "github",
  "owner": "your-actual-username-here",
  "repo": "auction-video-player"
}
```

## Step 4: Create Personal Access Token

1. **Click your profile picture** (top right) → Settings
2. **Scroll down** to "Developer settings" (bottom left)
3. **Click "Personal access tokens"** → "Tokens (classic)"
4. **Click "Generate new token"** → "Generate new token (classic)"
5. **Fill out the form:**
   - Note: `Auction Video Player Updates`
   - Expiration: `No expiration` (or 1 year)
   - **Select these scopes:**
     - ✅ `repo` (Full control of private repositories)
     - ✅ `write:packages` (Upload packages)
6. **Click "Generate token"**
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

## Step 5: Initialize Git in Your Project

Open PowerShell in your `C:\auction-video-player` folder and run:

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit with auto-updater"

# Set main branch
git branch -M main

# Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/auction-video-player.git

# Push to GitHub
git push -u origin main
```

## Step 6: Set GitHub Token and Build

Still in PowerShell:

```powershell
# Set your GitHub token (replace with your actual token)
set GH_TOKEN=ghp_your_token_here

# Build and publish first release
npm run dist -- --publish=always
```

## ✅ Success Indicators

If everything works, you should see:
- ✅ `• uploading file=Auction Video Player Setup 1.0.1.exe`
- ✅ `• published to GitHub Releases`

Then check your GitHub repo - you should see:
- ✅ A "Releases" section with version 1.0.1
- ✅ The .exe file attached to the release

## 🎯 What Happens Next

1. **Users install** the .exe file (one time)
2. **App checks for updates** automatically on startup
3. **When you publish updates**, users get notified
4. **One-click updates** - no reinstalling needed!

## 🚨 Troubleshooting

**"Permission denied" error:**
- Make sure your GitHub token has `repo` permissions
- Check that the repository name matches exactly

**"Repository not found" error:**
- Verify your username in package.json is correct
- Make sure the repository is public

**"Token invalid" error:**
- Generate a new token and set it again
- Make sure you copied the full token

## 🎉 You're Done!

Once this works, your auto-updater is fully set up! Future updates are as simple as:

```powershell
npm version patch
npm run dist -- --publish=always
```

And all your users get the update automatically! 🚀