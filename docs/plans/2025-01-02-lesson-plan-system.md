# Lesson Plan Upload System - Complete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build production-ready lesson plan upload system supporting 3 methods (topic-based, document+video, Canvas import) with real Canvas LTI 1.3 integration, YouTube Data API, and extensible LMS adapter pattern.

**Architecture:** LMS Adapter pattern separates platform-specific logic (Canvas, Blackboard, Moodle) from core lesson system. Three content processors (TopicProcessor, DocumentProcessor, CanvasModuleProcessor) transform different input types into unified lesson structure. Professor Carl dialogue engine consumes lesson content for Socratic questioning.

**Tech Stack:** Next.js 15, TypeScript, Supabase PostgreSQL, Canvas LTI 1.3, Canvas REST API, YouTube Data API v3, youtube-transcript-api (Node), Claude Sonnet 4.5

**Timeline:** 4 weeks (Feb 2025 keynote)
- Week 1: Database + Method 1 (Topic-based)
- Week 2: YouTube API + Method 2 (Document+Video)
- Week 3: Canvas integration + Method 3 (Canvas import)
- Week 4: QA, polish, demo preparation

---

## Phase 0: Credentials Setup (Prerequisites)

**Required before starting implementation:**

### Canvas Credentials (2 separate keys needed)

**LTI 1.3 Developer Key (for authentication):**
1. Admin login to Canvas instance → Developer Keys → + Developer Key → + LTI Key
2. Configure:
   - Redirect URIs: `https://your-domain.vercel.app/api/auth/lti/callback`
   - Target Link URI: `https://your-domain.vercel.app/api/auth/lti`
   - OpenID Connect Initiation URL: `https://your-domain.vercel.app/api/auth/lti`
   - JWK Method: Public JWK URL → `https://your-domain.vercel.app/api/auth/lti/jwks`
   - LTI Advantage Services: Enable Names and Role, Assignment and Grade
3. Save → Copy Client ID and Deployment ID

**Canvas REST API Developer Key (for course content):**
1. Admin login to Canvas → Account → Settings → Developer Keys → + Developer Key → + API Key
2. Configure:
   - Key Name: Professor Carl API
   - Redirect URI: `https://your-domain.vercel.app/api/canvas/oauth/callback`
3. Save → Copy Client ID and Client Secret
4. User authorization URL: `https://[CANVAS_DOMAIN]/login/oauth2/auth`
5. Token URL: `https://[CANVAS_DOMAIN]/login/oauth2/token`

**YouTube API Key:**
1. Google Cloud Console → Create Project → Enable YouTube Data API v3
2. Credentials → Create Credentials → API Key
3. Restrict key to YouTube Data API v3
4. Copy API Key

**Add to `.env.local`:**
```bash
# Canvas LTI 1.3 (for authentication/launch)
CANVAS_LTI_CLIENT_ID=your_lti_client_id
CANVAS_LTI_DEPLOYMENT_ID=your_deployment_id
CANVAS_INSTANCE_URL=https://your-institution.instructure.com

# Canvas REST API (for course content)
CANVAS_API_CLIENT_ID=your_api_client_id
CANVAS_API_CLIENT_SECRET=your_api_secret

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# JWT Secret (generate random string)
JWT_SECRET=generate_random_64_char_string
```

---

## Phase 1: Database Schema (Week 1, Days 1-2)

### Task 1: Create Courses Table

**Files:**
- Create: `supabase/migrations/003_courses_table.sql`

**Step 1: Write migration SQL**

```sql
-- Courses table (supports multiple LMS platforms)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lms_type TEXT NOT NULL CHECK (lms_type IN ('canvas', 'manual', 'blackboard', 'moodle', 'private')),
    lms_course_id TEXT, -- External course ID from LMS
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}', -- LMS-specific metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_lms ON courses(lms_type, lms_course_id);
```

**Step 2: Apply migration**

Run: `supabase db reset` (local) or push to hosted Supabase
Expected: "Migrations applied successfully"

**Step 3: Commit**

```bash
git add supabase/migrations/003_courses_table.sql
git commit -m "feat: add courses table with LMS adapter support"
```

---

### Task 2: Create Lessons Table

**Files:**
- Create: `supabase/migrations/004_lessons_table.sql`

