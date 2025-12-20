import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { execute, query } from '../lib/db/postgres'

async function main() {
  console.log('=== CLEANING UP TEST MEMORIES ===\n')

  // Count before cleanup
  const beforeUser = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM user_memories
    WHERE user_id = 'brandon' AND source_session_id::text LIKE '11111111%'
  `)
  const beforeCarl = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM carl_relational_memories
    WHERE user_id = 'brandon' AND source_session_id::text LIKE '11111111%'
  `)

  console.log(`Found ${beforeUser[0].count} test user memories to delete`)
  console.log(`Found ${beforeCarl[0].count} test Carl memories to delete`)

  // Delete test memories
  const deletedUser = await execute(`
    DELETE FROM user_memories
    WHERE user_id = 'brandon'
    AND source_session_id::text LIKE '11111111%'
  `)
  console.log(`\nDeleted ${deletedUser} user memories`)

  const deletedCarl = await execute(`
    DELETE FROM carl_relational_memories
    WHERE user_id = 'brandon'
    AND source_session_id::text LIKE '11111111%'
  `)
  console.log(`Deleted ${deletedCarl} Carl memories`)

  // Count after cleanup
  const afterUser = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM user_memories WHERE user_id = 'brandon'
  `)
  const afterCarl = await query<{count: string}>(`
    SELECT COUNT(*) as count FROM carl_relational_memories WHERE user_id = 'brandon'
  `)

  console.log(`\n=== REMAINING MEMORIES ===`)
  console.log(`Brandon user memories: ${afterUser[0].count}`)
  console.log(`Brandon Carl memories: ${afterCarl[0].count}`)

  console.log('\n✓ Test data cleaned. Original Brandon memories preserved.')
  process.exit(0)
}

main().catch(console.error)
