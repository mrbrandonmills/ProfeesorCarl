/**
 * Direct test of memory extraction
 * Run: npx tsx scripts/test-extraction.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { extractMemoriesFromConversation } from '../lib/memory/extraction'

async function main() {
  console.log('Testing memory extraction directly...')

  const testMessages = [
    {
      role: 'user' as const,
      content: 'Professor Carl, I need to tell you something important. My name is Brandon Mills and I am moving to Italy next year to pursue my bachelors degree. Even though the program is in English, I really want to learn Italian to integrate better.'
    },
    {
      role: 'assistant' as const,
      content: 'What wonderful news, Brandon! Moving to Italy for your education is a significant life decision. Learning Italian will indeed help you connect with locals and truly immerse yourself in the culture. Have you chosen a specific city?'
    },
    {
      role: 'user' as const,
      content: 'Yes, I am looking at universities in Rome and Florence. My uncle Randell Mills has been encouraging me to pursue this. He has these amazing theories about consciousness that I find fascinating, and being in Europe might help me explore similar academic circles.'
    },
    {
      role: 'assistant' as const,
      content: 'Both Rome and Florence are magnificent choices, each with rich academic traditions. And how intriguing that you have family encouraging this path. Your uncle consciousness theories sound like they might align with your own interests. What specifically draws you to consciousness research?'
    },
    {
      role: 'user' as const,
      content: 'I worked at NASA before and now I am focused on understanding the link between dopamine systems, coherence, and self-actualization. I am neurodivergent and I think differently than most people - I need a tutor who can follow my tangents and help me organize my chaotic thinking patterns.'
    }
  ]

  try {
    console.log('Calling extractMemoriesFromConversation...')
    const result = await extractMemoriesFromConversation(testMessages)

    console.log('\n=== EXTRACTION RESULTS ===')
    console.log(`Brandon memories: ${result.brandonMemories.length}`)
    console.log(`Carl memories: ${result.carlMemories.length}`)

    if (result.brandonMemories.length > 0) {
      console.log('\n--- Brandon Memories ---')
      result.brandonMemories.forEach((m, i) => {
        console.log(`\n[${i + 1}] ${m.category}`)
        console.log(`  Content: ${m.summary}`)
        console.log(`  Arousal: ${m.emotional_arousal}, Valence: ${m.emotional_valence}`)
        console.log(`  Importance: ${m.llm_importance}, Emotion: ${m.dominant_emotion}`)
      })
    }

    if (result.carlMemories.length > 0) {
      console.log('\n--- Carl Memories ---')
      result.carlMemories.forEach((m, i) => {
        console.log(`\n[${i + 1}] ${m.type}`)
        console.log(`  Content: ${m.summary}`)
        console.log(`  Effectiveness: ${m.effectivenessScore}`)
      })
    }

    console.log('\n=== TEST COMPLETE ===')
  } catch (error) {
    console.error('Extraction failed:', error)
    process.exit(1)
  }
}

main()
