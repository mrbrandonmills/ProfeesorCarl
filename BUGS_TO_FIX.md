# Critical Bugs to Fix Before Phase 2

**Total Time to Fix:** ~60 minutes
**Priority:** Complete these before starting Phase 2 development

---

## BUG #1: Build Failure ❌ BLOCKER

**File:** `/Users/brandon/ProfeesorCarl/next.config.ts`
**Lines:** 5-8
**Time to Fix:** 5 minutes
**Severity:** CRITICAL

### Current Code (BROKEN):
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {              // ❌ This is invalid in Next.js 16
      root: __dirname,
    },
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
```

### Fixed Code:
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};
```

### Verification:
```bash
npm run build  # Should complete without TypeScript errors
```

---

## BUG #2: Voice Selection Not Saved ⚠️ HIGH

**File:** `/Users/brandon/ProfeesorCarl/components/onboarding/PreferenceQuiz.tsx`
**Lines:** 22-26, 146-149
**Time to Fix:** 10 minutes
**Severity:** HIGH

### Problem:
When user clicks a voice option, the state updates asynchronously but `handleComplete()` is called immediately, so localStorage saves the OLD state (empty string) instead of the new voice ID.

### Current Code (BROKEN):
```typescript
const handleComplete = () => {
  // Save to localStorage for now (will connect to API later)
  localStorage.setItem('preferences', JSON.stringify(preferences))
  window.location.href = '/chat'
}

// Later in the voice selection buttons:
onClick={() => {
  setPreferences({ ...preferences, selected_voice: voice.id })
  handleComplete()  // ❌ Called before state updates!
}}
```

### Fixed Code:
```typescript
const handleComplete = (finalVoice?: string) => {
  // Build final preferences object
  const finalPreferences = finalVoice
    ? { ...preferences, selected_voice: finalVoice }
    : preferences

  // Save to localStorage for now (will connect to API later)
  localStorage.setItem('preferences', JSON.stringify(finalPreferences))
  window.location.href = '/chat'
}

// Later in the voice selection buttons:
onClick={() => {
  handleComplete(voice.id)  // ✅ Pass voice ID directly
}}
```

### Alternative Fix (using useEffect):
```typescript
// Add this useEffect near the top of the component
useEffect(() => {
  if (preferences.selected_voice && step === 3) {
    handleComplete()
  }
}, [preferences.selected_voice])

// Then in the button:
onClick={() => {
  setPreferences({ ...preferences, selected_voice: voice.id })
  // handleComplete will be called automatically by useEffect
}}
```

**Recommendation:** Use the first fix (passing voice ID) - simpler and more explicit.

### Verification:
1. Complete onboarding flow
2. Select a voice (e.g., "Alloy")
3. Open browser DevTools → Application → Local Storage
4. Check `preferences` key
5. Verify: `selected_voice: "alloy"` (not empty string)

---

## BUG #3: Missing Environment Validation ⚠️ MEDIUM

**Files:** Multiple API routes
**Time to Fix:** 15 minutes
**Severity:** MEDIUM

### Problem:
When API keys are missing, errors are cryptic and hard to debug. Need startup validation.

### Solution: Create validation function

**New File:** `/Users/brandon/ProfeesorCarl/lib/config/env.ts`
```typescript
export function validateEnv() {
  const required = [
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please check your .env.local file.\n` +
      `See .env.local for required configuration.`
    )
  }

  // Validate JWT secret is not default
  if (process.env.JWT_SECRET === 'generate-random-secret-here-change-this-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Generate a secure secret for production!')
  }

  console.log('✅ Environment variables validated')
}
```

### Update API Routes:

**Example:** `/Users/brandon/ProfeesorCarl/app/api/chat/message/route.ts`

Add to top of file:
```typescript
import { validateEnv } from '@/lib/config/env'

export async function POST(request: NextRequest) {
  try {
    validateEnv()  // Add this line

    const token = request.cookies.get('auth_token')?.value
    // ... rest of code
```

### Verification:
```bash
# Remove an API key temporarily
# Run: npm run dev
# Should see clear error message listing missing vars
```

---

## SETUP CHECKLIST ⚠️

After fixing bugs, complete this setup:

### 1. Supabase Configuration (30 min)

1. Go to https://supabase.com
2. Create new project
3. Copy Project URL → `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   ```
4. Copy Anon key → `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
5. Copy Service Role key → `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
6. Open SQL Editor in Supabase Dashboard
7. Copy entire contents of `/Users/brandon/ProfeesorCarl/supabase/schema.sql`
8. Paste and run in SQL Editor
9. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' ORDER BY table_name;
   ```
10. Should see 7 tables: `learning_preferences`, `messages`, `session_summaries`, `sessions`, `users`, `video_analytics`, `video_library`

### 2. Anthropic API Key (15 min)

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Create new API key
4. Copy to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```
5. Verify access to `claude-sonnet-4-20250514` model

### 3. Generate JWT Secret (2 min)

Run this command:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output to `.env.local`:
```
JWT_SECRET=<paste-generated-secret-here>
```

### 4. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
# Should start without errors
```

---

## VERIFICATION CHECKLIST

After all fixes:

- ☐ Build succeeds: `npm run build`
- ☐ Dev server starts: `npm run dev`
- ☐ No TypeScript errors
- ☐ Onboarding saves voice selection correctly
- ☐ Environment validation shows clear messages
- ☐ All 7 database tables created in Supabase
- ☐ API keys configured in .env.local

---

## OPTIONAL: Canvas LMS Setup (For Production)

**Can be deferred until production deployment**

1. Register app in Canvas Developer Keys
2. Configure redirect URI: `http://localhost:3000/api/auth/lti/callback`
3. Get Client ID and Secret
4. Update `.env.local`:
   ```
   CANVAS_CLIENT_ID=your_client_id
   CANVAS_CLIENT_SECRET=your_client_secret
   CANVAS_PLATFORM_URL=https://your-institution.instructure.com
   ```

---

**After completing these fixes, you're ready for Phase 2!** 🚀

**ITS FOR THE KIDS !!** 🎓
