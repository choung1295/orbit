'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/components/chat/ThemeContext'
import type { BgVariant } from '@/lib/theme'

const LAST_LIGHT_KEY = 'orbit-last-light'

const LIGHT_OPTIONS: { variant: BgVariant; bg: string; ring: string; label: string }[] = [
  { variant: 'light-green', bg: '#F3F9F5', ring: '#A7D9B5', label: '그린' },
  { variant: 'light-red',   bg: '#FAF3F3', ring: '#F0B8B8', label: '레드' },
  { variant: 'light-beige', bg: '#F7F4ED', ring: '#DDD5B8', label: '베이지' },
  { variant: 'light-blue',  bg: '#F2F6FA', ring: '#A8C8E8', label: '블루' },
]

// ── 반달 아이콘 ──────────────────────────────────────────────────────────────
function MoonSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="moon-g" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="#00FFA3"
        filter="url(#moon-g)"
      />
    </svg>
  )
}

// ── 태양 아이콘 ───────────────────────────────────────────────────────────────
function SunSvg() {
  const c = '#D97706'
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sun-g" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#sun-g)">
        <circle cx="12" cy="12" r="4.5" fill={c} />
        {rays.map(deg => {
          const r = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={12 + 7.2 * Math.cos(r)} y1={12 + 7.2 * Math.sin(r)}
              x2={12 + 10.2 * Math.cos(r)} y2={12 + 10.2 * Math.sin(r)}
              stroke={c} strokeWidth="1.9" strokeLinecap="round"
            />
          )
        })}
      </g>
    </svg>
  )
}

// ── 메인 토글 컴포넌트 ────────────────────────────────────────────────────────
export default function ThemeToggle() {
  const { variant, setVariant } = useTheme()
  const isDark = variant === 'dark'
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startAutoClose = () => {
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    autoCloseRef.current = setTimeout(() => setPickerOpen(false), 3000)
  }
  const cancelAutoClose = () => {
    if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null }
  }

  useEffect(() => {
    if (pickerOpen) startAutoClose()
    else cancelAutoClose()
    return () => cancelAutoClose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen])

  useEffect(() => {
    if (!pickerOpen) return
    const fn = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [pickerOpen])

  useEffect(() => {
    if (isDark) setPickerOpen(false)
  }, [isDark])

  const handleToggle = () => {
    if (isDark) {
      // 다크 → 라이트
      const last = localStorage.getItem(LAST_LIGHT_KEY) as BgVariant | null
      const safe = LIGHT_OPTIONS.find(o => o.variant === last) ? last! : 'light-green'
      setVariant(safe)
      setPickerOpen(true)
    } else {
      // 라이트 → 다크
      localStorage.setItem(LAST_LIGHT_KEY, variant)
      setVariant('dark')
    }
  }

  const handlePickColor = (v: BgVariant) => {
    setVariant(v)
    localStorage.setItem(LAST_LIGHT_KEY, v)
    setPickerOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── 단일 원형 버튼 ── */}
      <button
        onClick={handleToggle}
        aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? '#e8e8f0' : '#14141d',
          border: isDark ? '1px solid #c4c4d2' : '1px solid #28283e',
          boxShadow: isDark
            ? '0 0 10px rgba(217,119,6,0.18), 0 2px 6px rgba(0,0,0,0.10)'
            : '0 0 10px rgba(0,255,163,0.15), 0 2px 8px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 0.22s ease, box-shadow 0.22s ease',
        }}
      >
        {isDark ? <SunSvg /> : <MoonSvg />}
      </button>

      {/* ── 컬러 선택창 (라이트 전환 시 표시) ── */}
      <div
        onMouseEnter={cancelAutoClose}
        onMouseLeave={startAutoClose}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #e4e4ec',
          boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
          padding: pickerOpen && !isDark ? '5px 8px' : '0 8px',
          maxHeight: pickerOpen && !isDark ? 40 : 0,
          opacity: pickerOpen && !isDark ? 1 : 0,
          transform: pickerOpen && !isDark ? 'translateY(0px)' : 'translateY(-6px)',
          transition: [
            'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
            'opacity 0.22s ease',
            'transform 0.22s ease',
            'padding 0.28s ease',
          ].join(', '),
          overflow: 'hidden',
          pointerEvents: pickerOpen && !isDark ? 'auto' : 'none',
          zIndex: 200,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {LIGHT_OPTIONS.map(({ variant: v, bg, ring, label }) => {
          const selected = variant === v
          return (
            <button
              key={v}
              onClick={() => handlePickColor(v)}
              title={label}
              aria-label={label}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: bg,
                border: selected ? '2px solid #6366f1' : `1.5px solid ${ring}`,
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: selected ? 'scale(1.18)' : 'scale(1)',
                boxShadow: selected
                  ? '0 0 0 2px rgba(99,102,241,0.22)'
                  : '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {selected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <polyline points="20 6 9 17 4 12" stroke="#6366f1" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
