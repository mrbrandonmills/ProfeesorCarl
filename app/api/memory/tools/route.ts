/**
 * MEMORY TOOLS API - Autonomous Memory Management for Claude
 *
 * Based on 2026 research: "The LLM itself will have Memory Tools (Write, Delete, Update)
 * and will be trained via RL to manage its own mind."
 *
 * This endpoint allows Claude to:
 * - save_memory: Store a new memory about the student
 * - update_memory: Update an existing memory with new information
 * - forget_memory: Mark a memory for deletion
 * - link_memories: Create relationships between memories
 *
 * The AI decides what to remember, not hardcoded extraction rules.
 */

import { NextRequest, NextResponse } from 'next/server'
import { execute, query, queryOne } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { calculateMemoryStrength } from '@/lib/memory/hume-emotions'

// Allowed tools
type MemoryTool = 'save_memory' | 'update_memory' | 'forget_memory' | 'link_memories'

interface SaveMemoryParams {
  content: string
  category: string
  importance: number // 0.0-1.0
  emotionalContext?: string
  tags?: string[]
}

interface UpdateMemoryParams {
  memoryId: string
  newContent?: string
  adjustImportance?: number // delta, can be negative
  addTags?: string[]
}

interface ForgetMemoryParams {
  memoryId: string
  reason: string
}

interface LinkMemoriesParams {
  memoryId1: string
  memoryId2: string
  relationship: string // e.g., "related_to", "contradicts", "expands_on"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tool, params, userId, sessionId } = body

    if (!tool || !params || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, params, userId' },
        { status: 400 }
      )
    }

    // Log the tool call for RL training later
    console.log(`[Memory Tools] Claude called ${tool} for user ${userId}`)

    switch (tool as MemoryTool) {
      case 'save_memory':
        return handleSaveMemory(params as SaveMemoryParams, userId, sessionId)

      case 'update_memory':
        return handleUpdateMemory(params as UpdateMemoryParams, userId)

      case 'forget_memory':
        return handleForgetMemory(params as ForgetMemoryParams, userId)

      case 'link_memories':
        return handleLinkMemories(params as LinkMemoriesParams, userId)

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Memory Tools] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Save a new memory
 */
