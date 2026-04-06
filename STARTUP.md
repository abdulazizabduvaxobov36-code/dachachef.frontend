# OSHPAZ.UZ - Startup Instructions

## Quick Start

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies (in backend folder)
cd "C:\Users\abdul\OneDrive\Desktop\backend"
npm install
```

### 2. Start the Application

#### Option 1: Start both frontend and backend together
```bash
npm run start:full
```

#### Option 2: Start separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

#### Option 3: Start backend in production mode
```bash
npm run server-prod
```

## Access URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## Project Structure
- **Frontend**: React + Chakra UI + Vite
- **Backend**: Express.js + MongoDB + Socket.io
- **Database**: MongoDB (localhost:27017)

## Environment Variables
Backend uses `.env` file in `C:\Users\abdul\OneDrive\Desktop\backend\`:
```
MONGO_URI=mongodb://localhost:27017/oshpaz
PORT=5000
```
