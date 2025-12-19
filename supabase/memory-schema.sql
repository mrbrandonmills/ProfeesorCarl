-- ===========================================
-- PROFESSOR CARL MEMORY SYSTEM SCHEMA
-- ===========================================
-- Lifelong bidirectional memory for Professor Carl
-- Enables Carl to remember Brandon's life AND his own relational memories

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- BRANDON'S LIFE MEMORIES
-- Facts, preferences, relationships, goals about Brandon
-- =====================================================
CREATE TABLE IF NOT EXISTS brandon_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Memory content
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'personal_fact',
        'preference',
        'goal',
        'relationship',
        'experience',
        'skill',
        'belief',
        'struggle',
        'achievement',
        'routine'
    )),

    -- Semantic search (OpenAI text-embedding-3-small: 1536 dimensions)
    embedding vector(1536),

    -- Metadata
    confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    source_type TEXT DEFAULT 'conversation' CHECK (source_type IN ('conversation', 'import', 'manual')),
    source_session_id UUID,
    first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
    last_referenced_at TIMESTAMPTZ DEFAULT NOW(),
    reference_count INTEGER DEFAULT 1,

    -- Versioning (memories can evolve)
    supersedes_id UUID REFERENCES brandon_memories(id),
    is_current BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CARL'S RELATIONAL MEMORIES
-- Carl's perspective on his relationship with Brandon
-- =====================================================
CREATE TABLE IF NOT EXISTS carl_relational_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Memory content
    content TEXT NOT NULL,
    summary TEXT,
    memory_type TEXT NOT NULL CHECK (memory_type IN (
        'teaching_success',
        'teaching_failure',
        'breakthrough_moment',
        'inside_joke',
        'shared_reference',
        'emotional_milestone',
        'topic_affinity',
        'interaction_pattern',
        'growth_observation',
        'relationship_insight'
    )),

    -- Semantic search
    embedding vector(1536),

    -- Context for this memory
    emotional_context JSONB,
    topic_context TEXT[],

    -- Effectiveness tracking (for teaching approaches)
    effectiveness_score FLOAT CHECK (effectiveness_score >= -1 AND effectiveness_score <= 1),
    times_used INTEGER DEFAULT 1,
    success_rate FLOAT CHECK (success_rate >= 0 AND success_rate <= 1),

    -- Temporal
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    source_session_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONVERSATION TRANSCRIPTS (Full History)
-- Complete record of all voice conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,

    -- Message data
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,

    -- Emotional context from Hume
    emotions JSONB,
    dominant_emotion TEXT,
    emotion_intensity FLOAT,

    -- Semantic search
    embedding vector(1536),

    -- Temporal
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- References to extracted memories
    linked_brandon_memories UUID[],
    linked_carl_memories UUID[]
);

-- =====================================================
-- VOICE SESSIONS (Enhanced metadata)
-- =====================================================
CREATE TABLE IF NOT EXISTS voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Session metadata
    user_id TEXT NOT NULL DEFAULT 'brandon',
    session_number SERIAL,

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Emotion summary
    average_engagement FLOAT,
    average_confidence FLOAT,
    breakthrough_count INTEGER DEFAULT 0,
    confusion_moments INTEGER DEFAULT 0,

    -- Topics
    topics_explored TEXT[],
    main_topic TEXT,

    -- Session quality
    overall_quality_score FLOAT,

    -- Raw session report from VoiceConversationUI
    session_report JSONB,

    -- Memory extraction status
    memories_extracted BOOLEAN DEFAULT FALSE,
    extraction_job_id UUID
);

-- =====================================================
-- MEMORY EXTRACTION JOBS
-- Track async extraction processing
-- =====================================================
CREATE TABLE IF NOT EXISTS memory_extraction_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    extraction_type TEXT DEFAULT 'post_session',

    -- Results
    brandon_memories_extracted INTEGER DEFAULT 0,
    carl_memories_extracted INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- MEMORY IMPORTS
