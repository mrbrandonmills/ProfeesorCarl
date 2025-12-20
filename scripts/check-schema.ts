import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { query } from '../lib/db/postgres'

async function main() {
  const rows = await query<{column_name: string, data_type: string}>(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_memories'
    ORDER BY ordinal_position
  `)
  console.log('user_memories columns:')
  rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))
  process.exit(0)
}

main().catch(console.error)
