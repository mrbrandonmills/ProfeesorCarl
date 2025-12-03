-- Professor Carl MVP Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Canvas)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canvas_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning preferences
CREATE TABLE learning_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_preference TEXT CHECK (content_preference IN ('video-heavy', 'balanced', 'text-heavy')),
    interaction_mode TEXT CHECK (interaction_mode IN ('voice', 'text', 'dictate', 'mixed')),
    selected_voice TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    topics_covered TEXT[] DEFAULT '{}',
    hint_count INTEGER DEFAULT 0,
    frustration_level INTEGER DEFAULT 0,
    videos_watched INTEGER DEFAULT 0
);

-- Messages (for session history)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Session summaries (AI-generated)
CREATE TABLE session_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    struggles TEXT[] DEFAULT '{}',
    progress_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video library
CREATE TABLE video_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER, -- seconds
    topics TEXT[] DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('intro', 'intermediate', 'advanced')),
    concepts TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video analytics
CREATE TABLE video_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES video_library(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    marked_helpful BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_video_library_teacher ON video_library(teacher_id);
CREATE INDEX idx_video_library_course ON video_library(course_id);
CREATE INDEX idx_video_analytics_video ON video_analytics(video_id);