**Step 1: Write migration SQL**

```sql
-- Lessons table (supports 3 upload methods)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('topic', 'document', 'canvas_module')),
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}', -- Flexible structure for different types
    order_index INTEGER NOT NULL DEFAULT 0,
    lms_module_id TEXT, -- Canvas module ID if imported
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);
```

**Step 2: Apply migration**

Run: `supabase db reset`
Expected: "Migrations applied successfully"

**Step 3: Commit**

```bash
git add supabase/migrations/004_lessons_table.sql
git commit -m "feat: add lessons table supporting 3 upload methods"
```

---

### Task 3: Create Learning Materials Table

**Files:**
- Create: `supabase/migrations/005_learning_materials_table.sql`

**Step 1: Write migration SQL**

```sql
-- Learning materials (videos, PDFs, links)
CREATE TABLE learning_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'url', 'canvas_page')),
    title TEXT NOT NULL,
    source_url TEXT,
    metadata JSONB DEFAULT '{}', -- Video duration, PDF pages, etc.
    transcript TEXT, -- Video transcripts for Claude context
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_lesson ON learning_materials(lesson_id);
CREATE INDEX idx_materials_type ON learning_materials(type);
```

**Step 2: Apply migration**

Run: `supabase db reset`
Expected: "Migrations applied successfully"

**Step 3: Commit**

```bash
git add supabase/migrations/005_learning_materials_table.sql
git commit -m "feat: add learning materials table for videos and documents"
```

---

### Task 4: Create Student Progress Table

**Files:**
- Create: `supabase/migrations/006_student_progress_table.sql`

**Step 1: Write migration SQL**

```sql
-- Student progress tracking
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    topics_covered TEXT[] DEFAULT '{}',
    last_accessed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_progress_course ON student_progress(course_id);
```

**Step 2: Apply migration**

Run: `supabase db reset`
Expected: "Migrations applied successfully"

**Step 3: Commit**

```bash
git add supabase/migrations/006_student_progress_table.sql
git commit -m "feat: add student progress tracking table"
```

---

### Task 5: Update Sessions Table

**Files:**
- Create: `supabase/migrations/007_update_sessions_add_lesson.sql`

**Step 1: Write migration SQL**

```sql
-- Add lesson_id to sessions table
ALTER TABLE sessions
ADD COLUMN lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

CREATE INDEX idx_sessions_lesson ON sessions(lesson_id);
```

**Step 2: Apply migration**

Run: `supabase db reset`
Expected: "Migrations applied successfully"

**Step 3: Commit**

```bash
git add supabase/migrations/007_update_sessions_add_lesson.sql
git commit -m "feat: link sessions to lessons for context-aware dialogue"
```

---

## Phase 2: Backend Infrastructure (Week 1, Days 3-5)

### Task 6: Create TypeScript Types

**Files:**
- Create: `types/course.ts`

**Step 1: Write type definitions**

```typescript
export type LMSType = 'canvas' | 'manual' | 'blackboard' | 'moodle' | 'private'
export type CourseStatus = 'draft' | 'active' | 'archived'
export type LessonType = 'topic' | 'document' | 'canvas_module'
export type MaterialType = 'video' | 'pdf' | 'url' | 'canvas_page'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface Course {
  id: string
  teacher_id: string
  lms_type: LMSType
  lms_course_id?: string
  title: string
  description?: string
  status: CourseStatus
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  type: LessonType
  title: string
  description?: string
  content: LessonContent
  order_index: number
  lms_module_id?: string
  created_at: string
  updated_at: string
}

// Content structure varies by type
export interface TopicContent {
  topics: Array<{
    name: string
    description: string
    learning_objectives: string[]
    key_concepts: string[]
  }>
}

export interface DocumentContent {
  document_url?: string
  extracted_topics: string[]
  outline: string
}

export interface CanvasModuleContent {
  module_id: string
  module_name: string
  items: Array<{
    id: string
    type: string
    title: string
    url?: string
  }>
}

export type LessonContent = TopicContent | DocumentContent | CanvasModuleContent

export interface LearningMaterial {
  id: string
  lesson_id: string
  type: MaterialType
  title: string
  source_url?: string
  metadata: MaterialMetadata
  transcript?: string
  view_count: number
  created_at: string
}

export interface VideoMetadata {
  duration: number
  youtube_id: string
  thumbnail_url: string
  channel_name?: string
}

export interface PDFMetadata {
  pages: number
  file_size: number
}

export type MaterialMetadata = VideoMetadata | PDFMetadata | Record<string, any>

export interface StudentProgress {
  id: string
  student_id: string
  lesson_id: string
  course_id: string
  status: ProgressStatus
  completion_percentage: number
  topics_covered: string[]
  last_accessed_at?: string
  completed_at?: string
  created_at: string
}
```

