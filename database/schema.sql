-- Professor Carl Teacher Dashboard - Database Schema
-- PostgreSQL Schema for Vercel Postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    school_district VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'district_admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    INDEX idx_teachers_email (email)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    subject VARCHAR(100),
    school_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_classes_teacher (teacher_id)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    parent_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_students_access_code (access_code),
    INDEX idx_students_class (class_id)
);

-- Lesson plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content_text TEXT,
    file_url VARCHAR(1000),
    topics JSONB DEFAULT '[]',
    objectives JSONB DEFAULT '[]',
    standards JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lesson_plans_teacher (teacher_id),
    INDEX idx_lesson_plans_class (class_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    lesson_plan_id UUID REFERENCES lesson_plans(id) ON DELETE SET NULL,
    session_state JSONB DEFAULT '{}',
    topics_discussed JSONB DEFAULT '[]',
    integrity_score INTEGER CHECK (integrity_score >= 0 AND integrity_score <= 100),
    engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    INDEX idx_sessions_student (student_id),
    INDEX idx_sessions_started (started_at)
);

-- Session messages table (for searchable transcripts)
CREATE TABLE IF NOT EXISTS session_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    INDEX idx_messages_session (session_id),
    INDEX idx_messages_timestamp (timestamp)
);

-- Integrity flags table
CREATE TABLE IF NOT EXISTS integrity_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('copy_paste', 'rapid_fire', 'off_topic', 'direct_answer_seeking')),
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    details JSONB DEFAULT '{}',
    reviewed_by_teacher BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_flags_student (student_id),
    INDEX idx_flags_session (session_id),
    INDEX idx_flags_reviewed (reviewed_by_teacher)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_lesson_plans_updated_at
    BEFORE UPDATE ON lesson_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique access codes
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character code (e.g., "CARL2024")
        code := 'CARL' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

        -- Check if it exists
        SELECT EXISTS(SELECT 1 FROM students WHERE access_code = code) INTO exists;

        EXIT WHEN NOT exists;
    END LOOP;

    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional - comment out for production)
-- INSERT INTO teachers (email, name, school_district, password_hash, role) VALUES
-- ('carl@test.com', 'Professor Carl', 'Vancouver School Board', '$2a$10$dummy_hash', 'teacher');
