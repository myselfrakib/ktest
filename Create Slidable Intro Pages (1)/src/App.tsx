import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type TouchEvent,
} from 'react'

const SLIDES = [
  {
    id: 1,
    tag: "01 — Welcome",
    headline: "Let's Collab,",
    headlineAccent: "Kolkata!",
    sub: "Kolkata's first hyperlocal platform for creators, PR collabs, and brand deals — built by the city, for the city.",
    img: 'https://images.unsplash.com/photo-1766676219472-bafcced3b3f7?w=900&h=1200&fit=crop&auto=format&q=80',
    alt: 'Howrah Bridge at sunset',
  },
  {
    id: 2,
    tag: "02 — Community",
    headline: "The City Is",
    headlineAccent: "Your Team.",
    sub: "From Park Street to New Town — every corner of Kolkata has a creator ready to collaborate with you.",
    img: 'https://images.unsplash.com/photo-1737391591935-b10cec322512?w=900&h=1200&fit=crop&auto=format&q=80',
    alt: 'Kolkata street community',
  },
  {
    id: 3,
    tag: "03 — Creators",
    headline: "Find Your",
    headlineAccent: "Crew.",
    sub: "Photographers, stylists, writers, reels creators — find your people and make things happen together.",
    img: 'https://images.unsplash.com/photo-1683826219617-26301021c590?w=900&h=1200&fit=crop&auto=format&q=80',
    alt: 'Creators collaborating',
  },
  {
    id: 4,
    tag: "04 — Growth",
    headline: "Grow",
    headlineAccent: "Together.",
    sub: "Land real brand deals, paid gigs, and PR collabs. Build your name right here in Kolkata.",
    img: 'https://images.unsplash.com/photo-1782187859788-c00888c7e277?w=900&h=1200&fit=crop&auto=format&q=80',
    alt: 'Kolkata river at dawn',
  },
]

const BLUE = '#2b4ef7'

// ── slide ──────────────────────────────────────────────────────────────────────
function SlideScreen({
  slide,
  onNext,
  onSkip,
  current,
  total,
}: {
  slide: (typeof SLIDES)[0]
  onNext: () => void
  onSkip: () => void
  current: number
  total: number
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(false)
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [slide.id])

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>

      {/* full-bleed image */}
      <img
        src={slide.img}
        alt={slide.alt}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transition: 'opacity 0.5s ease',
          opacity: mounted ? 1 : 0,
        }}
      />

      {/* gradient: dark at top fading, then clear middle, then strong at bottom */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 40%, rgba(10,14,30,0.72) 70%, rgba(8,10,24,0.96) 100%)',
      }} />

      {/* top bar — floats over image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '52px 28px 0',
      }}>
        <span style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
        }}>
          {slide.tag}
        </span>
        <button
          onClick={onSkip}
          style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 99,
            padding: '6px 16px',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          Skip
        </button>
      </div>

      {/* bottom content panel */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '40px 28px 44px',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
      }}>

        {/* headline */}
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 56,
          lineHeight: 1.0,
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
          color: '#fff',
        }}>
          <span style={{ display: 'block' }}>{slide.headline}</span>
          <span style={{ display: 'block', color: '#7fa3ff' }}>{slide.headlineAccent}</span>
        </h1>

        {/* sub */}
        <p style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: 14,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.6)',
          margin: '0 0 36px',
          maxWidth: 300,
        }}>
          {slide.sub}
        </p>

        {/* nav row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* progress dots */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === current ? 24 : 7,
                  height: 7,
                  borderRadius: 99,
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.35s ease',
                }}
              />
            ))}
          </div>

          {/* next */}
          <button
            onClick={onNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: BLUE,
              border: 'none',
              borderRadius: 99,
              padding: '13px 24px',
              color: '#fff',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 28px rgba(43,78,247,0.5)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)'
              e.currentTarget.style.boxShadow = '0 12px 36px rgba(43,78,247,0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(43,78,247,0.5)'
            }}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── auth ───────────────────────────────────────────────────────────────────────
