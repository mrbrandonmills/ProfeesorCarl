# Professor Carl - Project Instructions & Status

## Project Overview
AI-powered teaching assistant that helps students learn through personalized conversations. Uses Claude AI to provide Socratic teaching methods, course materials, and adaptive learning experiences.

---

## Latest Deployment Status (2025-12-19)

### ✅ LIVE IN PRODUCTION
- **Production URL**: https://profeesor-carl.vercel.app
- **Last Deployed**: 2025-12-19
- **Build Status**: ✅ Passing (Zero TypeScript errors)
- **Deployment Platform**: Vercel
- **Latest Commit**: `9f6100d` - docs: Add QA test results

### Recent Changes (2025-12-19 Session)

#### Memory System Fixes - All Complete
1. ✅ **Phase 1: Voice Session Memory Save**
   - Updated `VoiceConversationUI.tsx` - Added transcript to SessionReport
   - Updated `app/voice/page.tsx` - Calls `/api/memory/process` on session end

2. ✅ **Phase 2: Memory Feedback Integration**
   - Updated `app/api/chat/message/route.ts` - Fire-and-forget call to `/api/memory/feedback`

3. ✅ **Phase 3: Demo Cleanup Cron**
   - Created `app/api/cron/demo-cleanup/route.ts` - Deletes demo records > 7 days old
   - Updated `vercel.json` - Added cron schedule (daily at 3 AM UTC)

4. ✅ **Phase 4: JWT Token Refresh**
   - Updated `lib/auth/jwt.ts` - Added `refreshToken()` with 24h grace period
   - Created `app/api/auth/refresh/route.ts` - GET checks status, POST refreshes

### QA Test Results (2025-12-19)
- **31/32 tests pass (96.9%)**
- **65 memories in database** for Brandon
- Memory decay cron working (avg importance: 2.47)
- All API endpoints responding correctly
- Full results: `scripts/qa-results.json`

---

## Project Configuration

### Environment Variables Required
Check Vercel dashboard for these (already configured):
```
POSTGRES_URL or POSTGRES_DATABASE_URL
ANTHROPIC_API_KEY
OPENAI_API_KEY
JWT_SECRET
NODE_ENV=production
```

### Tech Stack
- **Framework**: Next.js 16.0.7 (App Router)
- **Database**: PostgreSQL (Vercel Postgres)
- **AI**: Anthropic Claude + OpenAI
- **Deployment**: Vercel
- **Language**: TypeScript
- **Styling**: Tailwind CSS

---

## Key Project Structure

```
/app
├── /api                    # API routes
│   ├── /auth               # Authentication (LTI, mock-login, session)
│   ├── /chat               # Chat with Carl AI
│   ├── /courses            # Course CRUD operations
│   ├── /materials          # Learning materials
│   ├── /progress           # Student progress tracking
│   ├── /tts                # Text-to-speech
│   └── /videos             # Video library & analysis
├── /catalog                # Redirects to /chat (NEW)
├── /chat                   # Main chat interface
├── /course/[id]            # Individual course pages
├── /dashboard              # Teacher dashboard
├── /lesson/[lessonId]      # Lesson materials
├── /login                  # Login page
├── /onboarding             # Student onboarding
└── /professor/upload       # Professor content upload

/components
├── /chat                   # Chat UI components
├── /ui                     # Reusable UI components
└── ...

/lib
├── /ai                     # AI integration logic
├── /db                     # Database queries
└── /profiles               # Student profiles
```

---

## Critical Routes & Features

### Student-Facing
- **Homepage** (`/`) - Landing page with "Start Learning" and "UC Demo Mode"
- **Chat** (`/chat`) - Main AI tutor interface
- **Catalog** (`/catalog`) - Redirects to chat (course catalog removed)
- **Course Detail** (`/course/[id]`) - View course info & lessons
- **Lesson Materials** (`/lesson/[lessonId]/material/[materialId]`)

