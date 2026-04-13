# DevAuction - Quick Setup Guide

## Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas connection string)
- Auth0 account (for JWT authentication)
- Google Drive API credentials (for file storage)
- LiveKit server (self-hosted or managed)
- Razorpay account (for payments)

---

## 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd devauction

# Backend setup
cd server
npm install

# Frontend setup
cd ../client
npm install
```

---

## 2. Environment Variables

### Backend (`server/.env`)
```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/devauction

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# LiveKit
LIVEKIT_URL=ws://your-livekit-server:7880
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Google Drive
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_SECRET_KEY=your-secret-key

# Server
PORT=3000
NODE_ENV=development
HOST_DISCONNECT_GRACE_PERIOD_MS=300000
```

### Frontend (`client/.env`)
```env
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
VITE_SOCKET_URL=http://localhost:3000
VITE_WEB_SERVER_URL=http://localhost:3000
VITE_LIVEKIT_URL=ws://your-livekit-server:7880
```

---

## 3. Database Setup

### MongoDB Atlas
1. Create cluster at [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create database user
3. Whitelist IP address
4. Copy connection string to `MONGODB_URI`

### Local MongoDB
```bash
# Start MongoDB
mongod

# Connection string
MONGODB_URI=mongodb://localhost:27017/devauction
```

---

## 4. Auth0 Setup

1. Create Auth0 tenant at [auth0.com](https://auth0.com)
2. Create API (for backend verification)
   - Name: DevAuction API
   - Identifier: `devauction-api`
3. Create Single Page Application (for frontend)
   - Name: DevAuction Client
   - Allowed Callback URLs: `http://localhost:5173`
   - Allowed Logout URLs: `http://localhost:5173`
4. Copy credentials to `.env` files

---

## 5. Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google Drive API
4. Create OAuth2 credentials (Desktop app)
5. Generate refresh token using [OAuth Playground](https://developers.google.com/oauthplayground)
   - Scope: `https://www.googleapis.com/auth/drive`
6. Create folder in Google Drive for project files
7. Copy credentials to `server/.env`

---

## 6. LiveKit Setup

### Option A: Self-Hosted
```bash
# Using Docker
docker run -d \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -e LIVEKIT_API_KEY=your-key \
  -e LIVEKIT_API_SECRET=your-secret \
  livekit/livekit-server
```

### Option B: Managed Service
- Sign up at [livekit.io](https://livekit.io)
- Create project
- Copy URL and credentials

---

## 7. Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from dashboard
3. Add to `server/.env`

---

## 8. Start Development Servers

### Terminal 1: Backend
```bash
cd server
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: Frontend
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## 9. Verify Setup

- Backend: `http://localhost:3000` (should show API running)
- Frontend: `http://localhost:5173` (should load landing page)
- Auth0: Try login (should redirect to Auth0)
- Socket.io: Check browser console (should connect to `/auction` namespace)

---

## 10. Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check MONGODB_URI, whitelist IP in Atlas |
| Auth0 login fails | Verify callback URLs match frontend URL |
| LiveKit connection fails | Check LIVEKIT_URL and credentials |
| Google Drive upload fails | Verify refresh token and folder permissions |
| Socket.io auth error | Check Auth0 token generation in frontend |

---

## 11. Project Structure

```
devauction/
├── server/
│   ├── src/
│   │   ├── models/          (Mongoose schemas)
│   │   ├── routes/          (Express routes)
│   │   ├── services/        (Business logic)
│   │   ├── socket/          (Socket.io handlers)
│   │   └── utils/           (Helpers)
│   ├── .env                 (Environment variables)
│   └── server.js            (Entry point)
├── client/
│   ├── src/
│   │   ├── Components/      (React components)
│   │   ├── Pages/           (Page components)
│   │   ├── context/         (React Context)
│   │   ├── hooks/           (Custom hooks)
│   │   └── utils/           (Helpers)
│   ├── .env                 (Environment variables)
│   └── index.html           (Entry point)
└── ARCHITECTURAL_DECISIONS.md
```

---

## 12. Key Routes

**Frontend:**
- `/` - Landing page
- `/homepage/dashboard` - User dashboard
- `/auction/:auctionId` - Join auction
- `/auction` - Create/browse auctions
- `/homepage/chats` - Messaging

**Backend:**
- `POST /create/project` - Create project
- `POST /create/room` - Create auction room
- `GET /auction/:id` - Get auction details
- `POST /bid` - Submit bid (via Socket.io)

---

## 13. Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Run with coverage
npm test -- --coverage
```

---

## 14. Deployment

**Frontend (Vercel):**
```bash
cd client
npm run build
# Deploy dist/ folder to Vercel
```

**Backend (Render):**
```bash
# Push to GitHub
git push origin main
# Connect repo to Render
# Set environment variables
# Deploy
```

---

## 15. Support & Documentation

- **Architecture Decisions**: See `ARCHITECTURAL_DECISIONS.md`
- **API Documentation**: Check `server/routes/`
- **Component Documentation**: Check `client/src/Components/`
- **Socket Events**: See `server/src/socket/auctionSocket.js`

---

## Quick Troubleshooting

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if ports are in use
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# View server logs
cd server && npm run dev

# View frontend logs
cd client && npm run dev
```

---

**Ready to go!** Start with the backend and frontend servers, then open `http://localhost:5173` in your browser.