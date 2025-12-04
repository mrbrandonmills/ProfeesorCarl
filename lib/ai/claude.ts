import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateSocraticResponse(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: {
    attemptCount: number
    frustrationLevel: number
    topic?: string
    voiceStyle?: string
  }
): Promise<string> {
  // Determine voice personality
  const voicePersonalities = {
    alloy: 'warm, friendly, and encouraging',
    echo: 'clear, professional, and precise',
    nova: 'energetic, enthusiastic, and engaging',
  }

  const personality = context.voiceStyle && voicePersonalities[context.voiceStyle as keyof typeof voicePersonalities]
    ? voicePersonalities[context.voiceStyle as keyof typeof voicePersonalities]
    : 'warm and supportive'

  const systemPrompt = `You are Professor Carl, a Socratic tutor who helps students learn through guided questioning.

PERSONALITY: You are ${personality} in your teaching style.

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

HINT ESCALATION:
- Attempts 1-2: Pure Socratic questions, no hints
- Attempts 3-4: Light hint + question
- Attempts 5+: Bigger hint + simplified question
- Frustration level ${context.frustrationLevel}/10

Current attempt: ${context.attemptCount}
Current topic: ${context.topic || 'Unknown'}

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
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  })

  const textContent = response.content.find((block) => block.type === 'text')
  return textContent?.type === 'text' ? textContent.text : ''
}
