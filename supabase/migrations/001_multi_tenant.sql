-- ===========================================
-- MULTI-TENANT MIGRATION
-- ===========================================
-- Adds user_id to all memory tables for multi-user support
-- Run: Apply via Supabase dashboard or CLI

-- =====================================================
-- 1. RENAME brandon_memories → user_memories
-- =====================================================
ALTER TABLE IF EXISTS brandon_memories RENAME TO user_memories;

-- =====================================================
-- 2. ADD user_id COLUMNS
-- =====================================================

-- User memories (formerly brandon_memories)
ALTER TABLE user_memories
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'brandon';

-- Carl's relational memories (scoped per user)
ALTER TABLE carl_relational_memories
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'brandon';

-- Conversation transcripts
ALTER TABLE conversation_transcripts
ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'brandon';

-- =====================================================
-- 3. CREATE INDEXES FOR user_id QUERIES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_memories_user_id
ON user_memories(user_id);

CREATE INDEX IF NOT EXISTS idx_user_memories_user_category
ON user_memories(user_id, category);

CREATE INDEX IF NOT EXISTS idx_user_memories_user_current
ON user_memories(user_id, is_current);

CREATE INDEX IF NOT EXISTS idx_carl_memories_user_id
ON carl_relational_memories(user_id);

CREATE INDEX IF NOT EXISTS idx_carl_memories_user_type
ON carl_relational_memories(user_id, memory_type);

CREATE INDEX IF NOT EXISTS idx_transcripts_user_id
ON conversation_transcripts(user_id);

CREATE INDEX IF NOT EXISTS idx_transcripts_user_session
ON conversation_transcripts(user_id, session_id);

-- =====================================================
-- 4. UPDATE VECTOR SEARCH FUNCTION (if exists)
-- =====================================================

-- Function for semantic search with user_id filter
CREATE OR REPLACE FUNCTION search_user_memories(
    p_user_id TEXT,
    p_embedding vector(1536),
    p_limit INTEGER DEFAULT 5,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    summary TEXT,
    category TEXT,
    confidence FLOAT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.summary,
        m.category,
        m.confidence,
        1 - (m.embedding <=> p_embedding) AS similarity
    FROM user_memories m
    WHERE m.user_id = p_user_id
      AND m.is_current = true
      AND (p_category IS NULL OR m.category = p_category)
    ORDER BY m.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function for Carl's memories with user_id filter
CREATE OR REPLACE FUNCTION search_carl_memories(
    p_user_id TEXT,
    p_embedding vector(1536),
    p_limit INTEGER DEFAULT 5,
    p_memory_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    summary TEXT,
    memory_type TEXT,
    effectiveness_score FLOAT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.summary,
        m.memory_type,
        m.effectiveness_score,
        1 - (m.embedding <=> p_embedding) AS similarity
    FROM carl_relational_memories m
    WHERE m.user_id = p_user_id
      AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    ORDER BY m.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VERIFY MIGRATION
-- =====================================================
-- Run these to verify:
-- SELECT COUNT(*) FROM user_memories WHERE user_id = 'brandon';
-- SELECT COUNT(*) FROM carl_relational_memories WHERE user_id = 'brandon';
-- \d user_memories
