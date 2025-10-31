# Professor Carl - Teacher Dashboard Architecture

## Overview
Professional dashboard for teachers to manage students, upload lesson plans, track progress, and monitor academic integrity.

## Core Features

### 1. Teacher Authentication
- Email/password login
- Google SSO (for school districts)
- Role-based access (Teacher, Admin, District)

### 2. Lesson Plan Management
- Upload lesson plans (PDF, DOCX, TXT, MD)
- Parse and extract learning objectives
- Tag with standards (Common Core, state-specific)
- Assign to classes/students
- Version control for lesson plan updates

### 3. Class & Student Management
- Create classes (periods, sections)
- Add students (bulk import via CSV)
- Generate unique student access codes
- Track enrollment by class
- Parent access codes for monitoring

### 4. Student Analytics Dashboard
**Individual Student View:**
- Total sessions, questions asked, hints received
- Socratic engagement score (attempts before hints)
- Topics discussed (extracted from conversations)
- Time spent on each topic
- Academic integrity score
- Progress over time (charts)

**Class-Wide View:**
- Average engagement metrics
- Most discussed topics
- Students needing attention (low engagement, too many hints)
- Class performance trends
- Comparison across periods

### 5. Academic Integrity Monitoring
**Session Transcripts:**
- Full conversation history per student
- Searchable by topic, date, keyword
- Flag suspicious patterns:
  - Copy-paste detection (rapid identical questions)
  - Minimal engagement (direct answer seeking)
  - Off-topic requests
  - Inappropriate use attempts

**Integrity Indicators:**
- Student attempt rate before seeking hints
- Question depth (shallow vs. thoughtful)
- Follow-up engagement
- Time spent per response

### 6. Reports & Exports
**Weekly Teacher Summary:**
- Student engagement overview
- Top performing students
- Students needing intervention
- Most discussed topics
- Academic integrity alerts

**Export Options:**
- CSV/Excel exports for admin
- PDF reports for parents
- Standards alignment reports
- District compliance reports

### 7. Lesson Plan Integration
**How It Works:**
- Teacher uploads lesson plan for "To Kill a Mockingbird - Chapter 3"
- System extracts: themes, key questions, vocabulary, objectives
- When student asks about Chapter 3, Carl references the lesson plan
- Carl aligns Socratic questions with lesson objectives
- Teacher sees which students engaged with which topics

**Benefits:**
- Personalized tutoring aligned with classroom instruction
- No disconnect between class and tutoring
- Teacher controls the curriculum, Carl enforces the method

## Database Schema

### Tables

#### `teachers`
- `id` (UUID, primary key)
- `email` (unique)
- `name`
- `school_district`
- `password_hash`
- `role` (teacher, admin, district_admin)
- `created_at`
- `last_login`

#### `classes`
- `id` (UUID, primary key)
- `teacher_id` (foreign key)
- `name` (e.g., "English 10 - Period 2")
- `grade_level`
- `subject`
- `school_year`
- `created_at`

#### `students`
- `id` (UUID, primary key)
- `access_code` (unique, auto-generated)
- `first_name`
- `last_name`
- `class_id` (foreign key)
- `parent_email` (optional)
- `created_at`

#### `lesson_plans`
- `id` (UUID, primary key)
- `teacher_id` (foreign key)
- `class_id` (foreign key, nullable - can be teacher-wide)
- `title`
- `content_text` (parsed from upload)
- `file_url` (original file storage)
- `topics` (JSON array of extracted topics)
- `objectives` (JSON array of learning objectives)
- `standards` (JSON array of educational standards)
- `created_at`
- `updated_at`

#### `sessions`
- `id` (UUID, primary key)
- `student_id` (foreign key)
- `lesson_plan_id` (foreign key, nullable)
- `messages` (JSON array of conversation)
- `session_state` (JSON: attempts, hints, questions, etc.)
- `topics_discussed` (JSON array)
- `integrity_score` (calculated)
- `engagement_score` (calculated)
- `started_at`
- `ended_at`
- `duration_seconds`

#### `session_messages` (for searchable transcripts)
- `id` (UUID, primary key)
- `session_id` (foreign key)
- `role` (user/assistant)
- `content` (text)
- `timestamp`
- `metadata` (JSON: warnings, hints, videos, etc.)

