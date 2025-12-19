// ===========================================
// EMBEDDING GENERATION FOR MEMORY SYSTEM
// ===========================================
// Uses OpenAI text-embedding-3-small for semantic search

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text')
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
      dimensions: EMBEDDING_DIMENSIONS,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * More efficient for processing many items at once
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  // Filter out empty texts
  const validTexts = texts.map(t => t?.trim()).filter(t => t && t.length > 0)

  if (validTexts.length === 0) {
    return []
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts,
      dimensions: EMBEDDING_DIMENSIONS,
    })

    return response.data.map(d => d.embedding)
  } catch (error) {
    console.error('[Embeddings] Error generating batch embeddings:', error)
    throw error
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Format embedding as PostgreSQL vector string
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * Parse PostgreSQL vector string to number array
 */
export function parsePostgresEmbedding(vectorStr: string): number[] {
  // Remove brackets and split by comma
  const cleaned = vectorStr.replace(/[\[\]]/g, '')
  return cleaned.split(',').map(Number)
}

// Export constants
export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS }
