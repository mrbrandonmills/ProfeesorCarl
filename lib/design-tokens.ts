/**
 * PROFESSOR CARL - LUXURY DESIGN SYSTEM
 * Museum-quality design tokens inspired by Apple, Stripe, Linear
 */

export const designTokens = {
  // PREMIUM COLOR PALETTE
  colors: {
    // Deep, sophisticated backgrounds
    cosmic: {
      900: '#0A0A0F', // Deep space
      800: '#111118', // Midnight
      700: '#1A1A24', // Twilight
      600: '#252532', // Dusk
    },
    // Elegant accent colors
    luxury: {
      gold: '#D4AF37',
      goldGlow: 'rgba(212, 175, 55, 0.3)',
      rose: '#E5D3E1',
      champagne: '#F7E7CE',
    },
    // Refined gradients
    gradients: {
      hero: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(59, 130, 246, 0.15) 100%)',
      card: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
      text: 'linear-gradient(135deg, #D4AF37 0%, #F7E7CE 50%, #FFE5B4 100%)',
      premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      aurora: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15), transparent), radial-gradient(ellipse 80% 50% at 50% 120%, rgba(139, 92, 246, 0.15), transparent)',
    },
  },

  // EDITORIAL TYPOGRAPHY
  typography: {
    fontFamilies: {
      display: 'var(--font-cormorant)', // Elegant serif for headlines
      body: 'var(--font-inter)', // Clean sans for body
      mono: 'var(--font-jetbrains-mono)', // Technical elements
    },
    scale: {
      hero: {
        size: 'clamp(3rem, 8vw, 6rem)',
        weight: 300,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
      },
      h1: {
        size: 'clamp(2.5rem, 5vw, 4rem)',
        weight: 300,
        lineHeight: 1.15,
        letterSpacing: '-0.025em',
      },
      h2: {
        size: 'clamp(2rem, 4vw, 3rem)',
        weight: 400,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h3: {
        size: 'clamp(1.5rem, 3vw, 2rem)',
        weight: 500,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      body: {
        size: '1rem',
        weight: 400,
        lineHeight: 1.6,
        letterSpacing: '0',
      },
      caption: {
        size: '0.875rem',
        weight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.01em',
      },
    },
  },

  // LUXURY SPACING SYSTEM
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
    '6xl': '12rem',   // 192px
  },

  // SOPHISTICATED SHADOWS
  shadows: {
    luxury: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
      md: '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
      xl: '0 16px 64px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4)',
    },
    glow: {
      gold: '0 0 24px rgba(212, 175, 55, 0.4), 0 0 48px rgba(212, 175, 55, 0.2)',
      purple: '0 0 24px rgba(139, 92, 246, 0.4), 0 0 48px rgba(139, 92, 246, 0.2)',
      blue: '0 0 24px rgba(59, 130, 246, 0.4), 0 0 48px rgba(59, 130, 246, 0.2)',
    },
  },

  // CINEMATIC ANIMATIONS
  animations: {
    timing: {
      instant: 100,
      fast: 200,
      normal: 400,
      slow: 600,
      cinematic: 1000,
    },
    easing: {
      luxury: 'cubic-bezier(0.22, 1, 0.36, 1)', // Smooth, premium feel
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // GLASS MORPHISM SYSTEM
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: '24px',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.15)',
      blur: '32px',
    },
    heavy: {
      background: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.2)',
      blur: '40px',
    },
  },

  // BREAKPOINTS
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}

// ANIMATION VARIANTS FOR FRAMER MOTION
export const animationVariants = {
  // Page transitions
  pageEnter: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },

  // Stagger children
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  // Individual items
  item: {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  },

  // Luxury hover
  luxuryHover: {
    rest: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    tap: { scale: 0.98 },
  },

  // Fade in from bottom
  fadeInUp: {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },

  // Scale in
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export type DesignTokens = typeof designTokens
