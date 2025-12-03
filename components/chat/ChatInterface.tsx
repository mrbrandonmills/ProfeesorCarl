'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Demo messages to showcase the UI
const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hi! I'm Professor Carl. I don't give direct answers - instead, I'll guide you to discover insights through questions. What would you like to explore today?"
  }
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages([...messages, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response for demo purposes
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "That's a great question! Before I share my thoughts, let me ask you: What do you already know about this topic? What's your initial understanding?",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background aurora-bg">
      {/* Header */}
      <div className="glass-panel m-4 p-4">
        <h1 className="text-2xl font-bold text-gradient-blue-purple">Professor Carl</h1>
        <p className="text-sm text-muted-foreground">Your Socratic AI Tutor</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-lg">
              Ask me anything! I'll guide you to the answer through questions.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} role={message.role} content={message.content} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="glass-panel shadow-glow-purple p-4 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel m-4 p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your question..."
            className="resize-none glass-panel border-white/10"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="self-end shadow-glow-blue"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
