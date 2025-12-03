# Professor Carl - Complete Design Specification
**Date:** December 2, 2025
**Version:** 1.0
**Status:** Approved - Ready for Implementation

## Executive Summary

Professor Carl is a premium Socratic AI tutor with jaw-dropping liquid glass UI designed for college students across all subjects. It helps students learn through guided questioning (not answers), integrates seamlessly with Canvas LMS, and provides privacy-first teacher insights. Built to prove to professors that AI enhances learning rather than enabling cheating.

## Core Vision

**For Students:**
- Jaw-dropping liquid glass UI (Apple Vision Pro aesthetic)
- Socratic method that guides thinking, never gives direct answers
- Multi-modal interaction: text, voice dictation, TTS playback
- Persistent session memory across visits
- Smart video recommendations matched to learning style
- Works on any subject (powered by Claude Sonnet 4.5)

**For Teachers:**
- One-click Canvas LMS integration
- Auto-analysis of uploaded YouTube videos
- Privacy-first student insights (summaries, not raw chat logs)
- Aggregate analytics showing class-wide struggle points
- Optional extra credit for student engagement

## System Architecture

### Frontend (Next.js 15 + TypeScript)
- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS + Framer Motion
- **Components:** shadcn/ui + Aceternity UI for premium effects
- **Voice:** Web Speech API for dictation + TTS
- **State:** React Context + localStorage for preferences
- **Deployment:** Vercel

### Backend (Next.js API Routes)
- **API Routes:** Serverless functions on Vercel
- **AI:** Claude Sonnet 4.5 (model: claude-sonnet-4-20250514)
- **Memory:** MCP Memory server for persistent student context
- **Video:** YouTube Data API v3 for metadata
- **LMS:** Canvas LTI 1.3 for SSO and integration

### Database (PostgreSQL on Supabase/Railway)

**Tables:**
```sql
-- Users (synced from Canvas SSO)
users (
  id UUID PRIMARY KEY,
  canvas_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  role TEXT, -- 'student' | 'teacher'
  created_at TIMESTAMP
)

-- Student learning preferences
learning_preferences (
  user_id UUID REFERENCES users(id),
  content_preference TEXT, -- 'video-heavy' | 'balanced' | 'text-heavy'
  interaction_mode TEXT, -- 'voice' | 'text' | 'dictate' | 'mixed'
  selected_voice TEXT, -- Claude voice option
  created_at TIMESTAMP
)

-- Learning sessions
sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  course_id TEXT, -- from Canvas
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  topics_covered TEXT[], -- ['Kant', 'Categorical Imperative']
  hint_count INTEGER,
  frustration_level INTEGER, -- 0-10 scale
  videos_watched INTEGER
)

-- Session messages (for memory/context)
messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  role TEXT, -- 'user' | 'assistant'
  content TEXT,
  timestamp TIMESTAMP
)

-- AI-generated session summaries
session_summaries (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  student_id UUID REFERENCES users(id),
  summary TEXT, -- "Explored Kant's categorical imperative..."
  struggles TEXT[], -- ['autonomy concept', 'universal law application']
  progress_notes TEXT,
  created_at TIMESTAMP
)

-- Teacher video library
video_library (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES users(id),
  course_id TEXT, -- from Canvas
  youtube_url TEXT,
  title TEXT,
  duration INTEGER, -- seconds
  topics TEXT[], -- ['Kant', 'Ethics']
  difficulty TEXT, -- 'intro' | 'intermediate' | 'advanced'
  concepts TEXT[], -- ['categorical imperative', 'autonomy']
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP
)

-- Video analytics
video_analytics (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES video_library(id),
  student_id UUID REFERENCES users(id),
  watched_at TIMESTAMP,
  completion_percentage INTEGER, -- 0-100
  marked_helpful BOOLEAN
)
```

## Student Experience Flow

### First-Time Onboarding (30 seconds)

1. **Canvas SSO Login**
   - Student clicks "Professor Carl" in Canvas sidebar
   - Canvas sends LTI authentication token
   - Auto-create user account, extract course context

