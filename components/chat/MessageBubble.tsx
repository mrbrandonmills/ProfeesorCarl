'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[70%] p-4 rounded-2xl glass-panel',
          isUser ? 'shadow-glow-blue' : 'shadow-glow-purple'
        )}
      >
        <p className="text-white">{content}</p>
      </div>
    </motion.div>
  )
}
