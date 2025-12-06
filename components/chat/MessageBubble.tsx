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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[75%] p-5 rounded-2xl luxury-transition group',
          isUser
            ? 'glass-panel-heavy shadow-glow-blue ml-12'
            : 'glass-panel shadow-glow-purple mr-12'
        )}
      >
        {/* Elegant border highlight on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
            isUser
              ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10'
              : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10'
          )}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Role indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                isUser
                  ? 'glass-panel-light shadow-glow-blue'
                  : 'glass-panel-light shadow-glow-purple'
              )}
            >
              {isUser ? '👤' : '🎓'}
            </div>
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {isUser ? 'You' : 'Professor Carl'}
            </span>
          </div>

          {/* Message text with improved typography */}
          <p className="text-white leading-relaxed text-[15px] whitespace-pre-wrap">
            {content}
          </p>
        </div>

        {/* Subtle inner glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl pointer-events-none',
            isUser
              ? 'shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]'
              : 'shadow-[inset_0_1px_0_rgba(139,92,246,0.1)]'
          )}
        />
      </div>
    </motion.div>
  )
}
