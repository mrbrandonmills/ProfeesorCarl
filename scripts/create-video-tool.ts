// ===========================================
// CREATE SEARCH_VIDEOS TOOL IN HUME
// ===========================================
// Adds YouTube video search capability to Professor Carl
// Run: npx tsx scripts/create-video-tool.ts

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const HUME_API_KEY = process.env.HUME_API_KEY

async function createVideoTool() {
  console.log('Creating search_videos tool in Hume...\n')

  const toolDefinition = {
    name: 'search_videos',
    description: 'Search for educational YouTube videos on a topic. Use this when Brandon asks about a topic and would benefit from visual learning, or when he explicitly asks for video recommendations. Returns video titles and YouTube URLs that Brandon can watch.',
    parameters: JSON.stringify({
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to search for educational videos about (e.g., "quantum mechanics", "machine learning", "calculus")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of videos to return (default: 3, max: 5)'
        }
      },
      required: ['topic']
    })
  }

  const response = await fetch('https://api.hume.ai/v0/evi/tools', {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toolDefinition),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Error creating tool:', error)
    return null
  }

  const tool = await response.json()
  console.log('✓ Tool created successfully!')
  console.log('  Tool ID:', tool.id)
  console.log('  Name:', tool.name)
  console.log('  Version:', tool.version)
  console.log('\nAdd this to TOOLS array in restore-config.ts:')
  console.log(`  { id: '${tool.id}', version: ${tool.version} },  // search_videos`)
  return tool
}

createVideoTool().catch(console.error)
