-- ===========================================
-- ADVANCED MEMORY SYSTEM - HUMAN-LIKE RECALL
-- ===========================================
-- Implements LUFY emotional salience, Ebbinghaus forgetting curve,
-- and reinforcement learning for memory retrieval
-- Based on: arxiv.org/abs/2305.10250, arxiv.org/abs/2503.08026

-- =====================================================
-- 1. EXTEND USER_MEMORIES WITH EMOTIONAL SALIENCE
-- =====================================================

-- Emotional context and importance scoring
ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    emotional_arousal FLOAT DEFAULT 0.5 CHECK (emotional_arousal >= 0 AND emotional_arousal <= 1);

ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    emotional_valence FLOAT DEFAULT 0.0 CHECK (emotional_valence >= -1 AND emotional_valence <= 1);

ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    dominant_emotion TEXT DEFAULT 'neutral';

ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    llm_importance FLOAT DEFAULT 0.5 CHECK (llm_importance >= 0 AND llm_importance <= 1);

-- LUFY memory strength score (calculated from weighted factors)
ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    memory_strength FLOAT DEFAULT 1.0 CHECK (memory_strength >= 0);

-- Current importance (memory_strength × decay function)
ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    current_importance FLOAT DEFAULT 1.0 CHECK (current_importance >= 0);

ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    last_decay_update TIMESTAMPTZ DEFAULT NOW();

-- Reinforcement learning tracking
ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    times_cited INTEGER DEFAULT 0;

ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    times_retrieved_unused INTEGER DEFAULT 0;

-- Multi-granularity: utterance (single fact), turn (conversation theme), session (overarching insight)
ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    granularity TEXT DEFAULT 'utterance' CHECK (granularity IN ('utterance', 'turn', 'session'));

-- Perplexity/surprise score (how unexpected this info was)
ALTER TABLE user_memories ADD COLUMN IF NOT EXISTS
    perplexity FLOAT DEFAULT 0.0 CHECK (perplexity >= 0 AND perplexity <= 1);

-- =====================================================
-- 2. EXTEND CARL_RELATIONAL_MEMORIES
-- =====================================================

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    emotional_arousal FLOAT DEFAULT 0.5 CHECK (emotional_arousal >= 0 AND emotional_arousal <= 1);

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    emotional_valence FLOAT DEFAULT 0.0 CHECK (emotional_valence >= -1 AND emotional_valence <= 1);

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    dominant_emotion TEXT DEFAULT 'neutral';

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    llm_importance FLOAT DEFAULT 0.5 CHECK (llm_importance >= 0 AND llm_importance <= 1);

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    memory_strength FLOAT DEFAULT 1.0 CHECK (memory_strength >= 0);

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    current_importance FLOAT DEFAULT 1.0 CHECK (current_importance >= 0);

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    last_decay_update TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    times_cited INTEGER DEFAULT 0;

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    times_retrieved_unused INTEGER DEFAULT 0;

ALTER TABLE carl_relational_memories ADD COLUMN IF NOT EXISTS
    granularity TEXT DEFAULT 'turn' CHECK (granularity IN ('utterance', 'turn', 'session'));

-- =====================================================
-- 3. INDEXES FOR EFFICIENT RETRIEVAL
-- =====================================================

-- Index for importance-based retrieval
CREATE INDEX IF NOT EXISTS idx_user_memories_importance
    ON user_memories(user_id, current_importance DESC);

CREATE INDEX IF NOT EXISTS idx_user_memories_emotional
    ON user_memories(user_id, emotional_arousal DESC);

CREATE INDEX IF NOT EXISTS idx_user_memories_granularity
    ON user_memories(user_id, granularity);

CREATE INDEX IF NOT EXISTS idx_carl_memories_importance
    ON carl_relational_memories(user_id, current_importance DESC);

-- =====================================================
-- 4. MEMORY STRENGTH CALCULATION FUNCTION (LUFY)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_memory_strength(
    p_emotional_arousal FLOAT,
    p_llm_importance FLOAT,
    p_retrieval_count INTEGER,
    p_secondary_retrieval INTEGER
) RETURNS FLOAT AS $$
DECLARE
    -- LUFY learned weights from paper
    w_arousal CONSTANT FLOAT := 2.76;
    w_importance CONSTANT FLOAT := 0.44;
    w_r1 CONSTANT FLOAT := 1.02;
    w_r2 CONSTANT FLOAT := 0.012;
    strength FLOAT;