2. **Learning Preference Quiz**
   ```
   Q1: "How do you learn best?"
   → Mostly videos / Balanced mix / Mostly text

   Q2: "How do you prefer to interact?"
   → Talk to Carl (voice) / Type / Dictate / Mix it up

   Q3: "Pick Carl's voice" (audio previews)
   → [Voice option 1] / [Voice option 2] / [Voice option 3]
   ```

3. **Welcome Animation**
   - Liquid glass panels slide in
   - Carl's avatar appears with glow effect
   - "I'm Professor Carl. I don't give answers - I ask questions to help you think deeper."

### Regular Session Flow

1. **Session Start**
   - Student sees previous session context: "Last week: Kant's categorical imperative"
   - Choose mode:
     - **Free Exploration** → "What are you curious about?"
     - **Homework Help** → "Paste your assignment question"

2. **Socratic Dialogue**
   - Student asks: *"What is Kant's categorical imperative?"*
   - Carl responds with questions, not answers:
     ```
     "Great question! Before we dive in, think about this:
     When you make a moral decision, what should guide your choice?
     Your feelings? The outcome? Something else?"
     ```
   - Text + TTS playback in student's selected voice
   - Student can type, dictate, or use voice

3. **Progressive Hint System**
   - **Attempts 1-2:** Pure Socratic questions
   - **Attempts 3-4 + frustration detected:** Small hint
     - "Think about universal laws that apply to everyone..."
   - **Attempts 5+ + high frustration:** Bigger hint
     - "Kant believed moral rules should work for everyone equally. What might that mean for lying?"
   - **Never gives direct answer**

4. **Frustration Detection** (Claude analyzes responses)
   - Short confused responses: "idk", "??", "huh"
   - Repetitive similar answers (stuck in loop)
   - Emotional language: "this is confusing", "I don't get it"
   - → Triggers hint escalation + video suggestion

5. **Smart Video Recommendations**
   - After 3+ exchanges on a topic
   - When frustration detected
   - Matched to student's learning preference
   ```
   "You're working through deontology - want to see
   a video Professor Smith recommends? It's 8 minutes
   and breaks down the categorical imperative really well."
   ```

6. **Session Memory** (via MCP Memory server)
   - Remembers topics explored across sessions
   - "Last week you were exploring Kant. Ready to connect that to utilitarianism?"
   - Tracks progress: "You've gotten much better at applying the categorical imperative!"

## Teacher Dashboard Features

### Video Library Management

**Upload Workflow:**

1. Teacher pastes YouTube URL or playlist URL
2. **Auto-Analysis** (Claude processes video):
   ```
   Analyzing video...
   ✓ Title: "Kant's Categorical Imperative Explained"
   ✓ Duration: 12:45
   ✓ Topics: Kant, Ethics, Deontology
   ✓ Difficulty: Intermediate
   ✓ Concepts: categorical imperative, maxim, universal law
   ```
3. Teacher reviews/edits AI suggestions
4. Approve → Video added to course library

**Batch Playlist Import:**
- Paste entire YouTube playlist URL
- Claude analyzes all videos in batch
- Teacher reviews and approves/rejects each

**Library Organization:**
- Filter by: Topic, Difficulty, Concepts
- Search by keyword
- Sort by: Most watched, Most helpful, Newest
- Archive outdated content

### Student Insights (Privacy-First)

**Session Summaries** (AI-generated, no raw chats):
```
Session Summary: Student A
Date: Dec 2, 2025
Duration: 45 minutes
Topics: Kant's categorical imperative, autonomy, universal law

Summary:
Student explored the categorical imperative across 3 sessions
this week. Initially struggled with the autonomy concept and
how it differs from freedom. After watching Prof. Smith's
video on "Autonomy in Kant," showed significant improvement
in applying the universal law formulation.

Struggle Points:
- Distinguishing autonomy from freedom (resolved)
- Applying maxim testing (ongoing)

Progress:
- Now consistently identifies when an action could be universalized
- Engaging deeply with hypothetical scenarios
```

**Aggregate Analytics Dashboard:**

