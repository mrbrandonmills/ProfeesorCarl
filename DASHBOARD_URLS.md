# Dashboard URLs Reference

## Available Pages

### 🏠 Homepage
**URL:** `http://localhost:3000/`
**Redirects to:** `/onboarding`

### 📚 Onboarding
**URL:** `http://localhost:3000/onboarding`
**Purpose:** Student preference quiz

### 💬 Chat
**URL:** `http://localhost:3000/chat`
**Purpose:** Student chat interface

### 🎓 Dashboard (NEW!)
**URL:** `http://localhost:3000/dashboard`
**Purpose:** Teacher dashboard
**Requires:** Teacher authentication or mock session
**Features:**
- Video Library tab
- Upload Video tab  
- Student Analytics tab

### 🧪 Dashboard Test (NEW!)
**URL:** `http://localhost:3000/dashboard-test`
**Purpose:** Activate mock teacher session for testing
**How to use:**
1. Click "Activate Mock Teacher Session" button
2. Auto-redirects to `/dashboard`
3. Dashboard loads with mock authentication

## API Endpoints

### Authentication
- `POST /api/auth/lti` - Canvas LTI authentication
- `GET /api/auth/session` - Session verification
- `POST /api/auth/mock-teacher-session` - Mock session (testing only)

### Chat
- `POST /api/chat/message` - Send message to Claude

### Videos (NEW!)
- `POST /api/videos/analyze` - Analyze YouTube video
- `GET /api/videos/library` - Get video library
- `POST /api/videos/library` - Add video to library

## Quick Test Flow

1. **Visit:** `http://localhost:3000/dashboard-test`
2. **Click:** "Activate Mock Teacher Session"
3. **See:** Beautiful dashboard with three tabs
4. **Try:** Click between tabs to see different views
5. **Note:** API calls need environment variables, but UI is fully functional

## Development Server

**Port:** 3000
**Status:** Running ✅
**URL:** http://localhost:3000

---

**Tip:** For best experience, configure environment variables in `.env.local` to enable full API functionality.

See `DASHBOARD_QUICK_START.md` for setup instructions.
