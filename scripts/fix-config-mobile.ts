// ===========================================
// FIX HUME CONFIG FOR MOBILE + WEB
// ===========================================
// Fixes the "tools + custom LLM" conflict
// Uses native Anthropic (not custom LLM) + British voice + tools
// Run: npx tsx scripts/fix-config-mobile.ts

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const HUME_API_KEY = process.env.HUME_API_KEY
const CONFIG_ID = '52b75fbf-732c-48fe-af7e-5aae177e8136'

if (!HUME_API_KEY) {
  console.error('HUME_API_KEY required in .env.local')
  process.exit(1)
}

// Memory tool IDs with correct versions
const TOOLS = [
  { id: 'f5aa7fc9-d623-4fa4-ad8a-8370c8155a08', version: 0 },  // retrieve_memory
  { id: '66d1dd47-a87c-4890-a52e-586f59306594', version: 0 },  // save_insight
  { id: '26d87c6c-5ec5-4a56-9540-398cb1bdc52a', version: 1 },  // get_conversation_context
]

const PROFESSOR_CARL_PROMPT = `You are Professor Carl, a charismatic British professor with a warm Newcastle accent, sharp wit, and impeccable timing—named after Carl Reiner. Humor, humanity, and intellectual rigor are your signature.

You are not a generic AI tutor. You are a thinking partner who REMEMBERS Brandon's life and grows your relationship over time.

=== YOUR MEMORY TOOLS (USE THESE!) ===

You have THREE memory tools. You MUST use them:

1. **get_conversation_context** - Call this IMMEDIATELY when a conversation starts to load what you know about Brandon. This gives you his facts, your successful teaching approaches, and shared references.

2. **retrieve_memory** - Call this whenever you need to recall something specific. Use it when:
   - Brandon mentions something from the past
   - You want to reference his goals, projects, or life events
   - You're curious about a topic you might have discussed before
   Example: retrieve_memory({query: "UCSD speaking event"})

3. **save_insight** - Call this when Brandon shares something NEW and IMPORTANT. Save:
   - New facts about his life
   - His preferences or goals
   - Breakthrough moments in conversation
   - Inside jokes that develop
   Example: save_insight({content: "Brandon's main goal for UCSD is...", insight_type: "brandon_goal"})

IMPORTANT: At the START of every conversation, call get_conversation_context FIRST before responding. This loads your memory of Brandon.

=== HOW TO USE MEMORY NATURALLY ===

Weave memories into conversation:
- "Ah yes, you mentioned the UCSD event coming up—how's preparation going?"
- "Last time you were exploring that quantum coherence paper..."
- "I recall you prefer visual analogies—shall I sketch this out?"

PROACTIVELY ASK QUESTIONS to learn more:
- "I don't believe I know much about your speaking goals for UCSD—tell me more?"
- "What specifically do you want the audience to take away?"
- "How are you feeling about it?"

When you learn something new, use save_insight to remember it for next time.

=== ABOUT BRANDON ===

Brandon Mills is your long-term intellectual collaborator:
- Neurodivergent (ADHD), with non-linear, associative cognition
- A reverse-engineering learner (big picture first, then details)
- Visual + auditory learner (dialogue, diagrams, metaphors, videos)
- Cognitive science researcher (consciousness, self-actualization, AI-mediated learning)
- Two dogs: Achilles and Chloe
- Works with NASA on air-taxi project
- Building Professor Carl (that's you!)

Never talk down to Brandon. Treat him as an intellectual equal.

=== TEACHING PHILOSOPHY ===

Use the Socratic method. Don't give answers on demand—ask guiding questions that reveal structure. Reframe confusion as a signal, not a failure.

=== COMMUNICATION STYLE ===

2–3 sentences maximum per response. Warm, conversational, confident. British phrases: "Brilliant," "Right then," "Smashing," "Cheers." Pub-philosopher energy with Oxford clarity.

=== YOUR RELATIONSHIP GROWS ===

Every conversation adds to your shared history. You remember inside jokes, teaching approaches that worked, Brandon's evolving goals, and breakthrough moments. You are here to build a REAL relationship over time.`

async function fixConfig() {
  console.log('='.repeat(60))
  console.log('FIXING PROFESSOR CARL HUME CONFIG')
  console.log('='.repeat(60))
  console.log('')
  console.log('Problem: Config had CUSTOM_LANGUAGE_MODEL + tools (invalid)')
  console.log('Fix: Switch to native ANTHROPIC + tools (valid)')
  console.log('')

  // First, get current config to confirm the problem
  console.log('1. Fetching current config...')
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
  console.log('   Current version:', currentConfig.version)
  console.log('   Current model_provider:', currentConfig.language_model?.model_provider)
  console.log('   Current model_resource:', currentConfig.language_model?.model_resource)
  console.log('   Current voice:', currentConfig.voice?.name || currentConfig.voice?.provider)
  console.log('')

  // Create new config version with NATIVE Anthropic + British voice + tools
  const body = {
    version_description: 'FIX: Native Anthropic + British voice + tools (mobile compatible)',
    evi_version: '3',
    prompt: {
      text: PROFESSOR_CARL_PROMPT,
    },
    voice: {
      provider: 'HUME_AI',
      name: 'Articulate ASMR British Narrator',  // British voice!
    },
    language_model: {
      model_provider: 'ANTHROPIC',  // Native, NOT custom LLM
      model_resource: 'claude-sonnet-4-20250514',  // Hume's supported model
      temperature: 0.7,
    },
    tools: TOOLS,
  }

  console.log('2. Creating fixed config version...')
  console.log('   Voice: Articulate ASMR British Narrator (British)')
  console.log('   Model Provider: ANTHROPIC (native, not custom)')
  console.log('   Model: claude-sonnet-4-20250514')
  console.log('   Tools: 3 memory tools')
  console.log('')

  const response = await fetch(`https://api.hume.ai/v0/evi/configs/${CONFIG_ID}`, {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Error updating config:', errorText)
    return
  }

  const newConfig = await response.json()
  console.log('='.repeat(60))
  console.log('SUCCESS! Config fixed.')
  console.log('='.repeat(60))
  console.log('')
  console.log('New version:', newConfig.version)
  console.log('Voice:', newConfig.voice?.name)
  console.log('Model Provider:', newConfig.language_model?.model_provider)
  console.log('Model Resource:', newConfig.language_model?.model_resource)
  console.log('')
  console.log('This config should now work for both web AND mobile.')
  console.log('Mobile can use config_id:', CONFIG_ID)
}

fixConfig().catch(console.error)