1. **Topic Distribution** (pie chart)
   - 40% Ethics (Kant, Mill, Aristotle)
   - 30% Metaphysics (Mind-body, Free will)
   - 20% Epistemology (Rationalism, Empiricism)
   - 10% Logic

2. **Class Struggle Points**
   - "25% of students struggling with deontology vs consequentialism"
   - "Common confusion: categorical vs hypothetical imperatives"
   - Suggests which topics need more class time

3. **Engagement Metrics**
   - Average session duration: 32 minutes
   - Most active hours: 7-10pm (study time)
   - Video completion rate: 78%
   - Hint usage: Average 2.3 hints per session

4. **Video Performance**
   - Most watched: "Kant's Categorical Imperative" (87 views)
   - Highest completion: "Intro to Utilitarianism" (92%)
   - Most helpful: "Trolley Problem Explained" (45 thumbs up)

### Extra Credit Integration (Optional)

Teachers can enable engagement-based extra credit:
- "Complete 5+ sessions this week" → +2 points
- "Watch 3+ recommended videos" → +1 point
- "Maintain 7-day streak" → +3 points

Grades passed back to Canvas gradebook via LTI

## Canvas LMS Integration

### LTI 1.3 Setup

**Registration:**
1. Professor Carl registers as External Tool in Canvas
2. Provides LTI credentials (client_id, deployment_id, public keyset URL)
3. Canvas admins approve app

**Teacher Installation:**
1. Teacher opens course → Settings → Apps
2. Searches "Professor Carl" → Install
3. App appears in course navigation sidebar
4. Teacher configures via Teacher Dashboard

**Student Access:**
1. Student clicks "Professor Carl" in Canvas
2. LTI authentication flow:
   ```
   Canvas → Sends signed JWT token to Professor Carl
   Professor Carl → Verifies signature, extracts user data
   Professor Carl → Creates/logs in user automatically
   Student → Lands in chat interface (no separate login!)
   ```

**Data Extracted from Canvas:**
- Student: name, email, student_id, course_id
- Teacher: name, email, teacher_id, course_id
- Course: course_name, course_code

### Grade Passback (Optional v2 Feature)

Professor Carl can send engagement scores to Canvas:
```
LTI Assignment and Grade Services (AGS) 2.0
→ POST /courses/{id}/gradebook/scores
{
  "userId": "canvas_user_123",
  "scoreGiven": 85,
  "scoreMaximum": 100,
  "comment": "Completed 5 sessions, watched 3 videos"
}
```

## Socratic Method Implementation

### Core Principles

**Never Give Direct Answers:**
- Always respond with guiding questions
- Lead student to discover answers themselves
- Build on previous responses to deepen thinking

**Adaptive Difficulty:**
- Start with accessible questions
- Increase complexity based on student responses
- Scale back if student struggles

**Encourage Critical Thinking:**
- Ask "Why?" and "What if?" frequently
- Explore implications and edge cases
- Connect concepts across topics

### Question Strategies

**Opening Questions** (broad exploration):
```
"What do you think the core issue is here?"
"How would you approach this problem?"
"What comes to mind when you think about X?"
```

**Probing Questions** (deepen understanding):
```
"Why do you think that?"
"What evidence supports that view?"
"How does this connect to what we discussed about Y?"
```

**Challenge Questions** (test reasoning):
```
"What if we changed X to Y? Would your answer still hold?"
"Can you think of a counterexample?"
"How would [philosopher] respond to that?"
```

**Synthesis Questions** (connect concepts):
```
"How does this relate to what you learned about Z?"
"What patterns do you see across these examples?"
"Can you apply this framework to a real-world scenario?"
```

### Hint Escalation Algorithm

