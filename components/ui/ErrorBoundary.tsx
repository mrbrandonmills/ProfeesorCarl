'use client'

import React, { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen aurora-bg-hero flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl w-full"
          >
            {/* Error Card */}
            <div className="glass-panel-heavy p-12 rounded-3xl text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-panel-light mb-8"
              >
                <AlertCircle className="w-10 h-10 text-[#D4AF37]" />
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-hero font-light mb-4"
              >
                <span className="text-gradient-gold">Something Unexpected</span>
                <br />
                <span className="text-white">Happened</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-luxury-body text-white/70 mb-8"
              >
                We encountered an unexpected error. Don't worry—your learning
                journey is still intact. Let's get you back on track.
              </motion.p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="glass-panel p-4 rounded-xl mb-8 text-left"
                >
                  <p className="text-xs font-mono text-red-400 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-white/40 mt-2">
                      <summary className="cursor-pointer hover:text-white/60 transition-colors">
                        Component Stack
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  onClick={this.handleReset}
                  size="lg"
                  className="group glass-panel-heavy hover:glass-hover border-white/20 text-white px-8 py-6 h-auto shadow-glow-gold luxury-transition"
                >
                  <span className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Try Again
                  </span>
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  size="lg"
                  variant="outline"
                  className="glass-panel hover:glass-hover border-white/20 text-white px-8 py-6 h-auto luxury-transition"
                >
                  <span className="flex items-center gap-3">
                    <Home className="w-5 h-5" />
                    Go Home
                  </span>
                </Button>
              </motion.div>
            </div>

            {/* Subtle hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center text-white/40 text-sm mt-6"
            >
              If this persists, please contact support
            </motion.p>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}
