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
  // Pattern 1: "Hint 1:" or "Tier 1:" - EXPLICIT hints only
  /(?:Hint|Tier)\s*(\d+):\s*([^\n]+)\n([\s\S]+?)(?=(?:Hint|Tier)\s*\d+:|$)/gi,

  // Pattern 2: "**Hint 1:**" (markdown bold) - EXPLICIT hints only
  /\*\*(?:Hint|Tier)\s*(\d+):\*\*\s*([^\n]+)\n([\s\S]+?)(?=\*\*(?:Hint|Tier)\s*\d+:|$)/gi,

  // Pattern 3: REMOVED - was too aggressive, caught normal numbered lists
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

  // DISABLED: Informal hint detection was too aggressive
  // Only show hints when Carl explicitly uses "Hint 1:", "Hint 2:" format
  // This prevents false positives on normal questions and conversation

  return {
    hasHints: hints.length > 0,
    hints: hints.sort((a, b) => a.tier - b.tier),
    remainingContent,
  };
}

/**
 * Detect informal hints (when Carl doesn't use structured format)
 * ONLY trigger this for actual scaffolding hints, NOT initial questions
 */
function detectInformalHints(message: string): Hint[] {
  // Don't treat simple questions or assessment as hints
  // Only detect as hints if there are MULTIPLE progressive scaffolding phrases
  // AND the message seems to be offering structured support (not just asking questions)

  // Check for markers that this is ACTUAL hint scaffolding:
  // - Multiple "hint-like" phrases (at least 2-3)
  // - Presence of progressive scaffolding language
  // - Not just initial assessment questions

  const scaffoldingMarkers = [
    /Let's think about/gi,
    /Consider (?:this|that|these)/gi,
    /Try (?:thinking|this)/gi,
    /(?:Here's|Try) (?:a|this) (?:template|structure|framework)/gi,
  ];

  const markerCount = scaffoldingMarkers.filter(pattern => pattern.test(message)).length;

  // Only treat as hints if we have multiple scaffolding markers (2+)
  // This means it's genuine progressive hinting, not just questions
  if (markerCount < 2) {
    return [];
  }

  // Also check message length - hints are usually substantial (not just greetings/questions)
  if (message.length < 200) {
    return [];
  }

  // If we get here, it's likely real hints - extract them
  const hints: Hint[] = [];

  const hintPhrases = [
    { pattern: /Let's think about ([^.!?]+)/gi, title: 'Think About Context' },
    { pattern: /Consider (?:this|that|these):?\s*([^.!?]+)/gi, title: 'Consider This' },
    { pattern: /Try (?:thinking about|this):?\s*([^.!?]+)/gi, title: 'Try This Approach' },
  ];

  hintPhrases.forEach((phrase) => {
    const matches = [...message.matchAll(phrase.pattern)];
    if (matches.length > 0 && matches[0][1]) {
      hints.push({
        tier: hints.length + 1,
        title: phrase.title,
        content: matches[0][0],
        icon: HINT_ICONS[hints.length + 1] || '💡',
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
