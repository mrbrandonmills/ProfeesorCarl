// ===========================================
// POSTGRES CLIENT WITH PGVECTOR SUPPORT
// ===========================================
// Direct Postgres connection for memory system

import { Pool, PoolClient } from 'pg'

// Create connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('POSTGRES_DATABASE_URL or DATABASE_URL environment variable is required')
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}

// Type-safe query helper
export async function query<T = any>(
  queryText: string,
  params?: any[]
): Promise<T[]> {
  const client = await getPool().connect()
  try {
    const result = await client.query(queryText, params)
    return result.rows as T[]
  } catch (error) {
    console.error('[DB] Query error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Single row query helper
export async function queryOne<T = any>(
  queryText: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(queryText, params)
  return results[0] || null
}

// Execute without returning results (for INSERT/UPDATE/DELETE)
export async function execute(
  queryText: string,
  params?: any[]
): Promise<number> {
  const client = await getPool().connect()
  try {
    const result = await client.query(queryText, params)
    return result.rowCount || 0
  } catch (error) {
    console.error('[DB] Execute error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Vector similarity search helper
export async function vectorSearch<T = any>(
  table: string,
  embedding: number[],
  options: {
    limit?: number
    where?: string
    selectFields?: string
    minSimilarity?: number
  } = {}
): Promise<(T & { similarity: number })[]> {
  const {
    limit = 10,
    where = '',
    selectFields = '*',
    minSimilarity = 0
  } = options

  const whereClause = where ? `AND ${where}` : ''

  // Format embedding as PostgreSQL array string
  const embeddingStr = `[${embedding.join(',')}]`

  const queryText = `
    SELECT ${selectFields},
           1 - (embedding <=> $1::vector) as similarity
    FROM ${table}
    WHERE 1=1 ${whereClause}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `

  const results = await query<T & { similarity: number }>(queryText, [embeddingStr, limit])

  // Filter by minimum similarity if specified
  if (minSimilarity > 0) {
    return results.filter(r => r.similarity >= minSimilarity)
  }

  return results
}

// Check if pgvector extension is enabled
export async function checkPgvector(): Promise<boolean> {
  try {
    const result = await queryOne<{ enabled: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as enabled
    `)
    return result?.enabled === true
  } catch {
    return false
  }
}

// Enable pgvector extension
export async function enablePgvector(): Promise<void> {
  await execute('CREATE EXTENSION IF NOT EXISTS vector')
  console.log('[DB] pgvector extension enabled')
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Close pool (for cleanup)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
