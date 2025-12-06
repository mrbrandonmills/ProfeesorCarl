-- ============================================
-- PROFESSOR CARL - LESSON PLAN SYSTEM SCHEMA
-- ============================================
-- Created: 2025-01-02
-- Purpose: Support 3 upload methods for course content
--   1. Topic-based upload (manual entry)
--   2. Document + Video upload (hybrid)
--   3. Canvas import (future - requires admin access)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE USER MANAGEMENT
-- ============================================

-- Users table (professors and students)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'professor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning preferences (for students)
CREATE TABLE IF NOT EXISTS learning_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_preference TEXT CHECK (content_preference IN ('video-heavy', 'balanced', 'text-heavy')),
    interaction_mode TEXT CHECK (interaction_mode IN ('text', 'dictate', 'mixed')),
    selected_voice TEXT CHECK (selected_voice IN ('alloy', 'echo', 'nova')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- LESSON PLAN SYSTEM - COURSE STRUCTURE
-- ============================================

-- Courses (uploaded by professors)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    upload_method TEXT CHECK (upload_method IN ('topic-based', 'document-video', 'canvas-import')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons (belong to courses, ordered sequence)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT[] DEFAULT '{}',
    lesson_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, lesson_order)
);

-- Materials (belong to lessons: videos, docs, PDFs)
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video', 'document', 'pdf', 'link')),
    title TEXT NOT NULL,
    content_url TEXT NOT NULL, -- YouTube URL, S3 URL, or external link
    transcript TEXT, -- Auto-fetched for videos, extracted for docs
    duration_seconds INTEGER, -- For videos
    file_size_bytes BIGINT, -- For documents/PDFs
    material_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lesson_id, material_order)
);

-- ============================================
-- STUDENT PROGRESS TRACKING
-- ============================================

-- Course enrollments (students enroll in courses)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Material-level progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, material_id)
);

-- ============================================
-- SOCRATIC CHAT SESSIONS
-- ============================================

-- Chat sessions (when students learn via Socratic dialogue)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL, -- Optional: specific material context
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    hint_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages (conversation history)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session summaries (AI-generated insights)
CREATE TABLE IF NOT EXISTS session_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    key_concepts_learned TEXT[] DEFAULT '{}',
    struggles TEXT[] DEFAULT '{}',
    progress_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- User lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Course hierarchy
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_materials_lesson ON materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_materials_order ON materials(lesson_id, material_order);

-- Progress tracking
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_material ON student_progress(material_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON student_progress(user_id, status);

-- Chat sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON chat_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_lesson ON chat_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(session_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Note: Enable RLS after Supabase setup
-- Students can only see their own data
-- Professors can see their courses and enrolled students
-- Admins can see everything

-- Example RLS policies (uncomment after Supabase setup):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Professors can view own courses" ON courses FOR SELECT USING (auth.uid() = teacher_id);
-- CREATE POLICY "Students can view own progress" ON student_progress FOR SELECT USING (auth.uid() = user_id);