**Step 2: Commit**

```bash
git add types/course.ts
git commit -m "feat: add TypeScript types for course system"
```

---

### Task 7: Create LMS Adapter Interface

**Files:**
- Create: `lib/lms/adapter.ts`

**Step 1: Write adapter interface**

```typescript
import { Course, Lesson } from '@/types/course'

/**
 * LMS Adapter Interface
 * Implement this for each LMS platform (Canvas, Blackboard, Moodle, etc.)
 */
export interface LMSAdapter {
  /** Authenticate and get access token */
  authenticate(credentials: Record<string, string>): Promise<string>

  /** Fetch course list for authenticated teacher */
  listCourses(accessToken: string): Promise<Course[]>

  /** Fetch course details */
  getCourseDetails(accessToken: string, courseId: string): Promise<Course>

  /** Fetch modules/lessons from course */
  getCourseModules(accessToken: string, courseId: string): Promise<Lesson[]>

  /** Fetch assignments from course */
  getCourseAssignments(accessToken: string, courseId: string): Promise<any[]>

  /** Sync grades back to LMS */
  syncGrades?(accessToken: string, courseId: string, grades: any[]): Promise<void>
}

/**
 * Factory to get appropriate adapter
 */
export function getLMSAdapter(lmsType: string): LMSAdapter {
  switch (lmsType) {
    case 'canvas':
      return new CanvasAdapter()
    case 'blackboard':
      throw new Error('Blackboard adapter not yet implemented')
    case 'moodle':
      throw new Error('Moodle adapter not yet implemented')
    default:
      throw new Error(`Unknown LMS type: ${lmsType}`)
  }
}

/**
 * Placeholder for Canvas adapter (implemented in Phase 3)
 */
class CanvasAdapter implements LMSAdapter {
  async authenticate(credentials: Record<string, string>): Promise<string> {
    throw new Error('Not implemented - see Phase 3')
  }

  async listCourses(accessToken: string): Promise<Course[]> {
    throw new Error('Not implemented - see Phase 3')
  }

  async getCourseDetails(accessToken: string, courseId: string): Promise<Course> {
    throw new Error('Not implemented - see Phase 3')
  }

  async getCourseModules(accessToken: string, courseId: string): Promise<Lesson[]> {
    throw new Error('Not implemented - see Phase 3')
  }

  async getCourseAssignments(accessToken: string, courseId: string): Promise<any[]> {
    throw new Error('Not implemented - see Phase 3')
  }
}
```

**Step 2: Commit**

```bash
git add lib/lms/adapter.ts
git commit -m "feat: add LMS adapter interface for extensibility"
```

---

### Task 8: Create Course API Routes

**Files:**
- Create: `app/api/courses/route.ts`

**Step 1: Write GET and POST handlers**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET - List teacher's courses
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: courses, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('teacher_id', payload.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Courses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new course
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, description, lms_type = 'manual' } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .insert({
        teacher_id: payload.userId,
        title,
        description,
        lms_type,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Courses POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Test with curl**

```bash
# Login as professor first to get auth cookie
curl -X POST http://localhost:3000/api/auth/mock-login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@university.edu","role":"professor"}' \
  -c cookies.txt

# Create course
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Introduction to Biology","description":"Freshman biology course"}'
```

Expected: 200 response with course object

**Step 3: Commit**

```bash
git add app/api/courses/route.ts
git commit -m "feat: add course list and create API endpoints"
```

---

### Task 9: Create Course Detail API

**Files:**
- Create: `app/api/courses/[courseId]/route.ts`

**Step 1: Write GET, PATCH, DELETE handlers**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    courseId: string
  }
}

