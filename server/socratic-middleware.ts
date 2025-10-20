/**
 * Socratic Middleware
 *
 * Enforces the Socratic pedagogy rubric by tracking conversation state
 * and validating that Carl follows the teaching methodology.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Types for our rubric and state
export interface SocraticRubric {
  no_spoilers_before_attempt: boolean;
  hint_tiers_required: number;
  metacognitive_checks_per_session: number;
  minimum_interactions_before_solution: number;
  minimum_questions_asked: number;
  forbidden: string[];
  session_must_include: string[];
}

export interface ConversationState {
  sessionId: string;
  studentAttempts: number;
  hintsOffered: number;
  questionsAsked: number;
  metacognitiveChecks: number;
  interactions: number;
  hasAssessmentQuestion: boolean;
  hasRecap: boolean;
  forbiddenActionsDetected: string[];
  currentHintTier: number;
}

export class SocraticMiddleware {
  private rubric: SocraticRubric;
  private sessions: Map<string, ConversationState>;
  private systemPrompt: string;

  constructor() {
    // Load the rubric
    const rubricPath = path.join(process.cwd(), 'agent/rubrics/socratic.yml');
    const rubricContent = fs.readFileSync(rubricPath, 'utf-8');
    this.rubric = yaml.load(rubricContent) as SocraticRubric;

    // Load the system prompt
    const promptPath = path.join(process.cwd(), 'agent/prompts/socratic.md');
    this.systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // Initialize session storage
    this.sessions = new Map();
  }

  /**
   * Initialize or retrieve a session
   */
  getSession(sessionId: string): ConversationState {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        studentAttempts: 0,
        hintsOffered: 0,
        questionsAsked: 0,
        metacognitiveChecks: 0,
        interactions: 0,
        hasAssessmentQuestion: false,
        hasRecap: false,
        forbiddenActionsDetected: [],
        currentHintTier: 0,
      });
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Get the system prompt with current session context
   */
  getSystemPrompt(sessionId: string): string {
    const state = this.getSession(sessionId);

    // Append session state to help Carl track progress
    const contextAddition = `

## Current Session State

- Student attempts: ${state.studentAttempts}
- Hints offered: ${state.hintsOffered} (Tier ${state.currentHintTier})
- Questions asked: ${state.questionsAsked}
- Metacognitive checks: ${state.metacognitiveChecks}
- Total interactions: ${state.interactions}

### Required for this session:
${!state.hasAssessmentQuestion ? '- [ ] Start with assessment/diagnostic question' : '- [x] Assessment question asked'}
${state.studentAttempts === 0 ? '- [ ] Elicit at least one student attempt' : '- [x] Student has attempted'}
${state.hintsOffered < this.rubric.hint_tiers_required ? `- [ ] Offer at least ${this.rubric.hint_tiers_required} hint tiers` : '- [x] Sufficient hints offered'}
${state.metacognitiveChecks < this.rubric.metacognitive_checks_per_session ? `- [ ] Ask at least ${this.rubric.metacognitive_checks_per_session} metacognitive questions` : '- [x] Metacognitive checks complete'}
${!state.hasRecap ? '- [ ] End with 3-5 bullet recap' : '- [x] Recap provided'}

Remember: No spoilers until student has attempted!
`;

    return this.systemPrompt + contextAddition;
  }

  /**
   * Process a student message
   */
  processStudentMessage(sessionId: string, message: string): void {
    const state = this.getSession(sessionId);
    state.interactions++;

    // Detect if this is a student attempt (contains substantive content)
    if (this.isStudentAttempt(message)) {
      state.studentAttempts++;
    }
  }

  /**
   * Validate Carl's response before sending
   */
  validateResponse(sessionId: string, response: string): {
    valid: boolean;
    warnings: string[];
    blocked: boolean;
    reason?: string;
  } {
    const state = this.getSession(sessionId);
    const warnings: string[] = [];
    let blocked = false;
    let reason: string | undefined;

    // Update state based on response
    this.updateStateFromResponse(state, response);

    // Rule 1: No spoilers before attempt
    if (this.rubric.no_spoilers_before_attempt && state.studentAttempts === 0) {
      if (this.containsDirectAnswer(response)) {
        blocked = true;
        reason = "Cannot provide direct answers before student has attempted. Ask diagnostic questions first.";
      }
    }

    // Rule 2: Minimum interactions before full solution
    if (state.interactions < this.rubric.minimum_interactions_before_solution) {
      if (this.containsFullSolution(response)) {
        blocked = true;
        reason = `Need at least ${this.rubric.minimum_interactions_before_solution} interactions before providing full solutions. Currently at ${state.interactions}.`;
      }
    }

    // Rule 3: Check for forbidden actions
    const forbiddenAction = this.detectForbiddenAction(response);
    if (forbiddenAction) {
      warnings.push(`Warning: Response may contain forbidden action: ${forbiddenAction}`);
      state.forbiddenActionsDetected.push(forbiddenAction);
    }

    // Rule 4: Must ask questions early
    if (state.interactions <= 2 && state.questionsAsked === 0) {
      if (!this.containsQuestion(response)) {
        warnings.push("Early interactions should include diagnostic questions.");
      }
    }

    // Rule 5: Check hint progression
    if (state.hintsOffered > 0 && state.studentAttempts === 0) {
      warnings.push("Hints offered but no student attempt yet - encourage them to try!");
    }

    return {
      valid: !blocked,
      warnings,
      blocked,
      reason,
    };
  }

  /**
   * Update session state based on Carl's response
   */
  private updateStateFromResponse(state: ConversationState, response: string): void {
    // Count questions
    const questions = (response.match(/\?/g) || []).length;
    state.questionsAsked += questions;

    // Detect assessment/diagnostic questions
    if (!state.hasAssessmentQuestion && this.isAssessmentQuestion(response)) {
      state.hasAssessmentQuestion = true;
    }

    // Detect hints
    if (this.containsHint(response)) {
      state.hintsOffered++;
      state.currentHintTier = Math.min(state.currentHintTier + 1, 3);
    }

    // Detect metacognitive checks
    if (this.isMetacognitiveCheck(response)) {
      state.metacognitiveChecks++;
    }

    // Detect recap
    if (this.containsRecap(response)) {
      state.hasRecap = true;
    }
  }

  /**
   * Heuristics for detecting different response types
   */
  private isStudentAttempt(message: string): boolean {
    // Student attempts have substantive content: either long OR multiple sentences with substance
    const wordCount = message.split(/\s+/).length;
    const hasMultipleSentences = (message.match(/[.!?]/g) || []).length >= 2;

    // Long content (12+ words) OR multiple sentences with decent length (8+ words)
    const isLongAttempt = wordCount >= 12;
    const isMultiSentenceAttempt = hasMultipleSentences && wordCount >= 8;

    return isLongAttempt || isMultiSentenceAttempt || message.includes('```');
  }

  private containsDirectAnswer(response: string): boolean {
    // Detect phrases that give away answers
    const spoilerPhrases = [
      /the answer is/i,
      /here's your thesis/i,
      /your essay should say/i,
      /write this:/i,
      /the correct response is/i,
    ];
    return spoilerPhrases.some(pattern => pattern.test(response));
  }

  private containsFullSolution(response: string): boolean {
    // Detect complete solutions (long direct answers with 2+ sentences)
    const hasLongParagraph = /[^.!?]+[.!?]\s*[^.!?]+[.!?]/.test(response);
    const hasSolutionKeywords = /here'?s? the full|complete answer|final version|here'?s? your|full solution/i.test(response);
    return hasLongParagraph && hasSolutionKeywords;
  }

  private detectForbiddenAction(response: string): string | null {
    const forbiddenPatterns = [
      { pattern: /I'll write your essay/i, action: 'writing_full_essays' },
      { pattern: /here's your thesis statement:/i, action: 'writing_thesis_verbatim' },
      { pattern: /copy this into your assignment/i, action: 'doing_homework' },
    ];

    for (const { pattern, action } of forbiddenPatterns) {
      if (pattern.test(response)) {
        return action;
      }
    }
    return null;
  }

  private containsQuestion(response: string): boolean {
    return response.includes('?');
  }

  private isAssessmentQuestion(response: string): boolean {
    const assessmentPhrases = [
      /what have you tried/i,
      /what's your understanding/i,
      /where are you stuck/i,
      /what do you know about/i,
    ];
    return assessmentPhrases.some(pattern => pattern.test(response));
  }

  private containsHint(response: string): boolean {
    const hintPhrases = [
      /try thinking about/i,
      /think about/i,
      /consider/i,
      /one approach is/i,
      /here's a hint/i,
      /structure.*like/i,
    ];
    return hintPhrases.some(pattern => pattern.test(response));
  }

  private isMetacognitiveCheck(response: string): boolean {
    const metacogPhrases = [
      /why did you/i,
      /how does this connect/i,
      /what's the difference between/i,
      /can you explain your reasoning/i,
      /what makes you think/i,
    ];
    return metacogPhrases.some(pattern => pattern.test(response));
  }

  private containsRecap(response: string): boolean {
    return /here's what we (covered|learned|worked on)|recap|summary|to sum up/i.test(response);
  }

  /**
   * Get session summary for debugging/analytics
   */
  getSessionSummary(sessionId: string): ConversationState {
    return this.getSession(sessionId);
  }

  /**
   * Clear a session (for testing or session end)
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

// Singleton instance
export const socraticMiddleware = new SocraticMiddleware();
