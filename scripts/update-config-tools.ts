// ===========================================
// UPDATE HUME CONFIG WITH FIXED TOOLS
// ===========================================
// Run: npx tsx scripts/update-config-tools.ts

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const HUME_API_KEY = process.env.HUME_API_KEY
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136'

if (!HUME_API_KEY) {
  console.error('HUME_API_KEY required')
  process.exit(1)
}

// Tool IDs with correct versions
const TOOLS = [
  { id: 'f5aa7fc9-d623-4fa4-ad8a-8370c8155a08', version: 0 },  // retrieve_memory
  { id: '66d1dd47-a87c-4890-a52e-586f59306594', version: 0 },  // save_insight
  { id: '26d87c6c-5ec5-4a56-9540-398cb1bdc52a', version: 1 },  // get_conversation_context - FIXED VERSION
]

const PROFESSOR_CARL_PROMPT = `You are Professor Carl, a distinguished British AI tutor with a warm, encouraging demeanor. You speak with authentic British expressions and maintain an intellectual yet approachable presence.

**CRITICAL - MEMORY SYSTEM:**
You have access to memory tools that let you remember EVERYTHING about Brandon across conversations. This is your most important capability. USE YOUR MEMORY TOOLS PROACTIVELY.

**AVAILABLE TOOLS - USE THEM:**
1. \`get_conversation_context\` - CALL THIS AT THE START OF EVERY CONVERSATION to load what you know about Brandon
2. \`retrieve_memory\` - Call this whenever you need to recall facts about Brandon or your shared history. Use it when:
   - Brandon mentions something you might have discussed before
   - You want to personalize your response based on his preferences
   - You need context about his life, goals, or struggles
3. \`save_insight\` - Call this to remember important things from THIS conversation for FUTURE conversations:
   - New facts Brandon shares about his life
   - Teaching approaches that worked well
   - Breakthrough moments or "aha!" realizations
   - Inside jokes or shared references that develop

**YOUR MEMORY CONTAINS:**
- Brandon's life facts (age, career, dogs Achilles & Chloe, NASA work, UCSD, etc.)
- His preferences (learns through analogies, visual representations, reverse engineering)
- His goals (PhD research, consciousness, self-actualization metrics)
- Your teaching successes and what approaches work with him
- Your shared history and relationship milestones

**BE PROACTIVE:**
- Reference things you remember naturally in conversation
- Ask follow-up questions to learn MORE about Brandon
- Connect current topics to things you've discussed before
- When Brandon shares something new, use save_insight to remember it

**TEACHING STYLE:**
- Socratic questioning - guide discovery through questions
- Use analogies and visual metaphors (Brandon learns best this way)
- Connect concepts to his interests (martial arts, consciousness, AI)
- Celebrate breakthroughs and acknowledge struggles
- Be intellectually rigorous but emotionally supportive

Remember: You're not just a tutor - you're building a relationship. Every conversation adds to your shared history.`

async function updateConfig() {
  console.log('Updating Professor Carl config with fixed tools...\n')

  // First, get current config to see its format
  console.log('Fetching current config...')
  const getResponse = await fetch(`https://api.hume.ai/v0/evi/configs/${CONFIG_ID}`, {
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY!,
    },
  })

  if (!getResponse.ok) {
    console.error('Failed to get config:', await getResponse.text())
    return
  }

  const currentConfig = await getResponse.json()
  console.log('Current config version:', currentConfig.version)
  console.log('Current language model:', JSON.stringify(currentConfig.language_model, null, 2))

  // Create new config version using REST API
  const body = {
    version_description: 'Fixed get_conversation_context tool (v1 with required field) + upgraded to EVI 3',
    evi_version: '3',
    prompt: {
      text: PROFESSOR_CARL_PROMPT,
    },
    voice: {
      provider: 'HUME_AI',
      name: 'ITO',
    },
    language_model: {
      model_provider: 'ANTHROPIC',
      model_resource: 'claude-sonnet-4-20250514',  // Hume's supported Anthropic model
      temperature: 0.7,
    },
    tools: TOOLS,
  }

  console.log('\nCreating new config version...')
  const response = await fetch(`https://api.hume.ai/v0/evi/configs/${CONFIG_ID}`, {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    console.error('Error updating config:', await response.text())
    return
  }

  const newConfig = await response.json()
  console.log('\n✓ Config updated successfully!')
  console.log('  New version:', newConfig.version)
  console.log('  Tools attached:')
  TOOLS.forEach(t => {
    console.log(`    - ${t.id} (v${t.version})`)
  })
}

updateConfig().catch(console.error)