### Teacher-Facing
- **Dashboard** (`/dashboard`) - Teacher course management
- **Upload** (`/professor/upload`) - Three upload methods:
  - Topic-based course creation
  - Document + video upload
  - Direct upload

### Authentication
- **LTI Integration** (`/api/auth/lti`) - Canvas LMS integration
- **Mock Login** (`/api/auth/mock-login`) - Development testing
- **Session** (`/api/auth/session`) - Session management

---

## Recent Feature: Catalog Redirect

### What Changed
- **Before**: `/catalog` showed a course listing page
- **After**: `/catalog` redirects to `/chat` with 1-second loading animation
- **Reason**: Simplified UX - students just chat with Carl instead of browsing courses

### QA Testing Status
**Automated Tests (2/6) - COMPLETED**
- ✅ No broken links check
- ✅ Build verification

**Manual Tests (4/6) - NEEDS VERIFICATION**
- ⬜ Direct URL access (`/catalog` → `/chat`)
- ⬜ Homepage "Start Learning" button
- ⬜ Homepage "UC Demo Mode" button
- ⬜ Course detail "Back to Dashboard" button

**Action Item**: Next agent should manually test these 4 flows in browser

---

## Known Orphaned/Unused Code

### Potentially Unused API Routes (Needs Audit)
These routes were NOT removed but appear unused:
- `/api/courses/enroll/route.ts` - No frontend calls found
- Consider auditing enrollment flow to confirm if needed

### Documentation Files (Low Priority)
32 markdown files in project root (mostly completion reports from dev phases)
- Consider moving to `/docs/archive/` for cleanliness
- Not urgent, doesn't affect functionality

---

## Development Workflow

### Local Development
```bash
cd "/Volumes/Super Mastery/ProfeesorCarl/ProfeesorCarl"
npm run dev
# Opens on http://localhost:3000
```

### Building
```bash
npm run build
# Should complete with zero TypeScript errors
```

### Deployment
```bash
# Preview deployment
npx vercel

# Production deployment
npx vercel --prod
```

### Git Workflow
```bash
# Current branch: main
# Backup branch: pre-deployment-backup (safe to delete after testing)
```

---

## Important Files to Know

### Configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS config
- `tsconfig.json` - TypeScript config
- `.env.local` - Local environment variables (not in repo)

### Documentation
- `QA_CATALOG_REDIRECT.md` - QA test plan for catalog redirect (may not exist in repo)
- `DESIGN_SYSTEM_AUDIT.md` - UI design system audit
- Various `PHASE*_COMPLETE.md` - Historical completion reports

### Key Code Files
- `/lib/ai/claude-client.ts` - Claude API integration
- `/components/chat/ChatInterface.tsx` - Main chat UI
- `/app/chat/page.tsx` - Chat page entry point
- `/lib/db/schema.sql` - Database schema

---

## Database Schema (Overview)

### Core Tables
- `users` - Students and teachers
- `courses` - Course definitions
- `lessons` - Lesson content
- `materials` - Learning materials (text, video, etc.)
- `enrollments` - Student-course relationships
- `progress` - Student progress tracking
- `conversations` - Chat history with Carl

---

## Next Steps for Future Agent

### Immediate Priorities
1. **Manual QA Testing** - Test the 4 remaining manual test cases
2. **Monitor Production** - Check Vercel logs for any errors
3. **User Feedback** - Collect feedback on catalog redirect UX

### Future Enhancements
1. **Audit Enrollment Flow** - Determine if `/api/courses/enroll` is still needed
2. **Documentation Cleanup** - Move old MD files to `/docs/archive/`
3. **Automated Testing** - Add Playwright/Cypress tests for critical paths
4. **Performance Monitoring** - Set up Vercel analytics and error tracking

### If Issues Arise
1. **Rollback Plan**: Use Vercel dashboard to revert to previous deployment
2. **Backup Branch**: `pre-deployment-backup` has pre-cleanup state
3. **Logs**: `npx vercel logs [deployment-url]`

