import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

interface StudentContext {
  topics_explored: string[]
  current_understanding: string
  learning_progress: string
  conversation_summary: string
}

let client: Client | null = null

/**
 * Get or create MCP Memory client singleton
 */
async function getMemoryClient(): Promise<Client> {
  if (client) {
    return client
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
  })

  client = new Client(
    {
      name: 'professor-carl-memory',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  )

  await client.connect(transport)
  return client
}

/**
 * Save student context to MCP Memory
 */
export async function saveStudentContext(
  studentId: string,
  context: StudentContext
): Promise<void> {
  try {
    const memoryClient = await getMemoryClient()

    // Create entity for student context
    await memoryClient.request(
      {
        method: 'tools/call',
        params: {
          name: 'create_entities',
          arguments: {
            entities: [
              {
                name: `student_${studentId}`,
                entityType: 'student_context',
                observations: [
                  `Topics explored: ${context.topics_explored.join(', ')}`,
                  `Current understanding: ${context.current_understanding}`,
                  `Learning progress: ${context.learning_progress}`,
                  `Conversation summary: ${context.conversation_summary}`,
                ],
              },
            ],
          },
        },
      },
      {}
    )
  } catch (error) {
    console.error('Error saving student context to MCP Memory:', error)
    throw error
  }
}

/**
 * Retrieve student context from MCP Memory
 */
export async function retrieveStudentContext(
  studentId: string
): Promise<StudentContext | null> {
  try {
    const memoryClient = await getMemoryClient()

    // Search for student entity
    const response = await memoryClient.request(
      {
        method: 'tools/call',
        params: {
          name: 'search_nodes',
          arguments: {
            query: `student_${studentId}`,
          },
        },
      },
      {}
    )

    // Parse response
    if (!response || typeof response !== 'object' || !('content' in response)) {
      return null
    }

    const content = response.content as Array<{
      type: string
      text?: string
    }>

    if (!Array.isArray(content) || content.length === 0) {
      return null
    }

    // Find the text content
    const textContent = content.find((item) => item.type === 'text' && item.text)
    if (!textContent || !textContent.text) {
      return null
    }

    // Parse the observations from the response
    const observations = textContent.text
      .split('\n')
      .filter((line) => line.includes(':'))
      .map((line) => line.split(':').slice(1).join(':').trim())

    if (observations.length < 4) {
      return null
    }

    // Extract context from observations
    const topicsLine = observations.find((obs) => obs.includes('Topics explored:'))
    const understandingLine = observations.find((obs) =>
      obs.includes('Current understanding:')
    )
    const progressLine = observations.find((obs) => obs.includes('Learning progress:'))
    const summaryLine = observations.find((obs) =>
      obs.includes('Conversation summary:')
    )

    const context: StudentContext = {
      topics_explored: topicsLine
        ? topicsLine.replace('Topics explored:', '').split(',').map((t) => t.trim())
        : [],
      current_understanding: understandingLine
        ? understandingLine.replace('Current understanding:', '').trim()
        : '',
      learning_progress: progressLine
        ? progressLine.replace('Learning progress:', '').trim()
        : '',
      conversation_summary: summaryLine
        ? summaryLine.replace('Conversation summary:', '').trim()
        : '',
    }

    return context
  } catch (error) {
    console.error('Error retrieving student context from MCP Memory:', error)
    return null
  }
}