// GET - Get course details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', params.courseId)
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Teachers can access their own courses, students can access active courses
    if (payload.role === 'teacher' && course.teacher_id !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Course GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update course
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates = await request.json()

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('courses')
      .select('teacher_id')
      .eq('id', params.courseId)
      .single()

    if (!existing || existing.teacher_id !== payload.userId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', params.courseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating course:', error)
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Course PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('courses')
      .select('teacher_id')
      .eq('id', params.courseId)
      .single()

    if (!existing || existing.teacher_id !== payload.userId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', params.courseId)

    if (error) {
      console.error('Error deleting course:', error)
      return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Course DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Test with curl**

```bash
# Get course
curl http://localhost:3000/api/courses/[course-id] -b cookies.txt

# Update course
curl -X PATCH http://localhost:3000/api/courses/[course-id] \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status":"active"}'

# Delete course
curl -X DELETE http://localhost:3000/api/courses/[course-id] -b cookies.txt
```

**Step 3: Commit**

```bash
git add app/api/courses/[courseId]/route.ts
git commit -m "feat: add course CRUD operations"
```

---

## Phase 3: Method 1 - Topic-Based Upload (Week 1, Days 6-7)

### Task 10: Create Lesson API Routes

**Files:**
- Create: `app/api/courses/[courseId]/lessons/route.ts`

**Step 1: Write lesson creation endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { TopicContent } from '@/types/course'

interface RouteParams {
  params: {
    courseId: string
  }
}

// GET - List lessons for course
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: lessons, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('course_id', params.courseId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
    }

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Lessons GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new lesson
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify course ownership
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_id')
      .eq('id', params.courseId)
      .single()

    if (!course || course.teacher_id !== payload.userId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { type, title, description, content } = await request.json()

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Type, title, and content are required' }, { status: 400 })
    }

    // Get current max order_index
    const { data: maxOrder } = await supabaseAdmin
      .from('lessons')
      .select('order_index')
      .eq('course_id', params.courseId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const orderIndex = (maxOrder?.order_index ?? -1) + 1

    const { data: lesson, error } = await supabaseAdmin
      .from('lessons')
      .insert({
        course_id: params.courseId,
        type,
        title,
        description,
        content,
        order_index: orderIndex,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lesson:', error)
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Lesson POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Test with curl**

```bash
curl -X POST http://localhost:3000/api/courses/[course-id]/lessons \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "topic",
    "title": "Cell Structure",
    "description": "Introduction to prokaryotic and eukaryotic cells",
    "content": {
      "topics": [
        {
          "name": "Prokaryotic Cells",
          "description": "Simple cells without nucleus",
          "learning_objectives": ["Identify key features", "Compare to eukaryotic"],
          "key_concepts": ["nucleoid", "ribosomes", "cell wall"]
        },
        {
          "name": "Eukaryotic Cells",
          "description": "Complex cells with membrane-bound organelles",
          "learning_objectives": ["List organelles", "Explain functions"],
          "key_concepts": ["nucleus", "mitochondria", "ER", "Golgi"]
        }
      ]
    }
  }'
```

Expected: 200 response with lesson object

**Step 3: Commit**

```bash
git add app/api/courses/[courseId]/lessons/route.ts
git commit -m "feat: add lesson creation API for topic-based content"
```

---

### Task 11: Create Professor Dashboard UI

**Files:**
- Create: `app/dashboard/page.tsx`

**Step 1: Write dashboard page**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Users, BarChart } from 'lucide-react'
import { Course } from '@/types/course'

export default function DashboardPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const { courses } = await response.json()
        setCourses(courses)
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    router.push('/dashboard/courses/new')
  }

  if (loading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="glass-panel-heavy p-12 rounded-3xl">
          <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen aurora-bg p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-hero font-light mb-4">
            <span className="text-gradient-gold">Professor Dashboard</span>
          </h1>
          <p className="text-white/60 text-xl">
            Manage your courses and guide students through Socratic learning
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <div className="glass-panel p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">{courses.length}</div>
                <div className="text-white/60 text-sm">Courses</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">0</div>
                <div className="text-white/60 text-sm">Active Students</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <BarChart className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-light text-white">0</div>
                <div className="text-white/60 text-sm">Sessions This Week</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-light text-white">Your Courses</h2>
            <Button
              onClick={handleCreateCourse}
              className="glass-panel-heavy hover:glass-hover border-white/20 text-white shadow-glow-gold luxury-transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Course
            </Button>
          </div>

          {courses.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-2xl font-light text-white mb-2">No courses yet</h3>
              <p className="text-white/60 mb-6">
                Create your first course to start guiding students through Socratic learning
              </p>
              <Button
                onClick={handleCreateCourse}
                variant="outline"
                className="glass-panel hover:glass-hover border-white/20 text-white"
              >
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="glass-panel p-6 cursor-pointer luxury-transition"
                  onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      course.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : course.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {course.status}
                    </div>
                    <div className="text-xs text-white/40">
                      {course.lms_type}
                    </div>
                  </div>

                  <h3 className="text-xl font-medium text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-white/60 text-sm line-clamp-2">
                    {course.description || 'No description'}
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-white/40">0 lessons</span>
                    <span className="text-white/40">0 students</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
```

**Step 2: Test in browser**

Visit: `http://localhost:3000/dashboard`
Expected: Dashboard with stats cards and course grid

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add professor dashboard with course overview"
```

---

## Phase 4: YouTube Integration (Week 2, Days 1-3)

### Task 12: Create YouTube Service

**Files:**
- Create: `lib/youtube/service.ts`

**Step 1: Install youtube-transcript dependency**

```bash
npm install youtube-transcript
```

**Step 2: Write YouTube service**

```typescript
import { google } from 'googleapis'

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
})

export interface YouTubeVideoMetadata {
  id: string
  title: string
  description: string
  duration: number // seconds
  thumbnail_url: string
  channel_name: string
  published_at: string
}

export interface YouTubeTranscript {
  text: string
  start: number
  duration: number
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Fetch video metadata using YouTube Data API v3
 */
export async function getVideoMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    })

    const video = response.data.items?.[0]
    if (!video) {
      throw new Error('Video not found')
    }

    // Parse ISO 8601 duration (PT1H2M10S) to seconds
    const duration = parseDuration(video.contentDetails?.duration || '')

    return {
      id: videoId,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      duration,
      thumbnail_url: video.snippet?.thumbnails?.high?.url || '',
      channel_name: video.snippet?.channelTitle || '',
      published_at: video.snippet?.publishedAt || '',
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error)
    throw new Error('Failed to fetch video metadata')
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Fetch video transcript using youtube-transcript library
 * Falls back gracefully if transcript unavailable
 */
export async function getVideoTranscript(videoId: string): Promise<string | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    // Combine all transcript segments into full text
    return transcript.map(item => item.text).join(' ')
  } catch (error) {
    console.warn(`Transcript unavailable for video ${videoId}:`, error)
    return null
  }
}
```

**Step 3: Test with known video**

```bash
# Create test script
cat > test-youtube.mjs << 'EOF'
import { getVideoMetadata, getVideoTranscript, extractVideoId } from './lib/youtube/service.ts'

const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const videoId = extractVideoId(url)
console.log('Video ID:', videoId)

const metadata = await getVideoMetadata(videoId)
console.log('Metadata:', metadata)

const transcript = await getVideoTranscript(videoId)
console.log('Transcript length:', transcript?.length || 0)
EOF

node test-youtube.mjs
```

Expected: Video metadata printed

**Step 4: Commit**

```bash
git add lib/youtube/service.ts package.json package-lock.json
git commit -m "feat: add YouTube Data API service with transcript fetching"
```

---

### Task 13: Create Learning Materials API

**Files:**
- Create: `app/api/courses/[courseId]/lessons/[lessonId]/materials/route.ts`

**Step 1: Write materials API**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getVideoMetadata, getVideoTranscript, extractVideoId } from '@/lib/youtube/service'

interface RouteParams {
  params: {
    courseId: string
    lessonId: string
  }
}

// POST - Add learning material (video/PDF/URL)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { type, title, source_url } = await request.json()

    if (!type || !source_url) {
      return NextResponse.json({ error: 'Type and source_url are required' }, { status: 400 })
    }

    let metadata = {}
    let transcript = null

    // Process YouTube videos
    if (type === 'video' && source_url.includes('youtube')) {
      const videoId = extractVideoId(source_url)
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }

      try {
        const videoMetadata = await getVideoMetadata(videoId)
        metadata = {
          duration: videoMetadata.duration,
          youtube_id: videoId,
          thumbnail_url: videoMetadata.thumbnail_url,
          channel_name: videoMetadata.channel_name,
        }

        // Fetch transcript for Claude context
        transcript = await getVideoTranscript(videoId)
      } catch (error) {
        console.error('Error processing YouTube video:', error)
        return NextResponse.json({ error: 'Failed to process YouTube video' }, { status: 500 })
      }
    }

    const { data: material, error } = await supabaseAdmin
      .from('learning_materials')
      .insert({
        lesson_id: params.lessonId,
        type,
        title: title || (metadata as any).title || 'Untitled',
        source_url,
        metadata,
        transcript,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material:', error)
      return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
    }

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Material POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List materials for lesson
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: materials, error } = await supabaseAdmin
      .from('learning_materials')
      .select('*')
      .eq('lesson_id', params.lessonId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching materials:', error)
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Materials GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Test with curl**

```bash
curl -X POST http://localhost:3000/api/courses/[course-id]/lessons/[lesson-id]/materials \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "video",
    "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Introduction to Cell Biology"
  }'
```

Expected: 200 response with material object including metadata and transcript

**Step 3: Commit**

```bash
git add app/api/courses/[courseId]/lessons/[lessonId]/materials/route.ts
git commit -m "feat: add learning materials API with YouTube integration"
```

---

### Task 14: Create Course Builder UI

**Files:**
- Create: `app/dashboard/courses/[courseId]/page.tsx`

**Step 1: Write course builder page**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Save, Trash2, Video, FileText } from 'lucide-react'
import { Course, Lesson } from '@/types/course'

interface CourseBuilderProps {
  params: {
    courseId: string
  }
}

export default function CourseBuilderPage({ params }: CourseBuilderProps) {
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourseData()
  }, [])

  const loadCourseData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`/api/courses/${params.courseId}`),
        fetch(`/api/courses/${params.courseId}/lessons`)
      ])

      if (courseRes.ok) {
        const { course: courseData } = await courseRes.json()
        setCourse(courseData)
      }

      if (lessonsRes.ok) {
        const { lessons: lessonsData } = await lessonsRes.json()
        setLessons(lessonsData)
      }
    } catch (error) {
      console.error('Failed to load course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLesson = () => {
    router.push(`/dashboard/courses/${params.courseId}/lessons/new`)
  }

  const handlePublishCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${params.courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })

      if (response.ok) {
        loadCourseData()
      }
    } catch (error) {
      console.error('Failed to publish course:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="glass-panel-heavy p-12 rounded-3xl">
          <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!course) {
    return <div>Course not found</div>
  }

  return (
    <div className="min-h-screen aurora-bg p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-light">
              <span className="text-gradient-gold">{course.title}</span>
            </h1>
            <div className="flex gap-3">
              {course.status === 'draft' && (
                <Button
                  onClick={handlePublishCourse}
                  className="glass-panel-heavy hover:glass-hover border-white/20 text-white shadow-glow-gold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Publish Course
                </Button>
              )}
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="glass-panel hover:glass-hover border-white/20 text-white"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          <p className="text-white/60">{course.description}</p>
        </motion.div>

        {/* Lessons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light text-white">Lessons</h2>
            <Button
              onClick={handleAddLesson}
              className="glass-panel hover:glass-hover border-white/20 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          {lessons.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-light text-white mb-2">No lessons yet</h3>
              <p className="text-white/60 mb-6">
                Add your first lesson to start building your course
              </p>
              <Button
                onClick={handleAddLesson}
                variant="outline"
                className="glass-panel hover:glass-hover border-white/20 text-white"
              >
                Create First Lesson
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-panel p-6 cursor-pointer hover:glass-hover luxury-transition"
                  onClick={() => router.push(`/dashboard/courses/${params.courseId}/lessons/${lesson.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white/40 text-sm">Lesson {index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          lesson.type === 'topic' ? 'bg-purple-500/20 text-purple-400' :
                          lesson.type === 'document' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {lesson.type}
                        </span>
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">
                        {lesson.title}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {lesson.description || 'No description'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Delete lesson handler
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
```

**Step 2: Test in browser**

Visit: `http://localhost:3000/dashboard/courses/[course-id]`
Expected: Course builder with lesson list

**Step 3: Commit**

```bash
git add app/dashboard/courses/[courseId]/page.tsx
git commit -m "feat: add course builder UI with lesson management"
```

---

## Phase 5: Canvas Integration Setup (Week 3, Days 1-2)

### Task 15: Create Canvas LTI Authentication

**Files:**
- Create: `lib/canvas/lti.ts`

**Step 1: Install dependencies**

```bash
npm install jsonwebtoken jwks-rsa
```

**Step 2: Write LTI authentication service**

```typescript
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const client = jwksClient({
  jwksUri: process.env.CANVAS_JWKS_URL!,
  cache: true,
  rateLimit: true,
})

export interface LTILaunchData {
  user_id: string
  user_name: string
  user_email: string
  roles: string[]
  course_id: string
  course_name: string
  deployment_id: string
}

/**
 * Verify LTI 1.3 launch JWT from Canvas
 */
export async function verifyLTIToken(token: string): Promise<LTILaunchData> {
  try {
    // Decode without verification to get kid
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid token structure')
    }

    const kid = decoded.header.kid
    if (!kid) {
      throw new Error('No kid in token header')
    }

    // Get signing key from Canvas JWKS endpoint
    const key = await client.getSigningKey(kid)
    const publicKey = key.getPublicKey()

    // Verify JWT signature
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: process.env.CANVAS_INSTANCE_URL,
    }) as any

    // Extract LTI claims
    return {
      user_id: payload.sub,
      user_name: payload.name || payload['https://purl.imsglobal.org/spec/lti/claim/lis']?.person_name_full,
      user_email: payload.email || payload['https://purl.imsglobal.org/spec/lti/claim/lis']?.person_contact_email_primary,
      roles: payload['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
      course_id: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.id || '',
      course_name: payload['https://purl.imsglobal.org/spec/lti/claim/context']?.title || '',
      deployment_id: payload['https://purl.imsglobal.org/spec/lti/claim/deployment_id'] || '',
    }
  } catch (error) {
    console.error('LTI token verification failed:', error)
    throw new Error('Invalid LTI launch token')
  }
}

/**
 * Determine user role from LTI roles array
 */
export function parseRole(roles: string[]): 'teacher' | 'student' {
  const roleString = roles.join(',').toLowerCase()

  if (roleString.includes('instructor') ||
      roleString.includes('teacher') ||
      roleString.includes('teachingassistant')) {
    return 'teacher'
  }

  return 'student'
}
```

**Step 3: Commit**

```bash
git add lib/canvas/lti.ts package.json package-lock.json
git commit -m "feat: add Canvas LTI 1.3 authentication service"
```

---

### Task 16: Create LTI Launch Endpoint

**Files:**
- Create: `app/api/auth/lti/route.ts`
- Create: `app/api/auth/lti/jwks/route.ts`

**Step 1: Generate RSA key pair for JWK**

```bash
# Generate private key
openssl genrsa -out lti_private_key.pem 2048

# Generate public key
openssl rsa -in lti_private_key.pem -pubout -out lti_public_key.pem

# Convert to JWK format (use online tool or library)
# Add to .env.local as base64
cat lti_private_key.pem | base64
```

**Step 2: Write LTI launch handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyLTIToken, parseRole } from '@/lib/canvas/lti'
import { supabaseAdmin } from '@/lib/supabase/server'
import { signToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const idToken = formData.get('id_token') as string

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id_token' }, { status: 400 })
    }

    // Verify LTI token from Canvas
    const ltiData = await verifyLTIToken(idToken)
    const role = parseRole(ltiData.roles)

    // Find or create user
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('canvas_id', ltiData.user_id)
      .single()

    if (!user) {
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          canvas_id: ltiData.user_id,
          name: ltiData.user_name,
          email: ltiData.user_email,
          role,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      user = newUser
    }

    // Find or create course
    let { data: course } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('lms_course_id', ltiData.course_id)
      .eq('lms_type', 'canvas')
      .single()

    if (!course && role === 'teacher') {
      const { data: newCourse } = await supabaseAdmin
        .from('courses')
        .insert({
          teacher_id: user.id,
          lms_type: 'canvas',
          lms_course_id: ltiData.course_id,
          title: ltiData.course_name,
          status: 'active',
        })
        .select()
        .single()

      course = newCourse
    }

    // Generate JWT for session
    const token = signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })

    // Redirect to appropriate page
    const redirectUrl = role === 'teacher'
      ? `/dashboard/courses/${course?.id}`
      : `/chat?courseId=${course?.id}`

    const response = NextResponse.redirect(new URL(redirectUrl, request.url))
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for LTI iframe
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('LTI launch error:', error)
    return NextResponse.json({ error: 'Launch failed' }, { status: 500 })
  }
}
```

**Step 3: Write JWKS endpoint**

```typescript
// app/api/auth/lti/jwks/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  // Load public key from environment
  const publicKeyPem = Buffer.from(process.env.LTI_PUBLIC_KEY_BASE64!, 'base64').toString('utf-8')

  // Convert PEM to JWK format
  const publicKey = crypto.createPublicKey(publicKeyPem)
  const jwk = publicKey.export({ format: 'jwk' })

  return NextResponse.json({
    keys: [
      {
        ...jwk,
        alg: 'RS256',
        use: 'sig',
        kid: 'professor-carl-lti-key',
      }
    ]
  })
}
```

**Step 4: Test LTI launch**

1. Configure Canvas Developer Key with your endpoints
2. Add tool to Canvas course
3. Click tool link in Canvas
4. Should redirect to Professor Carl with authenticated session

**Step 5: Commit**

```bash
git add app/api/auth/lti/route.ts app/api/auth/lti/jwks/route.ts
git commit -m "feat: add Canvas LTI 1.3 launch endpoint with JWKS"
```

---

**[Full plan continues with remaining 34 tasks... Due to token limits, I'm showing the structure and first few tasks of each phase]**

**Remaining tasks follow same detailed pattern:**

## Phase 6: Canvas REST API Integration (Week 3)
- Task 17-22: OAuth flow, access token management, course sync

## Phase 7: Student Experience (Week 3-4)
- Task 23-28: Course enrollment, lesson player, progress tracking

## Phase 8: Claude Dialogue Integration (Week 4)
- Task 29-34: Lesson context loading, enhanced prompts with materials

## Phase 9: Professor Dashboard Polish (Week 4)
- Task 35-40: Upload wizards, analytics, bulk operations

## Phase 10: QA & Demo Preparation (Week 4)
- Task 41-50: E2E testing, error handling, demo script, deployment

---

## Testing Strategy

**Unit Tests (after each task):**
```bash
npm run test:unit -- [test-file]
```

**Integration Tests (after each phase):**
```bash
npm run test:integration
```

**E2E Tests (before deployment):**
```bash
npm run test:e2e
```

**Code Review Gates:**
- Use @superpowers:code-review-expert after completing each phase
- Fix all high-priority issues before proceeding

---

## Agent Distribution

**Phase 1-2 (Database + Backend):** @backend-developer agent
**Phase 3-5 (Upload UIs):** @react-developer agent
**Phase 6-7 (Canvas Integration):** @backend-developer + @devops-engineer agents in parallel
**Phase 8-9 (Student UX + Claude):** @react-developer + @backend-developer agents in parallel
**Phase 10 (QA):** @test-expert + @qa-engineer agents in parallel

**Quality Gates:** @code-review-expert reviews code before each phase completion

---

## Deployment Checklist

**Before deploying to Vercel:**

1. ✅ All credentials added to Vercel environment variables
2. ✅ Database migrations applied to production Supabase
3. ✅ Build passes locally: `npm run build`
4. ✅ All tests pass: `npm run test`
5. ✅ Code reviewed by @code-review-expert
6. ✅ Demo script prepared for keynote
7. ✅ Canvas instance configured with LTI keys
8. ✅ Test course created with sample content

---

**This is a COMPLETE plan for 50+ tasks. Due to length, showing structure for first 11 tasks. Full plan would continue through all phases with same level of detail.**

**Next Step:** Would you like me to:
1. **Continue writing the full 50-task plan** (will be ~3000 lines)
2. **Start implementation using subagent-driven-development** (execute Phase 1 tasks now)
3. **Save current plan and review** before expanding to full detail
