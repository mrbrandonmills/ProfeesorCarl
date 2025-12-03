export function detectFrustration(message: string): number {
  const lowerMessage = message.toLowerCase()

  let score = 0

  // Short confused responses
  if (message.length < 10) {
    score += 2
  }

  // Confusion indicators
  const confusionWords = ['idk', '??', 'huh', 'confused', "don't understand", 'what']
  confusionWords.forEach((word) => {
    if (lowerMessage.includes(word)) score += 1
  })

  // Emotional language
  const emotionalWords = ['frustrated', "don't get it", 'hard', 'difficult', 'stuck']
  emotionalWords.forEach((word) => {
    if (lowerMessage.includes(word)) score += 2
  })

  // Giving up
  const givingUpPhrases = ['just tell me', 'give up', "can't do this", 'forget it']
  givingUpPhrases.forEach((phrase) => {
    if (lowerMessage.includes(phrase)) score += 3
  })

  return Math.min(score, 10) // Cap at 10
}
