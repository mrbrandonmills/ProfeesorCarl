// ===========================================
// DATABASE SETUP FOR MEMORY SYSTEM
// ===========================================
// Run this once to create all memory tables

import { NextRequest, NextResponse } from 'next/server'
import { query, execute, checkPgvector, enablePgvector } from '@/lib/db/postgres'

export async function POST(request: NextRequest) {
  try {
    console.log('[Memory Setup] Starting database setup...')

    // Check if pgvector is enabled
    const hasPgvector = await checkPgvector()
    if (!hasPgvector) {
      console.log('[Memory Setup] Enabling pgvector extension...')
      await enablePgvector()
    }

    // Create tables
    console.log('[Memory Setup] Creating memory tables...')

    // Brandon memories table
    await execute(`
      CREATE TABLE IF NOT EXISTS brandon_memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        summary TEXT,
        category TEXT NOT NULL,
        embedding vector(1536),
        confidence FLOAT DEFAULT 1.0,
        source_type TEXT DEFAULT 'conversation',
        source_session_id UUID,
        first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
        last_referenced_at TIMESTAMPTZ DEFAULT NOW(),
        reference_count INTEGER DEFAULT 1,
        supersedes_id UUID,
        is_current BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Carl relational memories table
    await execute(`
      CREATE TABLE IF NOT EXISTS carl_relational_memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        summary TEXT,
        memory_type TEXT NOT NULL,
        embedding vector(1536),
        emotional_context JSONB,
        topic_context TEXT[],
        effectiveness_score FLOAT,
        times_used INTEGER DEFAULT 1,
        success_rate FLOAT,
        occurred_at TIMESTAMPTZ DEFAULT NOW(),
        source_session_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Conversation transcripts table
    await execute(`
      CREATE TABLE IF NOT EXISTS conversation_transcripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        emotions JSONB,
        dominant_emotion TEXT,
        emotion_intensity FLOAT,
        embedding vector(1536),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        linked_brandon_memories UUID[],
        linked_carl_memories UUID[]
      )
    `)

    // Voice sessions table
    await execute(`
      CREATE TABLE IF NOT EXISTS voice_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL DEFAULT 'brandon',
        session_number SERIAL,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        duration_seconds INTEGER,
        average_engagement FLOAT,
        average_confidence FLOAT,
        breakthrough_count INTEGER DEFAULT 0,
        confusion_moments INTEGER DEFAULT 0,
        topics_explored TEXT[],
        main_topic TEXT,
        overall_quality_score FLOAT,
        session_report JSONB,
        memories_extracted BOOLEAN DEFAULT FALSE,
        extraction_job_id UUID
      )
    `)

    // Memory extraction jobs table
    await execute(`
      CREATE TABLE IF NOT EXISTS memory_extraction_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        status TEXT DEFAULT 'pending',
        extraction_type TEXT DEFAULT 'post_session',
        brandon_memories_extracted INTEGER DEFAULT 0,
        carl_memories_extracted INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `)

    // Create indexes
    console.log('[Memory Setup] Creating indexes...')

    // Vector indexes (may fail if already exist, that's OK)
    try {
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_brandon_memories_embedding
        ON brandon_memories USING hnsw (embedding vector_cosine_ops)
      `)
    } catch (e) {
      console.log('[Memory Setup] Brandon embedding index may already exist')
    }

    try {
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_carl_memories_embedding
        ON carl_relational_memories USING hnsw (embedding vector_cosine_ops)
      `)
    } catch (e) {
      console.log('[Memory Setup] Carl embedding index may already exist')
    }

    try {
      await execute(`
        CREATE INDEX IF NOT EXISTS idx_transcripts_embedding
        ON conversation_transcripts USING hnsw (embedding vector_cosine_ops)
      `)
    } catch (e) {
      console.log('[Memory Setup] Transcripts embedding index may already exist')
    }

    // Standard indexes
    await execute(`CREATE INDEX IF NOT EXISTS idx_brandon_memories_category ON brandon_memories(category)`)
    await execute(`CREATE INDEX IF NOT EXISTS idx_brandon_memories_current ON brandon_memories(is_current)`)
    await execute(`CREATE INDEX IF NOT EXISTS idx_carl_memories_type ON carl_relational_memories(memory_type)`)
    await execute(`CREATE INDEX IF NOT EXISTS idx_transcripts_session ON conversation_transcripts(session_id)`)
    await execute(`CREATE INDEX IF NOT EXISTS idx_voice_sessions_started ON voice_sessions(started_at)`)

    // Insert seed data
    console.log('[Memory Setup] Inserting seed memories...')

    // Check if seed data already exists
    const existingMemories = await query('SELECT COUNT(*) as count FROM brandon_memories')
    if (existingMemories[0]?.count === '0' || existingMemories[0]?.count === 0) {
      // Insert Brandon's foundational memories
      await execute(`
        INSERT INTO brandon_memories (content, summary, category, confidence, source_type) VALUES
        ('Brandon Mills is neurodivergent with ADHD, which influences his learning style. He benefits from dialogue, visual aids, and analogies rather than linear text.',
         'Brandon has ADHD and learns best through dialogue and visuals',
         'personal_fact', 1.0, 'manual'),
        ('Brandon is a reverse-engineering learner who prefers to understand the big picture first, then work backwards to understand the components.',
         'Brandon learns by reverse-engineering - big picture first',
         'preference', 1.0, 'manual'),
        ('Brandon has two dogs named Achilles and Chloe who have been important sources of grounding and emotional support.',
         'Brandon has two dogs: Achilles and Chloe (emotional support)',
         'relationship', 1.0, 'manual'),
        ('Brandon works on an air-taxi navigation project with NASA in Virginia.',
         'Brandon works with NASA on air-taxi project in Virginia',
         'experience', 1.0, 'manual'),
        ('Brandon is a cognitive science researcher exploring consciousness, self-actualization, and AI-mediated learning.',
         'Brandon researches consciousness and AI-mediated learning',
         'goal', 1.0, 'manual'),
        ('Brandon is preparing for a UCSD faculty demo to showcase Professor Carl.',
         'Brandon is preparing UCSD demo for Professor Carl',
         'goal', 1.0, 'manual')
      `)

      // Insert Carl's foundational relational memories
      await execute(`
        INSERT INTO carl_relational_memories (content, summary, memory_type, effectiveness_score) VALUES
        ('Brandon responds exceptionally well to analogies and metaphors. Using real-world parallels dramatically increases his understanding.',
         'Analogies and metaphors work extremely well with Brandon',
         'teaching_success', 0.9),
        ('Brandon values being treated as an intellectual equal rather than talked down to. He values being challenged.',
         'Brandon values being treated as an intellectual equal',
         'interaction_pattern', 0.85),
        ('When Brandon shows confusion, the best approach is to ask what specifically is unclear rather than adding more information.',
         'When confused, ask what is unclear rather than add info',
         'teaching_success', 0.8),
        ('I am named after Carl Reiner, reflecting the importance of humor in my personality. Brandon appreciates dry British humor.',
         'I am named after Carl Reiner - humor is important',
         'relationship_insight', 1.0)
      `)
    }

    // Verify setup
    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('brandon_memories', 'carl_relational_memories', 'conversation_transcripts', 'voice_sessions')
    `)

    console.log('[Memory Setup] Setup complete!')

    return NextResponse.json({
      success: true,
      message: 'Memory system database setup complete',
      tables: tables.map(t => t.table_name),
      pgvectorEnabled: true,
    })

  } catch (error) {
    console.error('[Memory Setup] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during setup',
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check current status
    const hasPgvector = await checkPgvector()

    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('brandon_memories', 'carl_relational_memories', 'conversation_transcripts', 'voice_sessions')
    `)

    const brandonCount = await query('SELECT COUNT(*) as count FROM brandon_memories')
    const carlCount = await query('SELECT COUNT(*) as count FROM carl_relational_memories')

    return NextResponse.json({
      pgvectorEnabled: hasPgvector,
      tables: tables.map(t => t.table_name),
      memoryCounts: {
        brandon: parseInt(brandonCount[0]?.count || '0'),
        carl: parseInt(carlCount[0]?.count || '0'),
      },
      ready: hasPgvector && tables.length >= 4,
    })
  } catch (error) {
    return NextResponse.json({
      pgvectorEnabled: false,
      tables: [],
      memoryCounts: { brandon: 0, carl: 0 },
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
