# Professor Carl API Testing Guide

## Prerequisites

1. Configure `.env.local` with all required variables
2. Apply database schema to Supabase
3. Start dev server: `npm run dev`

---

## Test 1: Session Endpoint (No Auth)

Should return 401 when not authenticated.

```bash
curl -v http://localhost:3000/api/auth/session
```

**Expected Response:**
```json
{
  "error": "Not authenticated"
}
```
**Status:** `401 Unauthorized` ✅

---

## Test 2: LTI Authentication (Simulated)

This endpoint expects Canvas LTI form data. For testing, you'll need:
1. Valid Canvas LTI integration
2. Or mock the request in code

**Manual Test:**
- Register app in Canvas Developer Keys
- Launch from Canvas course
- Should redirect to `/dashboard` (teacher) or `/chat` (student)

---

## Test 3: Chat Message (Requires Session)

### Step 1: Create Test Session in Database

```sql
-- Run in Supabase SQL Editor
INSERT INTO users (canvas_id, name, email, role)
VALUES ('test-student-123', 'Test Student', 'test@example.com', 'student')
RETURNING id;

-- Use the returned user ID in next query
INSERT INTO sessions (student_id, course_id, topics_covered)
VALUES ('USER_ID_FROM_ABOVE', 'test-course-123', ARRAY['Kant', 'Ethics'])
RETURNING id;

-- Copy the session ID for testing
```

### Step 2: Generate Test JWT

Create file `scripts/generate-test-token.js`:

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  userId: 'YOUR_USER_ID_FROM_STEP1',
  role: 'student',
  courseId: 'test-course-123'
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
console.log('Test Token:', token);
```

Run:
```bash
JWT_SECRET=your-secret-from-env node scripts/generate-test-token.js
```

### Step 3: Test Chat API

```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN_FROM_STEP2" \
  -d '{
    "message": "What is Kant'\''s categorical imperative?",
    "sessionId": "YOUR_SESSION_ID_FROM_STEP1"
  }'
```

**Expected Response:**
```json
{
  "response": "That's an interesting question about Kant's ethics. Before we dive into the categorical imperative, can you tell me what you already know about how Kant approached moral philosophy? What do you think makes his approach different from other ethical theories?",
  "frustrationLevel": 0
}
```

**Validation:**
- Response is a question, NOT a direct answer ✅
- frustrationLevel is 0 (first attempt) ✅
- Message saved to database ✅
- Check `messages` table in Supabase

---

## Test 4: Frustration Detection

Send message with confusion indicators:

```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "message": "idk, this is confusing ??",
    "sessionId": "YOUR_SESSION_ID"
  }'
```

**Expected Response:**
```json
{
  "response": "I can see you're finding this challenging. Let's break it down step by step...",
  "frustrationLevel": 4
}
```

**Validation:**
- frustrationLevel > 0 (detected confusion) ✅
- Response is more supportive ✅

---

## Test 5: Progressive Hints (5+ Attempts)

After 5 user messages in same session, Claude should provide bigger hints:

```bash
# Send 5th+ message
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "message": "I'\''m still stuck, can you help?",
    "sessionId": "YOUR_SESSION_ID"
  }'
```

**Expected Response:**
```json
{
  "response": "Let me give you a hint: Kant believed moral actions should be based on rules that could apply universally to everyone. Given this, what do you think he would say about lying?",
  "frustrationLevel": 2
}
```

**Validation:**
- Response includes a hint ✅
- Still asks a question (Socratic method maintained) ✅

---

## Database Validation Queries

### Check Messages Saved
```sql
SELECT * FROM messages
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY timestamp DESC;
```

Should show all user and assistant messages.

### Check Session Updated
```sql
SELECT frustration_level, topics_covered
FROM sessions
WHERE id = 'YOUR_SESSION_ID';
```

Should show updated frustration_level.

---

## End-to-End Test Script

Create `scripts/test-e2e.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Testing Professor Carl API..."

# Test 1: Unauthenticated session
echo -e "\n${GREEN}Test 1: Session endpoint without auth${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session)
if [ "$STATUS" -eq 401 ]; then
  echo "✅ PASS: Returns 401 for unauthenticated request"
else
  echo -e "${RED}❌ FAIL: Expected 401, got $STATUS${NC}"
fi

# Test 2: Health check
echo -e "\n${GREEN}Test 2: Server health check${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$STATUS" -eq 200 ]; then
  echo "✅ PASS: Server is running"
else
  echo -e "${RED}❌ FAIL: Server not responding${NC}"
fi

# Test 3: Build check
echo -e "\n${GREEN}Test 3: Production build${NC}"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ PASS: Build successful"
else
  echo -e "${RED}❌ FAIL: Build failed${NC}"
fi

echo -e "\n🎉 Tests complete!"
```

Run:
```bash
chmod +x scripts/test-e2e.sh
./scripts/test-e2e.sh
```

---

## Troubleshooting

### Error: "supabaseUrl is required"
**Solution:** Set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Error: "Invalid token"
**Solution:** Generate new JWT with correct `JWT_SECRET`

### Error: "Session not found"
**Solution:** Create test session in Supabase database

### Error: "Authentication failed"
**Solution:** Check `ANTHROPIC_API_KEY` is valid

### Chat returns direct answers instead of questions
**Solution:** Check Claude model is `claude-sonnet-4-20250514` and system prompt is applied

---

## Success Criteria

- [ ] Session endpoint returns 401 without auth
- [ ] LTI endpoint creates/updates users
- [ ] Chat endpoint returns Socratic questions
- [ ] Frustration detection calculates score 0-10
- [ ] Progressive hints after 5+ attempts
- [ ] Messages saved to database
- [ ] Session frustration_level updates
- [ ] Build passes without errors

---

**Once all tests pass, backend is ready for Phase 2!**