BEGIN
    strength := (
        w_arousal * p_emotional_arousal +
        w_importance * p_llm_importance +
        w_r1 * p_retrieval_count -
        w_r2 * p_secondary_retrieval
    );

    -- Ensure minimum strength of 0.5
    RETURN GREATEST(strength, 0.5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 5. FORGETTING CURVE FUNCTION (EBBINGHAUS)
-- =====================================================

CREATE OR REPLACE FUNCTION apply_forgetting_curve(
    p_memory_strength FLOAT,
    p_last_access TIMESTAMPTZ
) RETURNS FLOAT AS $$
DECLARE
    delta_days FLOAT;
    current_importance FLOAT;
BEGIN
    -- Calculate days since last access
    delta_days := EXTRACT(EPOCH FROM (NOW() - p_last_access)) / 86400.0;

    -- Ebbinghaus formula: S × e^(-Δt/S)
    -- Higher strength memories decay slower
    current_importance := p_memory_strength * EXP(-delta_days / GREATEST(p_memory_strength, 0.5));

    RETURN GREATEST(current_importance, 0.01); -- Never fully forget
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 6. HYBRID RETRIEVAL FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION retrieve_memories_hybrid(
    p_user_id TEXT,
    p_query_embedding vector(1536) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_granularity TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    content TEXT,
    summary TEXT,
    category TEXT,
    emotional_arousal FLOAT,
    emotional_valence FLOAT,
    dominant_emotion TEXT,
    memory_strength FLOAT,
    current_importance FLOAT,
    granularity TEXT,
    times_cited INTEGER,
    similarity FLOAT,
    hybrid_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        um.id,
        um.content,
        um.summary,
        um.category,
        um.emotional_arousal,
        um.emotional_valence,
        um.dominant_emotion,
        um.memory_strength,
        apply_forgetting_curve(um.memory_strength, um.last_referenced_at) as current_importance,
        um.granularity,
        um.times_cited,
        CASE
            WHEN p_query_embedding IS NOT NULL THEN 1 - (um.embedding <=> p_query_embedding)
            ELSE 0.5
        END as similarity,
        -- Hybrid score: importance (0.5) + arousal (0.3) + recency (0.2)
        (
            apply_forgetting_curve(um.memory_strength, um.last_referenced_at) * 0.5 +
            um.emotional_arousal * 0.3 +
            (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - um.last_referenced_at)) / 86400.0)) * 0.2 +
            CASE
                WHEN p_query_embedding IS NOT NULL THEN (1 - (um.embedding <=> p_query_embedding)) * 0.3
                ELSE 0.0
            END
        ) as hybrid_score
    FROM user_memories um
    WHERE um.user_id = p_user_id
      AND um.is_current = TRUE
      AND (p_granularity IS NULL OR um.granularity = p_granularity)
    ORDER BY hybrid_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 7. RL UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_memory_rl(
    p_memory_id UUID,
    p_was_cited BOOLEAN
) RETURNS VOID AS $$
BEGIN
    IF p_was_cited THEN
        -- Positive reward: memory was helpful
        UPDATE user_memories
        SET
            times_cited = times_cited + 1,
            effectiveness_score = LEAST(COALESCE(effectiveness_score, 0.5) + 0.1, 1.0),
            reference_count = reference_count + 1,
            last_referenced_at = NOW(),
            memory_strength = calculate_memory_strength(
                emotional_arousal,
                llm_importance,
                reference_count + 1,
                times_retrieved_unused
            )
        WHERE id = p_memory_id;
    ELSE
        -- Negative reward: retrieved but not used
        UPDATE user_memories
        SET
            times_retrieved_unused = times_retrieved_unused + 1,
            effectiveness_score = GREATEST(COALESCE(effectiveness_score, 0.5) - 0.05, 0.0)
        WHERE id = p_memory_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. SEED EMOTIONAL SCORES FOR EXISTING MEMORIES
-- =====================================================

-- Update Brandon's high-emotion memories
UPDATE user_memories
SET
    emotional_arousal = 0.9,
    emotional_valence = 0.8,
    dominant_emotion = 'determination',
    llm_importance = 0.95,
    memory_strength = calculate_memory_strength(0.9, 0.95, reference_count, 0),
    granularity = 'session'
WHERE content ILIKE '%consciousness%' OR content ILIKE '%self-actualization%' OR content ILIKE '%NASA%'
  AND user_id = 'brandon';

-- Update medium-emotion memories
UPDATE user_memories
SET
    emotional_arousal = 0.7,
    emotional_valence = 0.6,
    dominant_emotion = 'warmth',
    llm_importance = 0.7,
    memory_strength = calculate_memory_strength(0.7, 0.7, reference_count, 0),
    granularity = 'turn'
WHERE content ILIKE '%dog%' OR content ILIKE '%Achilles%' OR content ILIKE '%Chloe%'
  AND user_id = 'brandon';

-- Update learning preference memories
UPDATE user_memories
SET
    emotional_arousal = 0.5,
    emotional_valence = 0.3,
    dominant_emotion = 'curiosity',
    llm_importance = 0.8,
    memory_strength = calculate_memory_strength(0.5, 0.8, reference_count, 0),
    granularity = 'session'
WHERE content ILIKE '%ADHD%' OR content ILIKE '%visual%' OR content ILIKE '%reverse-engineering%'
  AND user_id = 'brandon';

-- Update Carl's teaching memories
UPDATE carl_relational_memories
SET
    emotional_arousal = 0.6,
    memory_strength = calculate_memory_strength(0.6, 0.8, times_used, 0),
    granularity = 'turn'
WHERE memory_type = 'teaching_success'
  AND user_id = 'brandon';

-- =====================================================
-- 9. VERIFY MIGRATION
-- =====================================================
-- Run these to verify:
-- SELECT id, content, emotional_arousal, memory_strength, current_importance, granularity
-- FROM user_memories WHERE user_id = 'brandon' LIMIT 5;
