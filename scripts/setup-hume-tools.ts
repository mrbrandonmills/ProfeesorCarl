// ===========================================
// HUME TOOLS SETUP SCRIPT
// ===========================================
// Run this once to create memory tools in Hume
// Usage: npx tsx scripts/setup-hume-tools.ts

import { HumeClient } from 'hume'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const HUME_API_KEY = process.env.HUME_API_KEY
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136' // Professor Carl config

if (!HUME_API_KEY || !HUME_SECRET_KEY) {
  console.error('HUME_API_KEY and HUME_SECRET_KEY required')
  process.exit(1)
}

const client = new HumeClient({
  apiKey: HUME_API_KEY,
  secretKey: HUME_SECRET_KEY,
})

// Tool definitions
const RETRIEVE_MEMORY_TOOL = {
  name: 'retrieve_memory',
  versionDescription: 'Retrieves relevant memories about Brandon or Carl\'s relationship',
  description: `Use this tool when you need to recall information about Brandon, your shared history, or approaches that have worked before. Call this:
- When Brandon references past conversations
- When discussing topics he's mentioned before
- When you want to personalize your response based on his preferences
- When you need context about his life, goals, or struggles`,
  parameters: JSON.stringify({
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query for what to remember. Examples: "What does Brandon do for work?", "What teaching approaches work best?", "Have we discussed this topic before?"'
      },
      types: {
        type: 'string',
        description: 'Filter: "brandon" for facts about him, "carl" for relationship memories, "all" for both. Default: all'
      },
      limit: {
        type: 'number',
        description: 'Max memories to retrieve. Default: 5'
      }
    }
  }),
  fallbackContent: 'I couldn\'t retrieve my memories right now, but let\'s continue our conversation.',
}

const SAVE_INSIGHT_TOOL = {
  name: 'save_insight',
  versionDescription: 'Saves important insights from the current conversation',
  description: `Use this tool when Brandon shares something important that you should remember for future conversations:
- Important facts about his life
- His preferences or learning style
- When a teaching approach works particularly well
- Breakthrough moments or insights
- Inside jokes or shared references that develop
Only save MEANINGFUL information that will help future conversations.`,
  parameters: JSON.stringify({
    type: 'object',
    required: ['content', 'insight_type'],
    properties: {
      content: {
        type: 'string',
        description: 'The insight to save. Be specific and include context.'
      },
      insight_type: {
        type: 'string',
        enum: [
          'brandon_fact',
          'brandon_preference',
          'brandon_goal',
          'brandon_struggle',
          'teaching_success',
          'breakthrough_moment',
          'inside_joke',
          'relationship_insight'
        ],
        description: 'Type of insight being saved'
      },
      importance: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'How important for future conversations. Default: medium'
      }
    }
  }),
  fallbackContent: 'I\'ll remember that for our future conversations.',
}

const GET_CONTEXT_TOOL = {
  name: 'get_conversation_context',
  versionDescription: 'Loads context at conversation start or topic change',
  description: `Call this at the beginning of a conversation or when shifting to a new topic. Returns:
- Brandon's relevant facts and preferences
- Your successful teaching approaches
- Shared references and inside jokes
- Last session summary`,
  parameters: JSON.stringify({
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic you\'re about to discuss, if known'
      },
      depth: {
        type: 'string',
        enum: ['minimal', 'standard', 'comprehensive'],
        description: 'How much context to load. Default: standard'
      }
    }
  }),
  fallbackContent: 'Let me recall what I know about you...',
}

async function setupTools() {
  console.log('Creating Hume tools for Professor Carl memory system...\n')

  const toolIds: string[] = []

  try {
    // Create retrieve_memory tool
    console.log('Creating retrieve_memory tool...')
    const retrieveTool = await client.empathicVoice.tools.createTool({
      name: RETRIEVE_MEMORY_TOOL.name,
      versionDescription: RETRIEVE_MEMORY_TOOL.versionDescription,
      description: RETRIEVE_MEMORY_TOOL.description,
      parameters: RETRIEVE_MEMORY_TOOL.parameters,
      fallbackContent: RETRIEVE_MEMORY_TOOL.fallbackContent,
    })
    console.log('  Created:', retrieveTool.id)
    toolIds.push(retrieveTool.id)
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('  retrieve_memory already exists, fetching...')
      const tools = await client.empathicVoice.tools.listTools()
      const existing = tools.toolsPage?.find((t: any) => t.name === 'retrieve_memory')
      if (existing) toolIds.push(existing.id)
    } else {
      console.error('  Error:', error.message)
    }
  }

  try {
    // Create save_insight tool
    console.log('Creating save_insight tool...')
    const saveTool = await client.empathicVoice.tools.createTool({
      name: SAVE_INSIGHT_TOOL.name,
      versionDescription: SAVE_INSIGHT_TOOL.versionDescription,
      description: SAVE_INSIGHT_TOOL.description,
      parameters: SAVE_INSIGHT_TOOL.parameters,
      fallbackContent: SAVE_INSIGHT_TOOL.fallbackContent,
    })
    console.log('  Created:', saveTool.id)
    toolIds.push(saveTool.id)
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('  save_insight already exists, fetching...')
      const tools = await client.empathicVoice.tools.listTools()
      const existing = tools.toolsPage?.find((t: any) => t.name === 'save_insight')
      if (existing) toolIds.push(existing.id)
    } else {
      console.error('  Error:', error.message)
    }
  }

  try {
    // Create get_conversation_context tool
    console.log('Creating get_conversation_context tool...')
    const contextTool = await client.empathicVoice.tools.createTool({
      name: GET_CONTEXT_TOOL.name,
      versionDescription: GET_CONTEXT_TOOL.versionDescription,
      description: GET_CONTEXT_TOOL.description,
      parameters: GET_CONTEXT_TOOL.parameters,
      fallbackContent: GET_CONTEXT_TOOL.fallbackContent,
    })
    console.log('  Created:', contextTool.id)
    toolIds.push(contextTool.id)
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('  get_conversation_context already exists, fetching...')
      const tools = await client.empathicVoice.tools.listTools()
      const existing = tools.toolsPage?.find((t: any) => t.name === 'get_conversation_context')
      if (existing) toolIds.push(existing.id)
    } else {
      console.error('  Error:', error.message)
    }
  }

  if (toolIds.length === 0) {
    console.log('\nNo tools created or found. Check errors above.')
    return
  }

  // Get current config
  console.log('\nFetching current config...')
  const config = await client.empathicVoice.configs.getConfigVersion(CONFIG_ID, 1)
  console.log('  Current config:', config.name)

  // Note: Updating config with tools may require creating a new version
  // For now, just display the tool IDs
  console.log('\n=== SETUP COMPLETE ===')
  console.log('\nTool IDs created:')
  toolIds.forEach(id => console.log('  -', id))
  console.log('\nTo add these tools to your config, update it in the Hume dashboard or via API.')
  console.log('Config ID:', CONFIG_ID)

  // List all tools
  console.log('\nAll tools in your account:')
  const allTools = await client.empathicVoice.tools.listTools()
  allTools.toolsPage?.forEach((tool: any) => {
    console.log(`  - ${tool.name} (${tool.id})`)
  })
}

setupTools().catch(console.error)