```python
def get_response(student_message, session_context):
    # Analyze frustration
    frustration_level = detect_frustration(student_message, session_context)
    attempt_count = session_context['attempt_count']

    if attempt_count <= 2:
        # Pure Socratic - no hints
        return generate_socratic_question(student_message)

    elif attempt_count <= 4 and frustration_level < 5:
        # Light hint + question
        hint = generate_small_hint(session_context['topic'])
        question = generate_socratic_question(student_message)
        return f"{hint}\n\n{question}"

    elif attempt_count >= 5 or frustration_level >= 7:
        # Bigger hint + simplified question
        hint = generate_larger_hint(session_context['topic'])
        question = generate_simplified_question(student_message)

        # Suggest video if available
        video = find_relevant_video(session_context['topic'])
        if video:
            return f"{hint}\n\n{question}\n\n💡 Want to watch a video about this?"
        return f"{hint}\n\n{question}"
```

### Frustration Detection

**Indicators:**
- Short responses: len(message) < 10 chars
- Confused language: "idk", "??", "huh", "confused"
- Emotional: "frustrated", "don't get it", "this is hard"
- Repetitive: Same answer 3+ times
- Giving up: "can you just tell me", "I give up"

**Scoring:**
- 0-3: Normal learning process
- 4-6: Mild frustration (light hint)
- 7-10: High frustration (bigger hint + video)

## Liquid Glass UI Design

### Visual System

**Color Palette:**
```css
/* Backgrounds */
--bg-deep: #0a0a0f;
--bg-space: #111118;
--bg-elevated: #1a1a24;

/* Glass Effects */
--glass-panel: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-hover: rgba(255, 255, 255, 0.08);

/* Accent Colors */
--accent-blue: #3b82f6;
--accent-purple: #8b5cf6;
--accent-emerald: #10b981;
--accent-amber: #f59e0b;

/* Text */
--text-primary: rgba(255, 255, 255, 1);
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);
```

**Glass Panel Template:**
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

**Glow Effects:**
```css
.glow-blue {
  box-shadow:
    0 0 24px rgba(59, 130, 246, 0.3),
    0 0 48px rgba(59, 130, 246, 0.1);
}

.glow-purple {
  box-shadow:
    0 0 24px rgba(139, 92, 246, 0.3),
    0 0 48px rgba(139, 92, 246, 0.1);
}
```

### Key Components

**Chat Interface:**
```
┌─────────────────────────────────────────┐
│  [Glass Navigation Bar]                 │
│  Professor Carl | Settings | Sign Out   │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────┐ ┌──────────┐ │
│  │ [Glass Chat Panel]   │ │ [Videos] │ │
│  │                      │ │          │ │
│  │ Student: Question... │ │ [Video1] │ │
│  │                      │ │ [Video2] │ │
│  │ Carl: Let me ask...  │ │ [Video3] │ │
│  │                      │ │          │ │
│  │ [Glass Input Field]  │ │          │ │
│  │ [🎤 Voice] [Send]    │ │          │ │
│  └──────────────────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

**Message Bubbles:**
- Student: Glass panel with blue glow on left
- Carl: Glass panel with purple glow on right
- Hints: Amber accent border with lightbulb icon
- Videos: Card with thumbnail, glass overlay

**Animations (Framer Motion):**
```javascript
// Message send animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>

// Video card hover
<motion.div
  whileHover={{ scale: 1.05, y: -8 }}
  transition={{ duration: 0.2 }}
>

// Hint reveal
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
  transition={{ duration: 0.4, ease: "easeInOut" }}
>
```

### Responsive Design

**Desktop (1024px+):**
- Two-column layout: Chat (70%) + Video sidebar (30%)
- Fixed navigation bar
- Floating action buttons

**Tablet (768-1023px):**
- Single column with collapsible video panel
- Swipe to reveal videos
- Bottom navigation

**Mobile (< 768px):**
- Full-screen chat
- Videos in modal overlay
- Voice button prominent in bottom bar

## Technical Implementation Details

### API Routes

**Authentication:**
```
POST /api/auth/lti - Canvas LTI authentication
POST /api/auth/session - Create user session
GET /api/auth/me - Get current user
```

**Chat:**
```
POST /api/chat/message - Send message, get Socratic response
GET /api/chat/session/:id - Get session history
POST /api/chat/session - Create new session
```

**Videos:**
```
POST /api/videos/analyze - Auto-analyze YouTube video
POST /api/videos/playlist - Import YouTube playlist
GET /api/videos/library - Get course video library
POST /api/videos/track - Track video view
```

**Teacher Dashboard:**
```
GET /api/teacher/students - Get student list
GET /api/teacher/sessions - Get session summaries
GET /api/teacher/analytics - Get aggregate analytics
GET /api/teacher/videos - Get video performance
```

**Memory (MCP Integration):**
```
POST /api/memory/save - Save session context
GET /api/memory/retrieve - Get student history
```

### Environment Variables

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# YouTube
YOUTUBE_API_KEY=AIza...

# Canvas LMS
CANVAS_CLIENT_ID=...
CANVAS_CLIENT_SECRET=...
CANVAS_PLATFORM_URL=https://canvas.instructure.com

# App
NEXT_PUBLIC_APP_URL=https://professorcarl.vercel.app
JWT_SECRET=...
```

### MCP Memory Integration

**Student Context Storage:**
```javascript
// Save after each session
await mcpMemory.save({
  studentId: user.id,
  context: {
    topics_explored: ["Kant", "Categorical Imperative"],
    current_understanding: "Grasps universal law, struggles with autonomy",
    learning_progress: {
      "categorical_imperative": 7, // 0-10 scale
      "autonomy": 4
    },
    conversation_history: messages.slice(-10) // Last 10 exchanges
  }
});

// Retrieve at session start
const context = await mcpMemory.retrieve(user.id);
```

## Testing Strategy

### Unit Tests (Jest)
- Socratic response generation
- Frustration detection algorithm
- Hint escalation logic
- Video recommendation matching

### Integration Tests
- Canvas LTI authentication flow
- YouTube video analysis
- Session summary generation
- MCP memory persistence

### End-to-End Tests (Puppeteer)
- Student onboarding flow
- Complete chat session
- Video watch and tracking
- Teacher dashboard navigation
- Canvas SSO integration

### QA Checklist
- [ ] All API endpoints respond correctly
- [ ] Canvas LTI authentication works
- [ ] Socratic responses never give direct answers
- [ ] Hint system escalates appropriately
- [ ] Videos load and track properly
- [ ] Teacher dashboard shows real data
- [ ] Memory persists across sessions
- [ ] UI is responsive on all devices
- [ ] Animations are smooth (60fps)
- [ ] No console errors or warnings
- [ ] Accessibility (WCAG 2.1 AA)

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API rate limits tested
- [ ] Error handling comprehensive
- [ ] Logging configured

### Vercel Deployment
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Enable analytics
- [ ] Configure preview deployments

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Canvas LTI connection verified
- [ ] Teacher can upload videos
- [ ] Student can complete session
- [ ] Memory persists correctly
- [ ] Monitor error logs

## Success Metrics

### Student Engagement
- Session duration > 20 minutes average
- Return rate > 60% (students come back)
- Video completion rate > 70%
- Positive feedback on "helpfulness"

### Teacher Adoption
- Teachers upload > 10 videos per course
- Weekly dashboard usage
- Extra credit enabled > 50% of courses
- Positive testimonials

### Learning Outcomes
- Students report deeper understanding
- Improved assignment scores (via Canvas data)
- Reduced office hours for basic questions
- Professor testimonial: "AI helps learning, not cheating"

## Future Enhancements (v2)

### Voice Conversation (Hume EVI)
- Full duplex voice chat
- Real-time emotion detection
- Adaptive tone based on student affect

### Mobile Apps (iOS/Android)
- React Native or Flutter wrapper
- TestFlight beta testing
- App Store distribution

### Advanced Analytics
- Predictive struggling student alerts
- Topic difficulty scoring
- Personalized learning paths

### Gamification
- Streaks and achievements
- Leaderboards (optional, privacy-respecting)
- Unlock advanced topics

### Multi-Language Support
- Spanish, Mandarin, French
- Localized Socratic dialogue

---

## Conclusion

Professor Carl is a comprehensive platform that reimagines AI in education. By combining premium UX, pedagogically sound Socratic method, and privacy-first teacher insights, it proves that AI can enhance learning rather than enable cheating.

**Ready for implementation.**
