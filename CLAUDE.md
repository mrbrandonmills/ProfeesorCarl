# Professor Carl - Project Instructions & Status

## Project Overview
AI-powered teaching assistant that helps students learn through personalized conversations. Uses Claude AI to provide Socratic teaching methods, course materials, and adaptive learning experiences.

---

## Latest Deployment Status (2025-12-09)

### ✅ LIVE IN PRODUCTION
- **Production URL**: https://profeesor-carl-dljgzkwno-brandons-projects-c4dfa14a.vercel.app
- **Preview URL**: https://profeesor-carl-q8g80ji6f-brandons-projects-c4dfa14a.vercel.app
- **Last Deployed**: 2025-12-09
- **Build Status**: ✅ Passing (Zero TypeScript errors)
- **Deployment Platform**: Vercel

### Recent Changes (Latest Session)
1. ✅ Completed catalog redirect implementation (`/catalog` → `/chat`)
2. ✅ Cleaned up orphaned files:
   - Removed `/app/api/courses/catalog/route.ts` (unused API)
   - Removed `/app/dashboard-test/page.tsx` (dev testing only)
   - Removed all `.DS_Store` files
3. ✅ Created safety backup branch: `pre-deployment-backup`
4. ✅ Deployed to Vercel (preview + production)

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
- **Next**: Manual QA testing recommended

---

**Last Updated**: 2025-12-09
**Status**: Ready for next agent
**Deployment**: Live in production ✅
