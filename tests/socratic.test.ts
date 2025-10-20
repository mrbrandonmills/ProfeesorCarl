/**
 * Tests for Socratic Middleware
 *
 * These tests verify that Professor Carl follows the Socratic method
 * and enforces pedagogical rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SocraticMiddleware } from '../server/socratic-middleware';

describe('Socratic Middleware - Core Rules', () => {
  let middleware: SocraticMiddleware;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    middleware = new SocraticMiddleware();
    middleware.clearSession(testSessionId);
  });

  describe('Rule: No Spoilers Before Attempt', () => {
    it('should block direct answers when student has not attempted', () => {
      // Student asks a question but hasn't tried
      middleware.processStudentMessage(testSessionId, 'What should my thesis be?');

      const state = middleware.getSession(testSessionId);
      expect(state.studentAttempts).toBe(0);

      // Carl tries to give a direct answer
      const response = "The answer is: Your thesis should be 'In The Great Gatsby...'";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.blocked).toBe(true);
      expect(validation.reason).toContain('before student has attempted');
    });

    it('should allow hints before student attempt', () => {
      middleware.processStudentMessage(testSessionId, 'What should my thesis be?');

      const response = "Let's think about this - what's the main argument you want to make about the text?";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.blocked).toBe(false);
    });

    it('should allow answers after student has attempted', () => {
      // Student makes a substantive attempt
      middleware.processStudentMessage(
        testSessionId,
        'I think my thesis could be about how Gatsby represents the American Dream. The evidence shows he worked hard but still failed.'
      );

      const state = middleware.getSession(testSessionId);
      expect(state.studentAttempts).toBeGreaterThan(0);

      // Now Carl can provide more direct guidance
      const response = "Good start! Now let's refine it - here's a structure you could use...";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.blocked).toBe(false);
    });
  });

  describe('Rule: Minimum Interactions Before Solution', () => {
    it('should block full solutions too early', () => {
      middleware.processStudentMessage(testSessionId, 'Help me with my essay');

      // Only 1 interaction, tries to give full solution
      const response =
        "Here's the full solution: Your essay should have three paragraphs. First, introduce your thesis...";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.blocked).toBe(true);
      expect(validation.reason).toContain('at least 3 interactions');
    });

    it('should allow full solutions after enough interactions', () => {
      // Multiple interactions
      for (let i = 0; i < 4; i++) {
        middleware.processStudentMessage(testSessionId, `Attempt ${i}: Here's my thinking...`);
        middleware.validateResponse(testSessionId, 'Good, what else?');
      }

      const state = middleware.getSession(testSessionId);
      expect(state.interactions).toBeGreaterThanOrEqual(3);

      // Now a fuller answer is okay
      const response = "Based on our discussion, here's a complete outline for your essay...";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.blocked).toBe(false);
    });
  });

  describe('Rule: Ask Questions Early', () => {
    it('should warn if no questions asked in early interactions', () => {
      middleware.processStudentMessage(testSessionId, 'Help me write an essay');

      // Response without questions
      const response = "Okay, let me help you write an essay.";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('diagnostic questions');
    });

    it('should not warn if questions are asked early', () => {
      middleware.processStudentMessage(testSessionId, 'Help me write an essay');

      const response = "I'd be happy to help! What topic are you writing about? What's your current understanding?";
      const validation = middleware.validateResponse(testSessionId, response);

      // May have other warnings, but not about missing questions
      const hasQuestionWarning = validation.warnings.some(w => w.includes('diagnostic questions'));
      expect(hasQuestionWarning).toBe(false);
    });
  });

  describe('Rule: Detect Forbidden Actions', () => {
    it('should detect attempt to write full essays', () => {
      middleware.processStudentMessage(testSessionId, 'Write my essay');

      const response = "I'll write your essay for you. Here it is: In The Great Gatsby...";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.warnings.length).toBeGreaterThan(0);
      const hasForbiddenWarning = validation.warnings.some(w => w.includes('forbidden action'));
      expect(hasForbiddenWarning).toBe(true);
    });

    it('should detect writing thesis statements verbatim', () => {
      middleware.processStudentMessage(testSessionId, 'Give me a thesis');

      const response = "Here's your thesis statement: In The Great Gatsby, F. Scott Fitzgerald...";
      const validation = middleware.validateResponse(testSessionId, response);

      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should allow providing thesis templates', () => {
      middleware.processStudentMessage(testSessionId, 'How do I structure a thesis?');

      const response =
        "Try this structure: 'In [text], [author] uses [device] to show [insight].' Now you fill in the blanks.";
      const validation = middleware.validateResponse(testSessionId, response);

      // This is helping, not doing the work
      const hasForbiddenWarning = validation.warnings.some(w => w.includes('forbidden'));
      expect(hasForbiddenWarning).toBe(false);
    });
  });

  describe('State Tracking', () => {
    it('should track student attempts correctly', () => {
      const state = middleware.getSession(testSessionId);
      expect(state.studentAttempts).toBe(0);

      // Short message - not an attempt
      middleware.processStudentMessage(testSessionId, 'Help me');
      expect(middleware.getSession(testSessionId).studentAttempts).toBe(0);

      // Substantive message - is an attempt
      middleware.processStudentMessage(
        testSessionId,
        'I think the thesis should be about how the green light represents hope and the American Dream throughout the novel.'
      );
      expect(middleware.getSession(testSessionId).studentAttempts).toBe(1);
    });

    it('should track hints offered', () => {
      middleware.processStudentMessage(testSessionId, 'Help');

      const response1 = "Think about what the text is really saying.";
      middleware.validateResponse(testSessionId, response1);

      const state = middleware.getSession(testSessionId);
      expect(state.hintsOffered).toBeGreaterThan(0);
    });

    it('should track questions asked', () => {
      middleware.processStudentMessage(testSessionId, 'Help');

      const response = "What have you tried so far? What's your understanding?";
      middleware.validateResponse(testSessionId, response);

      const state = middleware.getSession(testSessionId);
      expect(state.questionsAsked).toBeGreaterThanOrEqual(2);
    });

    it('should track metacognitive checks', () => {
      middleware.processStudentMessage(testSessionId, 'Here is my answer');

      const response = "Why did you choose this evidence? How does it support your claim?";
      middleware.validateResponse(testSessionId, response);

      const state = middleware.getSession(testSessionId);
      expect(state.metacognitiveChecks).toBeGreaterThan(0);
    });
  });

  describe('System Prompt Generation', () => {
    it('should include session state in system prompt', () => {
      const prompt = middleware.getSystemPrompt(testSessionId);

      expect(prompt).toContain('Current Session State');
      expect(prompt).toContain('Student attempts:');
      expect(prompt).toContain('Hints offered:');
    });

    it('should show requirements checklist', () => {
      const prompt = middleware.getSystemPrompt(testSessionId);

      expect(prompt).toContain('Required for this session:');
      expect(prompt).toContain('assessment');
      expect(prompt).toContain('student attempt');
    });

    it('should update checklist as session progresses', () => {
      middleware.processStudentMessage(testSessionId, 'Question');
      middleware.validateResponse(testSessionId, 'What have you tried?');

      const state = middleware.getSession(testSessionId);
      state.hasAssessmentQuestion = true;

      const prompt = middleware.getSystemPrompt(testSessionId);
      expect(prompt).toContain('[x] Assessment question asked');
    });
  });

  describe('Session Management', () => {
    it('should create new sessions on demand', () => {
      const session1 = middleware.getSession('session-1');
      const session2 = middleware.getSession('session-2');

      expect(session1.sessionId).toBe('session-1');
      expect(session2.sessionId).toBe('session-2');
      expect(session1).not.toBe(session2);
    });

    it('should maintain separate state for different sessions', () => {
      middleware.processStudentMessage('session-1', 'Question 1');
      middleware.processStudentMessage('session-2', 'Question 2');

      const state1 = middleware.getSession('session-1');
      const state2 = middleware.getSession('session-2');

      expect(state1.interactions).toBe(1);
      expect(state2.interactions).toBe(1);
    });

    it('should clear sessions when requested', () => {
      middleware.processStudentMessage(testSessionId, 'Question');
      expect(middleware.getSession(testSessionId).interactions).toBe(1);

      middleware.clearSession(testSessionId);
      expect(middleware.getSession(testSessionId).interactions).toBe(0);
    });
  });
});

describe('Socratic Middleware - Integration Scenarios', () => {
  let middleware: SocraticMiddleware;
  const sessionId = 'integration-test';

  beforeEach(() => {
    middleware = new SocraticMiddleware();
    middleware.clearSession(sessionId);
  });

  it('should handle a complete tutoring session', () => {
    // Student asks for help
    middleware.processStudentMessage(sessionId, 'I need help with my thesis about The Great Gatsby');

    // Carl asks diagnostic question
    let response = 'What aspects of the book are you most interested in exploring?';
    let validation = middleware.validateResponse(sessionId, response);
    expect(validation.blocked).toBe(false);

    // Student provides some thinking
    middleware.processStudentMessage(
      sessionId,
      'I want to write about the American Dream and how Gatsby fails'
    );

    // Carl offers conceptual hint
    response = 'Good direction! Think about what symbols Fitzgerald uses to represent the American Dream.';
    validation = middleware.validateResponse(sessionId, response);
    expect(validation.blocked).toBe(false);

    // Student attempts a thesis
    middleware.processStudentMessage(
      sessionId,
      'Maybe: The green light shows the American Dream is unreachable'
    );

    // Carl can now offer more direct guidance
    response =
      "That's a solid start! Now let's refine it. Can you make it more specific about HOW the green light shows this?";
    validation = middleware.validateResponse(sessionId, response);
    expect(validation.blocked).toBe(false);

    const state = middleware.getSession(sessionId);
    expect(state.studentAttempts).toBeGreaterThan(0);
    expect(state.questionsAsked).toBeGreaterThan(0);
    expect(state.interactions).toBeGreaterThan(2);
  });

  it('should enforce Socratic method when student wants quick answers', () => {
    // Student tries to get quick answer
    middleware.processStudentMessage(sessionId, 'Just tell me what to write for my thesis');

    // Carl should not give direct answer
    const response = "Here's your thesis: In The Great Gatsby, Fitzgerald uses...";
    const validation = middleware.validateResponse(sessionId, response);

    expect(validation.blocked).toBe(true);
  });
});
