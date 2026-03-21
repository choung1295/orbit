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
function MoonSvg({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="moon-g" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill={active ? '#00FFA3' : '#555566'}
        filter={active ? 'url(#moon-g)' : undefined}
      />
    </svg>
  )
}

// ── 태양 아이콘 (흰 배경에서도 잘 보이는 진한 앰버) ───────────────────────
function SunSvg({ active }: { active: boolean }) {
  const c = active ? '#D97706' : '#9ca3af'
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sun-g" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={active ? 'url(#sun-g)' : undefined}>
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
  const { variant, setVariant, theme } = useTheme()
  const isDark = variant === 'dark'
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const d = theme.isDark

  // 외부 클릭 시 닫기
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

  // 다크로 전환되면 picker 닫기
  useEffect(() => {
    if (isDark) setPickerOpen(false)
  }, [isDark])

  const handleDark = () => {
    if (!isDark) {
      localStorage.setItem(LAST_LIGHT_KEY, variant)
      setVariant('dark')
    }
  }

  const handleLight = () => {
    if (isDark) {
      // 마지막 라이트 색상 복원 (light-white는 선택지에 없으므로 light-green으로 대체)
      const last = localStorage.getItem(LAST_LIGHT_KEY) as BgVariant | null
      const safe = LIGHT_OPTIONS.find(o => o.variant === last) ? last! : 'light-green'
      setVariant(safe)
      setPickerOpen(true)
    } else {
      setPickerOpen(v => !v)
    }
  }

  const handlePickColor = (v: BgVariant) => {
    setVariant(v)
    localStorage.setItem(LAST_LIGHT_KEY, v)
    setPickerOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── 토글 pill ── */}
      <div
        role="group"
        aria-label="다크/라이트 모드 전환"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 82,
          height: 34,
          borderRadius: 99,
          padding: 3,
          background: d ? '#14141d' : '#e2e2ea',
          border: d ? '1px solid #28283e' : '1px solid #c4c4d2',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* 슬라이딩 인디케이터 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 3,
            left: isDark ? 41 : 3,
            width: 34,
            height: 26,
            borderRadius: 99,
            background: isDark
              ? 'linear-gradient(135deg, #ffffff 0%, #faf6ef 100%)'
              : 'linear-gradient(135deg, #151d2e 0%, #0c1220 100%)',
            boxShadow: isDark
              ? '0 0 10px rgba(217,119,6,0.22), 0 2px 6px rgba(0,0,0,0.10)'
              : '0 0 10px rgba(0,255,163,0.22), 0 2px 8px rgba(0,0,0,0.5)',
            transition: 'left 0.26s cubic-bezier(0.4,0,0.2,1)',
          }}
        />

        {/* 달 버튼 */}
        <button
          onClick={handleDark}
          aria-label="다크 모드"
          aria-pressed={isDark}
          style={{
            position: 'relative', zIndex: 1,
            width: 38, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none',
            cursor: isDark ? 'default' : 'pointer',
            padding: 0,
            transform: !isDark ? 'scale(1.1)' : 'scale(0.86)',
            opacity: !isDark ? 1 : 0.48,
            transition: 'transform 0.22s ease, opacity 0.22s ease',
          }}
        >
          <MoonSvg active={!isDark} />
        </button>

        {/* 해 버튼 */}
        <button
          onClick={handleLight}
          aria-label="라이트 모드"
          aria-pressed={!isDark}
          style={{
            position: 'relative', zIndex: 1,
            width: 38, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none',
            cursor: 'pointer',
            padding: 0,
            transform: isDark ? 'scale(1.1)' : 'scale(0.86)',
            opacity: isDark ? 1 : 0.48,
            transition: 'transform 0.22s ease, opacity 0.22s ease',
          }}
        >
          <SunSvg active={isDark} />
        </button>
      </div>

      {/* ── 컬러 선택창 (작은 원형 4개) ── */}
      <div
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
