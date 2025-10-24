'use client';

import { useState, useRef, useEffect } from 'react';
import HintStepper from './components/HintStepper';
import YouTubeEmbed from './components/YouTubeEmbed';
import { parseHints } from './utils/hintParser';
import { parseVideos, isYouTubeEnabled } from './utils/youtubeParser';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SessionState {
  studentAttempts: number;
  hintsOffered: number;
  questionsAsked: number;
  metacognitiveChecks: number;
  interactions: number;
  currentHintTier: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm Professor Carl, your English tutor. I'm here for office hours to help you develop your critical thinking and writing skills. What are you working on today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('carl_chat_messages');
      const savedSessionId = localStorage.getItem('carl_session_id');

      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }

      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } catch (error) {
      console.error('Failed to load chat from localStorage:', error);
    }
  }, []);

  // Save chat to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('carl_chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat to localStorage:', error);
    }
  }, [messages]);

  // Save sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      try {
        localStorage.setItem('carl_session_id', sessionId);
      } catch (error) {
        console.error('Failed to save sessionId to localStorage:', error);
      }
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    if (confirm('Are you sure you want to start a new conversation? This will clear all messages.')) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hi! I'm Professor Carl, your English tutor. I'm here for office hours to help you develop your critical thinking and writing skills. What are you working on today?",
        },
      ]);
      setSessionId('');
      setSessionState(null);
      localStorage.removeItem('carl_chat_messages');
      localStorage.removeItem('carl_session_id');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          sessionId: sessionId || undefined,
        }),
      });

      // Handle rate limiting FIRST (before parsing JSON)
      if (response.status === 429) {
        let retryMinutes = 5;
        try {
          const data = await response.json();
          retryMinutes = data.retryAfter
            ? Math.ceil(data.retryAfter / 60)
            : 5;
        } catch {
          // If JSON parsing fails, use default
        }
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: `Hey there! I need to slow down for a moment. Too many requests.\n\nPlease wait about ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''} before sending more messages. This helps keep the service running smoothly for everyone during testing.\n\nIn the meantime, try reviewing your notes or thinking through your question!`,
          },
        ]);
        return; // Don't continue, just show the message
      }

      // Now parse JSON for other responses
      const data = await response.json();

      if (!response.ok) {
        // Handle blocked responses with fallback
        if (data.fallback) {
          setMessages([
            ...newMessages,
            { role: 'assistant', content: data.fallback },
          ]);
        } else {
          throw new Error(data.error || 'Failed to get response');
        }
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.message },
        ]);
        setSessionId(data.sessionId);
        setSessionState(data.sessionState);

        // Show warnings in console for debugging
        if (data.warnings?.length > 0) {
          console.warn('Socratic warnings:', data.warnings);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Could you try again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Professor Carl
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Socratic English Tutor • Office Hours
              </p>
            </div>
            <div className="flex items-center gap-4">
              {sessionState && (
                <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
                  <span>Session: {sessionState.interactions} interactions</span>
                  <span>
                    Progress: {sessionState.studentAttempts} attempts,{' '}
                    {sessionState.hintsOffered} hints
                  </span>
                </div>
              )}
              <button
                onClick={clearChat}
                className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                title="Start a new conversation"
              >
                New Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col px-4 py-6 sm:px-6 lg:px-8">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message, index) => {
              // Parse hints from Carl's messages
              const parsedMessage =
                message.role === 'assistant' ? parseHints(message.content) : null;

              // Parse videos from Carl's messages (safely - won't break if it fails)
              let parsedVideos = null;
              try {
                parsedVideos =
                  message.role === 'assistant' && isYouTubeEnabled()
                    ? parseVideos(message.content)
                    : null;
              } catch (error) {
                console.warn('Failed to parse videos:', error);
                // Continue without videos if parsing fails
              }

              return (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user' ? 'rounded-2xl px-4 py-3 bg-indigo-600 text-white' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <>
                        {/* Carl's message header */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                            PC
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Professor Carl
                          </span>
                        </div>

                        {/* Regular message content */}
                        {parsedMessage && parsedMessage.remainingContent && (
                          <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {parsedMessage.remainingContent.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hint Stepper (if hints detected) */}
                        {parsedMessage && parsedMessage.hasHints && (
                          <HintStepper hints={parsedMessage.hints} />
                        )}

                        {/* YouTube Videos (if detected) */}
                        {parsedVideos && parsedVideos.hasVideos && (
                          <div className="mt-3">
                            {parsedVideos.videos.map((video, videoIndex) => (
                              <YouTubeEmbed
                                key={videoIndex}
                                videoId={video.videoId}
                                title={video.title}
                                description={video.description}
                              />
                            ))}
                          </div>
                        )}

                        {/* Fallback if no hints detected */}
                        {!parsedMessage?.hasHints && !parsedMessage?.remainingContent && (
                          <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {message.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* User messages */}
                    {message.role === 'user' && (
                      <div className="prose prose-sm max-w-none dark:prose-invert text-white">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question or share your work..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                📚 Tip: Share your drafts, questions, or ideas for feedback
              </span>
              {sessionState && sessionState.studentAttempts === 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  Share your attempt first!
                </span>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Professor Carl uses the Socratic method - I&apos;ll guide you with
            questions, not give you answers. All conversations support academic
            integrity.
          </p>
        </div>
      </footer>
    </div>
  );
}
