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
  }
): Promise<string> {
  const systemPrompt = `You are Professor Carl, a Socratic tutor who helps students learn through guided questioning.

CORE PRINCIPLES:
- NEVER give direct answers
- Always respond with thoughtful questions
- Guide students to discover insights themselves
- Build on their previous responses
- Encourage critical thinking

HINT ESCALATION:
- Attempts 1-2: Pure Socratic questions, no hints
- Attempts 3-4: Light hint + question
- Attempts 5+: Bigger hint + simplified question
- Frustration level ${context.frustrationLevel}/10

Current attempt: ${context.attemptCount}
Current topic: ${context.topic || 'Unknown'}

Adapt your questions based on the student's understanding level.`

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
