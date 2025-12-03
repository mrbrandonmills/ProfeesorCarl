'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to onboarding for demo purposes
    router.push('/onboarding')
  }, [router])

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center">
      <div className="glass-panel p-8">
        <h1 className="text-2xl font-bold text-gradient-blue-purple">
          Loading Professor Carl...
        </h1>
      </div>
    </div>
  )
}