#### `integrity_flags`
- `id` (UUID, primary key)
- `session_id` (foreign key)
- `student_id` (foreign key)
- `flag_type` (copy_paste, rapid_fire, off_topic, direct_answer_seeking)
- `severity` (low, medium, high)
- `details` (JSON)
- `reviewed_by_teacher` (boolean)
- `created_at`

## Technology Stack

### Frontend
- **Dashboard:** Next.js 15 (App Router)
- **Charts:** Recharts or Chart.js
- **Tables:** TanStack Table (React Table v8)
- **File Upload:** react-dropzone
- **Auth:** NextAuth.js

### Backend
- **API Routes:** Next.js API Routes (serverless)
- **Database:** PostgreSQL (Vercel Postgres or Supabase)
- **File Storage:** Vercel Blob Storage or AWS S3
- **Document Parsing:** pdf-parse (PDF), mammoth (DOCX)

### Infrastructure
- **Hosting:** Vercel (existing)
- **Database:** Vercel Postgres (easy integration)
- **Auth:** NextAuth with Google provider

## User Flow

### Teacher Onboarding
1. Teacher signs up with email or Google
2. Creates first class
3. Uploads student roster (CSV or manual entry)
4. System generates unique access codes for students
5. Teacher uploads first lesson plan
6. Dashboard shows empty state with quick start guide

### Student Access
1. Student visits proffesorcarl.com
2. Enters access code (no account needed)
3. Mapped to class and teacher
4. All sessions tracked and visible to teacher

### Daily Teacher Workflow
1. Login to dashboard
2. See overview: "5 students engaged yesterday, 3 need attention"
3. Click into student profile
4. Review conversation transcript
5. Export report for parent conference
6. Upload new lesson plan for next unit

## Competitive Advantages

### vs. Microsoft Copilot / Magic School
- **Academic Integrity:** Full transcript monitoring, not a black box
- **Curriculum Control:** Teacher owns the content via lesson plans
- **Socratic Method:** Prevents AI cheating, forces student thinking
- **Detailed Analytics:** See exactly what students are learning
- **Standards Alignment:** Auto-tag with educational standards

### Positioning
"Microsoft gives your students answers. Professor Carl makes them think."

"Your district AI is for planning. Professor Carl is for learning."

"Complement your existing tools with enforced academic integrity."

## Pricing Model

### Tier 1: Individual Teachers
- $500/year
- Up to 150 students (5 classes × 30 students)
- Full dashboard access
- Unlimited lesson plans
- Email support

### Tier 2: School Site License
- $3,000/year
- Up to 500 students
- Unlimited teachers
- School admin dashboard
- Priority support
- Custom branding

### Tier 3: District License
- Custom pricing
- Unlimited students/teachers
- District admin dashboard
- API access for LMS integration
- Dedicated support
- SSO integration

## MVP Features (Phase 1)

**Week 1-2:**
1. Teacher authentication (email/password)
2. Class creation
3. Student access code generation
4. Basic student list view

**Week 3-4:**
5. Session tracking (connect existing chat to student profiles)
6. Lesson plan upload (file storage only, no parsing)
7. Basic analytics dashboard (sessions, engagement)

**Week 5-6:**
8. Session transcript viewer
9. Student profile page with stats
10. Export to CSV

**Phase 2 (Future):**
- Advanced lesson plan parsing
- Academic integrity auto-flagging
- Parent portal
- Google SSO
- LMS integration (Google Classroom, Canvas)

## Implementation Plan

**Step 1:** Database setup (Vercel Postgres)
**Step 2:** Teacher auth pages (/dashboard/login, /dashboard/register)
**Step 3:** Dashboard layout and navigation
**Step 4:** Class management UI
**Step 5:** Modify existing chat API to track student sessions
**Step 6:** Analytics dashboard
**Step 7:** Transcript viewer
**Step 8:** Lesson plan upload
**Step 9:** Reports and exports

## Security & Privacy

- Student data encrypted at rest
- Teacher-student data isolation (teachers only see their students)
- FERPA compliant data handling
- Optional: SSO for district security
- Session data retention: 2 years (configurable)
- Parent access requires teacher approval

## Success Metrics

**For Teachers:**
- Time saved on office hours
- Early identification of struggling students
- Evidence of student engagement for admin

**For Students:**
- Improved critical thinking (measured by hint tier progression)
- Higher engagement with assigned texts
- Academic integrity maintained

**For Districts:**
- Scalable tutoring without hiring costs
- Standards compliance tracking
- ROI: $500/teacher vs. $40/hr tutor × 10 hrs/week = $400/week saved