---

## Special Instructions

### From Global CLAUDE.md
- Use memory MCP and sequential thinking on every task
- When hitting bugs: STOP and activate brainstorming, system debugging, and QA
- Always use CLI to connect to integrations (don't ask user for manual updates)
- Use MCP memory and sequential thinking diligently

### Project-Specific
- Don't remove files without thorough usage verification (grep search entire codebase)
- Always create backup branch before major changes
- Test builds locally before deploying
- Use `npx vercel` for preview testing before `--prod`

---

## Quick Reference Commands

```bash
# Navigate to project
cd "/Volumes/Super Mastery/ProfeesorCarl/ProfeesorCarl"

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Deploy preview
npx vercel

# Deploy production
npx vercel --prod

# View logs
npx vercel logs [deployment-url]

# Git status
git status
git log --oneline -5
```

---

## Contact & Resources

### Vercel Dashboard
- Project: `profeesor-carl`
- Organization: `brandons-projects-c4dfa14a`

### Database
- Provider: Vercel Postgres
- Access: Via Vercel dashboard or connection string in env vars

### AI APIs
- Anthropic Claude (primary)
- OpenAI (secondary)

---

## Session History

### 2025-12-19 Session - Memory System Complete
- **Agent**: Claude Opus 4.5
- **Tasks Completed**:
  1. Fixed voice session memory save - now calls `/api/memory/process` on session end
  2. Integrated memory feedback API - chat route calls `/api/memory/feedback`
  3. Created demo cleanup cron job - deletes old demo records daily
  4. Implemented JWT token refresh with 24h grace period
  5. Ran comprehensive QA - 31/32 tests pass (96.9%)
  6. Updated CLAUDE.md and created qa-results.json
- **Key Files Changed**:
  - `app/voice/page.tsx`
  - `components/voice/VoiceConversationUI.tsx`
  - `app/api/chat/message/route.ts`
  - `app/api/cron/demo-cleanup/route.ts` (new)
  - `app/api/auth/refresh/route.ts` (new)
  - `lib/auth/jwt.ts`
  - `vercel.json`
- **Status**: ✅ All tasks completed, deployed to production

### 2025-12-09 Session
- **Agent**: Claude Code
- **Tasks Completed**:
  1. Assessed post-crash situation using Plan skill
  2. Cleaned up orphaned catalog API route
  3. Removed test files and .DS_Store files
  4. Verified build passes (zero errors)
  5. Deployed to Vercel preview and production
  6. Created this CLAUDE.md handoff document
- **Status**: ✅ All tasks completed successfully

---

## Memory System Architecture

### LUFY Emotional Salience Formula
Memory strength = `3.0×log(1+citations) + 2.5×hume_arousal + 1.0×text_arousal + 0.5×importance`

### Key Memory Files
- `/lib/memory/retrieval.ts` - Fetches permanent memories for chat/voice
- `/lib/memory/save-conversation-memory.ts` - Extracts and saves memories from conversations
- `/lib/memory/hume-emotions.ts` - Processes Hume prosody into memory-relevant metrics
- `/app/api/memory/process/route.ts` - API to process conversation into memories
- `/app/api/memory/feedback/route.ts` - Updates memory strength based on citations
- `/app/api/memory/context/route.ts` - Retrieves memory context for a user

### Database
- **PostgreSQL with pgvector** - 1536-dimension embeddings
- **65 memories seeded** for Brandon from ChatGPT
- **Hybrid retrieval** - semantic similarity + cognitive importance scoring

### Cron Jobs (vercel.json)
- `/api/cron/decay` - Hourly, applies Ebbinghaus forgetting curve
- `/api/cron/demo-cleanup` - Daily at 3 AM UTC, cleans old demo records

---

**Last Updated**: 2025-12-19
**Status**: Ready for next agent
**Deployment**: Live in production ✅
**Memory System**: Fully operational with 65 Brandon memories