async function handleSaveMemory(
  params: SaveMemoryParams,
  userId: string,
  sessionId?: string
): Promise<NextResponse> {
  try {
    const { content, category, importance, emotionalContext, tags } = params

    // Validate importance
    const validImportance = Math.max(0, Math.min(1, importance))

    // Generate embedding
    const embedding = await generateEmbedding(content)
    const embeddingStr = `[${embedding.join(',')}]`

    // Calculate memory strength
    const memoryStrength = calculateMemoryStrength({
      timesCited: 0,
      humeArousal: 0.5,
      textArousal: 0.5,
      llmImportance: validImportance,
      timesRetrievedUnused: 0,
    })

    // Insert the memory
    const result = await query(`
      INSERT INTO user_memories
      (user_id, content, summary, category, embedding, source_session_id, source_type,
       llm_importance, memory_strength, current_importance, confidence)
      VALUES ($1, $2, $3, $4, $5::vector, $6, 'claude_autonomous',
              $7, $8, $8, 0.9)
      RETURNING id
    `, [
      userId,
      content,
      content.slice(0, 200), // Summary is first 200 chars
      category,
      embeddingStr,
      sessionId,
      validImportance,
      memoryStrength,
    ])

    const memoryId = result[0]?.id

    console.log(`[Memory Tools] Claude saved memory ${memoryId}: "${content.slice(0, 50)}..."`)

    return NextResponse.json({
      success: true,
      memoryId,
      message: `Memory saved successfully with importance ${validImportance}`,
    })
  } catch (error) {
    console.error('[Memory Tools] Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save memory', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Update an existing memory
 */
async function handleUpdateMemory(
  params: UpdateMemoryParams,
  userId: string
): Promise<NextResponse> {
  try {
    const { memoryId, newContent, adjustImportance, addTags } = params

    // Verify the memory belongs to this user
    const existing = await queryOne(
      'SELECT id, llm_importance FROM user_memories WHERE id = $1 AND user_id = $2',
      [memoryId, userId]
    )

    if (!existing) {
      return NextResponse.json(
        { error: 'Memory not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (newContent) {
      const embedding = await generateEmbedding(newContent)
      updates.push(`content = $${paramIndex++}`)
      values.push(newContent)
      updates.push(`embedding = $${paramIndex++}::vector`)
      values.push(`[${embedding.join(',')}]`)
      updates.push(`summary = $${paramIndex++}`)
      values.push(newContent.slice(0, 200))
    }

    if (adjustImportance !== undefined) {
      const newImportance = Math.max(0, Math.min(1,
        (existing.llm_importance || 0.5) + adjustImportance
      ))
      updates.push(`llm_importance = $${paramIndex++}`)
      values.push(newImportance)
      updates.push(`current_importance = $${paramIndex++}`)
      values.push(newImportance)
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No updates specified',
      })
    }

    // Add the memory ID and user ID for the WHERE clause
    values.push(memoryId)
    values.push(userId)

    await execute(`
      UPDATE user_memories
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
    `, values)

    console.log(`[Memory Tools] Claude updated memory ${memoryId}`)

    return NextResponse.json({
      success: true,
      message: 'Memory updated successfully',
    })
  } catch (error) {
    console.error('[Memory Tools] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update memory', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Forget (soft delete) a memory
 */
async function handleForgetMemory(
  params: ForgetMemoryParams,
  userId: string
): Promise<NextResponse> {
  try {
    const { memoryId, reason } = params

    // Verify ownership
    const existing = await queryOne(
      'SELECT id FROM user_memories WHERE id = $1 AND user_id = $2',
      [memoryId, userId]
    )

    if (!existing) {
      return NextResponse.json(
        { error: 'Memory not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Soft delete by setting current_importance to 0 and adding deletion reason
    // This preserves the memory for audit but removes it from retrieval
    await execute(`
      UPDATE user_memories
      SET current_importance = 0,
          memory_strength = 0,
          updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `, [memoryId, userId])

    console.log(`[Memory Tools] Claude forgot memory ${memoryId}: ${reason}`)

    return NextResponse.json({
      success: true,
      message: `Memory forgotten: ${reason}`,
    })
  } catch (error) {
    console.error('[Memory Tools] Forget error:', error)
    return NextResponse.json(
      { error: 'Failed to forget memory', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Link two memories together
 */
async function handleLinkMemories(
  params: LinkMemoriesParams,
  userId: string
): Promise<NextResponse> {
  try {
    const { memoryId1, memoryId2, relationship } = params

    // Verify both memories belong to user
    const memory1 = await queryOne(
      'SELECT id FROM user_memories WHERE id = $1 AND user_id = $2',
      [memoryId1, userId]
    )
    const memory2 = await queryOne(
      'SELECT id FROM user_memories WHERE id = $1 AND user_id = $2',
      [memoryId2, userId]
    )

    if (!memory1 || !memory2) {
      return NextResponse.json(
        { error: 'One or both memories not found or do not belong to user' },
        { status: 404 }
      )
    }

    // For now, we store the link in carl_relational_memories
    // In a production system, we'd have a dedicated memory_links table
    await execute(`
      INSERT INTO carl_relational_memories
      (user_id, content, summary, memory_type, effectiveness_score, memory_strength, current_importance)
      VALUES ($1, $2, $3, 'memory_link', 0.7, 0.7, 0.7)
      ON CONFLICT DO NOTHING
    `, [
      userId,
      `Link: ${relationship} between memories ${memoryId1} and ${memoryId2}`,
      relationship,
    ])

    console.log(`[Memory Tools] Claude linked memories: ${memoryId1} ${relationship} ${memoryId2}`)

    return NextResponse.json({
      success: true,
      message: `Memories linked with relationship: ${relationship}`,
    })
  } catch (error) {
    console.error('[Memory Tools] Link error:', error)
    return NextResponse.json(
      { error: 'Failed to link memories', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET - List available memory tools (for documentation)
 */
export async function GET() {
  return NextResponse.json({
    name: 'Memory Tools API',
    description: 'Autonomous memory management for Claude',
    version: '1.0.0',
    tools: [
      {
        name: 'save_memory',
        description: 'Save a new memory about the student',
        params: {
          content: 'string - The memory content',
          category: 'string - Category (personal_fact, learning_preference, breakthrough, etc.)',
          importance: 'number - 0.0-1.0 importance score',
          emotionalContext: 'string (optional) - Emotional context',
          tags: 'string[] (optional) - Tags for categorization',
        },
      },
      {
        name: 'update_memory',
        description: 'Update an existing memory',
        params: {
          memoryId: 'string - The memory ID to update',
          newContent: 'string (optional) - New content',
          adjustImportance: 'number (optional) - Adjustment to importance (-1.0 to 1.0)',
          addTags: 'string[] (optional) - Tags to add',
        },
      },
      {
        name: 'forget_memory',
        description: 'Forget (soft delete) a memory',
        params: {
          memoryId: 'string - The memory ID to forget',
          reason: 'string - Reason for forgetting',
        },
      },
      {
        name: 'link_memories',
        description: 'Create a relationship between two memories',
        params: {
          memoryId1: 'string - First memory ID',
          memoryId2: 'string - Second memory ID',
          relationship: 'string - Type of relationship (related_to, contradicts, expands_on, etc.)',
        },
      },
    ],
    usage: {
      method: 'POST',
      body: {
        tool: 'save_memory | update_memory | forget_memory | link_memories',
        params: '{ ... tool-specific params }',
        userId: 'string - User ID',
        sessionId: 'string (optional) - Current session ID',
      },
    },
  })
}
