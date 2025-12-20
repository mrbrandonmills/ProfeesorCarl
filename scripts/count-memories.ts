import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { query } from '../lib/db/postgres'

async function main() {
  // Count total memories
  const userMemories = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM user_memories WHERE user_id = 'brandon'
  `)
  const carlMemories = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM carl_relational_memories WHERE user_id = 'brandon'
  `)

  console.log(`\n=== MEMORY COUNTS FOR BRANDON ===`)
  console.log(`User memories: ${userMemories[0].count}`)
  console.log(`Carl memories: ${carlMemories[0].count}`)

  // Count test memories (by session ID pattern)
  const testUserMemories = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM user_memories
    WHERE user_id = 'brandon'
    AND source_session_id::text LIKE '11111111%'
  `)
  const testCarlMemories = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM carl_relational_memories
    WHERE user_id = 'brandon'
    AND source_session_id::text LIKE '11111111%'
  `)

  console.log(`\n=== TEST MEMORIES (session_id 11111111-*) ===`)
  console.log(`Test user memories: ${testUserMemories[0].count}`)
  console.log(`Test Carl memories: ${testCarlMemories[0].count}`)

  // Sample a few Italy-related memories
  const italyMemories = await query<{summary: string, content: string}>(`
    SELECT summary, content FROM user_memories
    WHERE user_id = 'brandon'
    AND (content ILIKE '%italy%' OR content ILIKE '%florence%' OR content ILIKE '%rome%' OR content ILIKE '%italian%')
    LIMIT 5
  `)

  console.log(`\n=== ITALY-RELATED MEMORIES ===`)
  italyMemories.forEach((m, i) => {
    console.log(`${i+1}. ${m.summary || m.content.substring(0, 80)}`)
  })

  process.exit(0)
}

main().catch(console.error)
