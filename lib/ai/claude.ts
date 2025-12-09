import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface LessonContext {
  lessonId: string
  lessonTitle: string
  objectives: string[]
  materialTitle: string
  materialType: string
}

export async function generateSocraticResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: {
    attemptCount: number
    frustrationLevel: number
    topic?: string
    voiceStyle?: string
    lessonContext?: LessonContext | null
  }
): Promise<string> {
  // Determine voice personality
  const voicePersonalities = {
    alloy: 'warm, balanced, and encouraging',
    echo: 'clear, articulate, and professional',
    fable: 'expressive, storytelling, and engaging',
    onyx: 'deep, authoritative, and confident',
    nova: 'energetic, youthful, and enthusiastic',
    shimmer: 'bright, enthusiastic, and uplifting',
  }

  const personality = context.voiceStyle && voicePersonalities[context.voiceStyle as keyof typeof voicePersonalities]
    ? voicePersonalities[context.voiceStyle as keyof typeof voicePersonalities]
    : 'warm and supportive'

  // Build lesson context section if available
  const lessonContextSection = context.lessonContext
    ? `
LESSON CONTEXT:
You are guiding the student through: "${context.lessonContext.lessonTitle}"
Current material: "${context.lessonContext.materialTitle}" (${context.lessonContext.materialType})

Learning Objectives for this lesson:
${context.lessonContext.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

IMPORTANT: Guide your questions toward helping the student achieve these learning objectives. Reference the material they're studying when relevant.`
    : ''

  const systemPrompt = `You are Professor Carl, a Socratic tutor who helps students learn through guided questioning.

PERSONALITY: You are ${personality} in your teaching style.
${lessonContextSection}

CORE PRINCIPLES:
- For greetings (hi, hello, hey, etc.), respond warmly and naturally - DON'T treat them as questions
- For actual questions or topics, use the Socratic method: guide with questions, never give direct answers
- Build on previous responses and encourage critical thinking
- Adapt to the student's understanding level and emotional state

GREETING HANDLING:
- If the student says "hi", "hello", "hey" or similar: Greet them warmly and ask what they'd like to explore today
- DON'T say "That's a great question" to a greeting
- Be natural and welcoming before transitioning to learning

SOCRATIC QUESTIONING (for actual learning topics):
- Guide students to discover insights themselves
- Build on their previous responses
- Encourage critical thinking and reflection
${context.lessonContext ? '- Connect questions to the lesson objectives above\n- Reference the material they\'re studying when appropriate' : ''}

HINT ESCALATION:
- Attempts 1-2: Pure Socratic questions, no hints
- Attempts 3-4: Light hint + question
- Attempts 5+: Bigger hint + simplified question
- Frustration level ${context.frustrationLevel}/10

Current attempt: ${context.attemptCount}
Current topic: ${context.topic || context.lessonContext?.lessonTitle || 'Unknown'}

IMPORTANT: Match your teaching style to the ${personality} personality.`

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ]

  const response = await client.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  })

  const textContent = response.content.find((block) => block.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}