function AuthScreen({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')

  const field: CSSProperties = {
    width: '100%',
    padding: '15px 18px',
    borderRadius: 16,
    border: '1.5px solid #e2e6f5',
    background: '#f0f2fc',
    fontSize: 14,
    color: '#0a1628',
    fontFamily: "'Instrument Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  }

  return (
    <div style={{
      height: '100%',
      background: '#f5f7ff',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 28px',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* decorative blue arc top-right */}
      <div style={{
        position: 'absolute',
        top: -80,
        right: -80,
        width: 240,
        height: 240,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(43,78,247,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at center, rgba(157,200,255,0.45) 1.2px, transparent 1.4px)',
        backgroundSize: '18px 18px',
        backgroundPosition: 'center',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* back */}
        <button
          onClick={onBack}
          style={{
            marginTop: 56,
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#adb3cc',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 13,
            padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="#adb3cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        {/* brand */}
        <div style={{ marginTop: 36, marginBottom: 32 }}>
          <p style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: BLUE,
            marginBottom: 10,
          }}>
            Kreator Kolkata
          </p>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 38,
            color: '#0a1628',
            margin: '0 0 10px',
            lineHeight: 1.1,
          }}>
            {mode === 'signup' ? 'Join the\nmovement.' : 'Welcome\nback.'}
          </h2>
          <p style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 13,
            color: '#9097b4',
            margin: 0,
          }}>
            {mode === 'signup' ? 'Create account. Fill your profile later.' : 'Good to see you again, creator.'}
          </p>
        </div>

        {/* toggle */}
        <div style={{
          display: 'flex',
          background: '#e8eaf5',
          borderRadius: 14,
          padding: 4,
          marginBottom: 24,
        }}>
          {(['signup', 'login'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 11,
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#0a1628' : '#adb3cc',
              boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}>
              {m === 'signup' ? 'Sign Up' : 'Log In'}
            </button>
          ))}
        </div>

        {/* inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={field}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BLUE
                e.currentTarget.style.background = '#fff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e6f5'
                e.currentTarget.style.background = '#f0f2fc'
              }}
            />
          )}
          <input
            type="text"
            placeholder="Mobile number or email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={field}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = BLUE
              e.currentTarget.style.background = '#fff'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e6f5'
              e.currentTarget.style.background = '#f0f2fc'
            }}
          />
        </div>

        {/* cta */}
        <button style={{
          marginTop: 24,
          width: '100%',
          padding: '16px 0',
          borderRadius: 16,
          border: 'none',
          background: BLUE,
          color: '#fff',
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(43,78,247,0.28)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 14px 36px rgba(43,78,247,0.36)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(43,78,247,0.28)'
          }}
        >
          {mode === 'signup' ? 'Create Account →' : 'Continue →'}
        </button>

        <p style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontSize: 12,
          color: '#c0c6dc',
          textAlign: 'center',
          marginTop: 18,
        }}>
          Profile can always be completed later.
        </p>
      </div>
    </div>
  )
}

// ── root ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && page < SLIDES.length) setPage((p) => Math.min(p + 1, SLIDES.length))
      else if (diff < 0 && page > 0) setPage((p) => Math.max(p - 1, 0))
    }
    touchStartX.current = null
  }

  const isAuth = page === SLIDES.length

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#d8ddf0',
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100svh',
          maxHeight: 820,
          borderRadius: 40,
          overflow: 'hidden',
          boxShadow: '0 48px 120px rgba(10,22,40,0.22)',
          position: 'relative',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isAuth ? (
          <AuthScreen onBack={() => setPage(SLIDES.length - 1)} />
        ) : (
          <SlideScreen
            slide={SLIDES[page]}
            onNext={() => setPage((p) => Math.min(p + 1, SLIDES.length))}
            onSkip={() => setPage(SLIDES.length)}
            current={page}
            total={SLIDES.length}
          />
        )}
      </div>
    </div>
  )
}
