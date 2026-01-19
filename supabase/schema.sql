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

-- Teaching Strategies (Experiential Memory)
-- Based on 2026 research: "Experiential memory stores trajectories - past actions → outcomes"
-- Remembers what teaching approaches WORKED for each student
CREATE TABLE teaching_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,  -- Student this worked for
    topic VARCHAR(255) NOT NULL,  -- Subject area (calculus, derivatives, limits, etc.)
    strategy_used TEXT NOT NULL,  -- Teaching approach (visual, analogy, socratic, examples, step-by-step)
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('breakthrough', 'partial_success', 'no_progress', 'confusion')),
    hume_arousal_before DECIMAL(3,2),  -- Emotional state at start (0-1)
    hume_arousal_after DECIMAL(3,2),   -- Emotional state at end (0-1)
    arousal_delta DECIMAL(3,2) GENERATED ALWAYS AS (hume_arousal_after - hume_arousal_before) STORED,
    session_id VARCHAR(255),
    evidence TEXT,  -- What indicated the outcome
    created_at TIMESTAMPTZ DEFAULT NOW(),
    success_score DECIMAL(3,2) DEFAULT 0.5,  -- RL-updated score (0-1)
    times_used INTEGER DEFAULT 1,  -- How many times we've tried this
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup of successful strategies by user and topic
CREATE INDEX idx_teaching_strategies_user_topic ON teaching_strategies(user_id, topic);
CREATE INDEX idx_teaching_strategies_success ON teaching_strategies(success_score DESC);
CREATE INDEX idx_teaching_strategies_outcome ON teaching_strategies(outcome);

-- Indexes for performance
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_video_library_teacher ON video_library(teacher_id);
CREATE INDEX idx_video_library_course ON video_library(course_id);
CREATE INDEX idx_video_analytics_video ON video_analytics(video_id);
