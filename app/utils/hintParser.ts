/**
 * Hint Parser
 *
 * Detects when Carl is giving structured hints and extracts them
 * for display in the HintStepper component
 */

interface Hint {
  tier: number;
  title: string;
  content: string;
  icon: string;
}

interface ParsedMessage {
  hasHints: boolean;
  hints: Hint[];
  remainingContent: string;
}

const HINT_ICONS: Record<number, string> = {
  1: '🎯', // Contextual hint
  2: '🧩', // Question decomposition
  3: '📐', // Structural framework
  4: '🤝', // Collaborative exploration
};

const HINT_PATTERNS = [
  // Pattern 1: "Hint 1:" or "Tier 1:"
  /(?:Hint|Tier)\s*(\d+):\s*([^\n]+)\n([\s\S]+?)(?=(?:Hint|Tier)\s*\d+:|$)/gi,

  // Pattern 2: "**Hint 1:**" (markdown bold)
  /\*\*(?:Hint|Tier)\s*(\d+):\*\*\s*([^\n]+)\n([\s\S]+?)(?=\*\*(?:Hint|Tier)\s*\d+:|$)/gi,

  // Pattern 3: Numbered list with hint context
  /(\d+)\.\s+\*\*([^*]+)\*\*[:\s]+([\s\S]+?)(?=\d+\.\s+\*\*|$)/gi,
];

/**
 * Detect if a message contains structured hints
 */
export function containsHints(message: string): boolean {
  return HINT_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Parse hints from Carl's message
 */
export function parseHints(message: string): ParsedMessage {
  let hints: Hint[] = [];
  let remainingContent = message;

  // Try each pattern
  for (const pattern of HINT_PATTERNS) {
    const matches = [...message.matchAll(pattern)];

    if (matches.length > 0) {
      hints = matches.map((match, index) => ({
        tier: parseInt(match[1]) || index + 1,
        title: match[2].trim(),
        content: match[3].trim(),
        icon: HINT_ICONS[parseInt(match[1]) || index + 1] || '💡',
      }));

      // Remove hint blocks from remaining content
      remainingContent = message.replace(pattern, '').trim();
      break;
    }
  }

  // If no structured hints found but message contains hint-like content
  // Check for informal hints
  if (hints.length === 0) {
    const informalHints = detectInformalHints(message);
    if (informalHints.length > 0) {
      hints = informalHints;
      remainingContent = extractNonHintContent(message, hints);
    }
  }

  return {
    hasHints: hints.length > 0,
    hints: hints.sort((a, b) => a.tier - b.tier),
    remainingContent,
  };
}

/**
 * Detect informal hints (when Carl doesn't use structured format)
 */
function detectInformalHints(message: string): Hint[] {
  const hints: Hint[] = [];

  // Look for "Let's think about", "Consider", "Try thinking about"
  const hintPhrases = [
    { pattern: /Let's think about ([^.!?]+)/gi, title: 'Think About Context' },
    { pattern: /Consider ([^.!?]+)/gi, title: 'Consider This' },
    { pattern: /Try thinking about ([^.!?]+)/gi, title: 'Try This Approach' },
    { pattern: /(?:So what\?[^\n]*)/gi, title: 'Relevance Check' },
  ];

  hintPhrases.forEach((phrase, index) => {
    const matches = [...message.matchAll(phrase.pattern)];
    if (matches.length > 0) {
      matches.forEach((match) => {
        hints.push({
          tier: hints.length + 1,
          title: phrase.title,
          content: match[0],
          icon: HINT_ICONS[hints.length + 1] || '💡',
        });
      });
    }
  });

  return hints.slice(0, 4); // Max 4 hints
}

/**
 * Extract content that isn't part of hints
 */
function extractNonHintContent(message: string, hints: Hint[]): string {
  let content = message;

  hints.forEach(hint => {
    content = content.replace(hint.content, '');
  });

  return content.trim();
}

/**
 * Format message for Carl to encourage hint structure
 */
export function formatHintGuidance(): string {
  return `
When providing hints, structure them like this for better visual display:

**Hint 1: Contextual**
Think about the real-world context...

**Hint 2: Question Decomposition**
Let's break this down into parts...

**Hint 3: Structural Framework**
Try this structure: [template]

This helps students see their progress visually!
`;
}
