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
          'relative max-w-[75%] p-5 rounded-2xl transition-all duration-300 group',
          isUser
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg ml-12'
            : 'bg-white border border-slate-200 text-slate-900 shadow-sm hover:shadow-md mr-12'
        )}
      >
        {/* Elegant border highlight on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
            isUser
              ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10'
              : 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50'
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
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-blue-50 border border-blue-100'
              )}
            >
              {isUser ? '👤' : '🎓'}
            </div>
            <span
              className={cn(
                'text-xs font-medium uppercase tracking-wider',
                isUser ? 'text-white/70' : 'text-slate-500'
              )}
            >
              {isUser ? 'You' : 'Professor Carl'}
            </span>
          </div>

          {/* Message text with improved typography */}
          <p
            className={cn(
              'leading-relaxed text-[15px] whitespace-pre-wrap',
              isUser ? 'text-white' : 'text-slate-900'
            )}
          >
            {content}
          </p>
        </div>

        {/* Subtle inner highlight effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl pointer-events-none',
            isUser
              ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
              : 'shadow-[inset_0_1px_0_rgba(148,163,184,0.05)]'
          )}
        />
      </div>
    </motion.div>
  )
}
