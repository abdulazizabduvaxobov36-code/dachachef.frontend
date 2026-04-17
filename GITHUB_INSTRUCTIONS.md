# GitHub Upload Instructions

## Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click the "+" button in the top right corner
3. Select "New repository"
4. Repository name: `oshpaz-uz` (or your preferred name)
5. Description: `Oshpaz.uz - Chef Platform with React frontend and Express backend`
6. Make it **Public** or **Private** (your choice)
7. **DO NOT** initialize with README, .gitignore, or license (we already have these)
8. Click "Create repository"

## Step 2: Push to GitHub
After creating the repository, GitHub will show you commands. Run these commands in your terminal:

```bash
cd "c:\Users\abdul\OneDrive\Desktop\dachachef_fixed 18"

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/oshpaz-uz.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Update Backend Connection (Optional)
If you want to deploy the backend separately, you may need to update the API URLs in production.

## Repository Structure
- `src/` - React frontend code
- `server.js` - Legacy backend (can be removed)
- `STARTUP.md` - Instructions for running the project
- Connected to external backend at `C:\Users\abdul\OneDrive\Desktop\backend`

## Features
- Chef profiles and registration
- Customer-chef messaging
- Real-time chat with Socket.io
- Online status tracking
- Posts and sharing functionality
- Multi-language support (Uzbek/Russian)