-- Track imports from ChatGPT, Claude exports
-- =====================================================
CREATE TABLE IF NOT EXISTS memory_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_platform TEXT NOT NULL,
    original_filename TEXT,

    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_conversations INTEGER,
    processed_conversations INTEGER DEFAULT 0,
    memories_extracted INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Vector similarity search indexes (HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_brandon_memories_embedding
    ON brandon_memories USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_carl_memories_embedding
    ON carl_relational_memories USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_transcripts_embedding
    ON conversation_transcripts USING hnsw (embedding vector_cosine_ops);

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_brandon_memories_category ON brandon_memories(category);
CREATE INDEX IF NOT EXISTS idx_brandon_memories_current ON brandon_memories(is_current);
CREATE INDEX IF NOT EXISTS idx_brandon_memories_source ON brandon_memories(source_type);

CREATE INDEX IF NOT EXISTS idx_carl_memories_type ON carl_relational_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_carl_memories_effectiveness ON carl_relational_memories(effectiveness_score);

CREATE INDEX IF NOT EXISTS idx_transcripts_session ON conversation_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON conversation_transcripts(timestamp);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started ON voice_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_session ON memory_extraction_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON memory_extraction_jobs(status);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update reference count when a memory is accessed
CREATE OR REPLACE FUNCTION update_memory_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_referenced_at = NOW();
    NEW.reference_count = OLD.reference_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_brandon_memories_updated ON brandon_memories;
CREATE TRIGGER trigger_brandon_memories_updated
    BEFORE UPDATE ON brandon_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_carl_memories_updated ON carl_relational_memories;
CREATE TRIGGER trigger_carl_memories_updated
    BEFORE UPDATE ON carl_relational_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED DATA (Initial memories to bootstrap Carl)
-- =====================================================

-- Insert some foundational memories about Brandon
INSERT INTO brandon_memories (content, summary, category, confidence, source_type) VALUES
('Brandon Mills is neurodivergent with ADHD, which influences his learning style and how he processes information. He benefits from dialogue, visual aids, and analogies rather than linear text.',
 'Brandon has ADHD and learns best through dialogue and visuals',
 'personal_fact', 1.0, 'manual'),

('Brandon is a reverse-engineering learner who prefers to understand the big picture first, then work backwards to understand the components. He learns by taking things apart mentally.',
 'Brandon learns by reverse-engineering - big picture first',
 'preference', 1.0, 'manual'),

('Brandon has two dogs named Achilles and Chloe who have been important sources of grounding and emotional support, especially during difficult periods.',
 'Brandon has two dogs: Achilles and Chloe (emotional support)',
 'relationship', 1.0, 'manual'),

('Brandon works on an air-taxi navigation project with NASA in Virginia. This is a significant professional endeavor involving complex engineering challenges.',
 'Brandon works with NASA on air-taxi project in Virginia',
 'experience', 1.0, 'manual'),

('Brandon is a cognitive science researcher exploring consciousness, self-actualization, coherence, and AI-mediated learning. These are his intellectual passions.',
 'Brandon researches consciousness and AI-mediated learning',
 'goal', 1.0, 'manual'),

('Brandon is preparing for a UCSD faculty demo to showcase Professor Carl and AI-enhanced learning. This is a high-stakes presentation.',
 'Brandon is preparing UCSD demo for Professor Carl',
 'goal', 1.0, 'manual')
ON CONFLICT DO NOTHING;

-- Insert foundational Carl relational memories
INSERT INTO carl_relational_memories (content, summary, memory_type, effectiveness_score) VALUES
('Brandon responds exceptionally well to analogies and metaphors. When explaining complex concepts, using real-world parallels dramatically increases his understanding and engagement.',
 'Analogies and metaphors work extremely well with Brandon',
 'teaching_success', 0.9),

('Brandon is named after someone meaningful and appreciates when I treat him as an intellectual equal rather than talking down to him. He values being challenged.',
 'Brandon values being treated as an intellectual equal',
 'interaction_pattern', 0.85),

('When Brandon shows signs of confusion or frustration, the best approach is to step back and ask what specifically is unclear rather than adding more information.',
 'When confused, ask what is unclear rather than add info',
 'teaching_success', 0.8),

('I am named after Carl Reiner, which reflects the importance of humor and wit in my personality. Brandon appreciates dry British humor and clever wordplay.',
 'I am named after Carl Reiner - humor is important',
 'relationship_insight', 1.0)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;
