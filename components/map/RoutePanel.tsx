'use client'

import { useState, useRef } from 'react'
import { useRouteSearch, SearchResult } from '../route/useRouteSearch'
import { RouteData, LatLng } from '../route/useRoute'

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`
}
function fmtTime(s: number) {
  const min = Math.round(s / 60)
  return min >= 60 ? `${Math.floor(min / 60)}시간 ${min % 60}분` : `${min}분`
}

interface Props {
  mapCenter?: { lat: number; lng: number }
  routes: RouteData[]
  routeCctvMap: Record<string, number>
  isLoading: boolean
  error: string | null
  onSearch: (origin: LatLng, dest: LatLng) => void
  onSelectRoute: (routeId: string) => void
  onClear: () => void
}

const IconSwapVertical = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="7 8 12 3 17 8" />
    <line x1="12" y1="3" x2="12" y2="10" />
    <line x1="12" y1="14" x2="12" y2="21" />
    <polyline points="7 16 12 21 17 16" />
  </svg>
)
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconSpin = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)
const RouteMinIcon = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
    <div style={{ width: 1, height: 5, background: '#d1d5db' }} />
    <div style={{ width: 6, height: 6, borderRadius: 1.5, background: '#6366f1' }} />
  </div>
)

export default function RoutePanel({
  mapCenter, routes, routeCctvMap, isLoading, error,
  onSearch, onSelectRoute, onClear,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    originQuery, destQuery, setOriginQuery, setDestQuery,
    originPoint, destPoint, originResults, destResults,
    activeField, setActiveField, selectOrigin, selectDest,
    swap, clearOrigin, clearDest, clearAll, isReady,
  } = useRouteSearch(mapCenter)

  const destInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    if (!originPoint || !destPoint) return
    onSearch({ lat: originPoint.lat, lng: originPoint.lng }, { lat: destPoint.lat, lng: destPoint.lng })
    setIsExpanded(false)
  }

  const handleBlur = (field: 'origin' | 'dest') => {
    setTimeout(() => setActiveField(prev => prev === field ? null : prev), 150)
  }

  const currentResults = activeField === 'origin' ? originResults : (activeField === 'dest' ? destResults : [])
  const showDropdown = activeField !== null && currentResults.length > 0

  const handleSelectResult = (r: SearchResult) => {
    if (activeField === 'origin') {
      selectOrigin(r)
      if (!destPoint) { setActiveField('dest'); setTimeout(() => destInputRef.current?.focus(), 60) }
      else setActiveField(null)
    } else {
      selectDest(r)
      setActiveField(null)
    }
  }

  const headerLabel = (originPoint && destPoint)
    ? `${originPoint.label.split(' ').at(-1)} → ${destPoint.label.split(' ').at(-1)}`
    : '경로 설정'

  // 모바일: 155px / PC: 220px
  // 드롭다운 모바일 left = 155 + 6 = 161px, width = 지도 여백 고려 170px
  const inputRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    background: '#f8f8fb', borderRadius: 9,
    margin: '0 8px', padding: '0 8px', height: 36,
  }
  const inputStyle: React.CSSProperties = {
    flex: 1, outline: 'none', border: 'none', background: 'transparent',
    fontSize: 12, color: '#111111', caretColor: '#6366f1', minWidth: 0,
  }
  const clearBtnStyle: React.CSSProperties = {
    color: '#c0c0c8', background: 'none', border: 'none',
    cursor: 'pointer', padding: '3px', lineHeight: 0, flexShrink: 0,
  }

  return (
    // 모바일: w-[155px], PC: w-[220px]
    <div
      className="absolute top-[95px] left-3 md:top-[60px] md:left-3 z-[100] w-[155px] md:w-[220px]"
      style={{ pointerEvents: 'auto' }}
    >
      {/* ── 메인 카드 ── */}
      <div style={{
        borderRadius: 18,
        background: '#ffffff',
        border: '1px solid #e9e9ee',
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}>

        {/* 모바일 전용 접힘 헤더 */}
        <div
          className="flex items-center md:hidden cursor-pointer select-none"
          style={{ height: 44, padding: '0 10px 0 10px', gap: 8 }}
          onClick={() => setIsExpanded(v => !v)}
        >
          <RouteMinIcon />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {headerLabel}
          </span>
          {routes.length > 0 && (
            <span style={{ fontSize: 9, background: '#6366f1', color: 'white', borderRadius: 8, padding: '2px 5px', flexShrink: 0 }}>
              {routes.length}개
            </span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {isExpanded && <div className="md:hidden" style={{ height: 1, background: '#f0f0f0' }} />}

        {/* 패널 본문 */}
        <div className={isExpanded ? '' : 'hidden md:block'}>
          <div style={{ paddingTop: 8, paddingBottom: 2 }}>

            {/* 출발지 */}
            <div style={inputRowStyle}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginRight: 7 }} />
              <input
                type="text" value={originQuery}
                onChange={e => setOriginQuery(e.target.value)}
                onFocus={() => setActiveField('origin')}
                onBlur={() => handleBlur('origin')}
                placeholder="출발지" style={inputStyle}
                className="placeholder:text-[#a0a0a8]"
              />
              {(originPoint || originQuery) && (
                <button onClick={clearOrigin} style={clearBtnStyle}><IconX /></button>
              )}
            </div>

            {/* 구분 + 스왑 */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px 0 15px', height: 16 }}>
              <div style={{ width: 1.5, height: 16, background: '#e5e7eb', borderRadius: 1, flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1, background: '#f0f0f0', marginLeft: 7, marginRight: 5 }} />
              <button
                onClick={swap}
                style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  border: '1px solid #e8e8ef', background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconSwapVertical />
              </button>
            </div>

            {/* 도착지 */}
            <div style={inputRowStyle}>
              <div style={{ width: 6, height: 6, borderRadius: 1.5, background: '#6366f1', flexShrink: 0, marginRight: 7 }} />
              <input
                ref={destInputRef}
                type="text" value={destQuery}
                onChange={e => setDestQuery(e.target.value)}
                onFocus={() => setActiveField('dest')}
                onBlur={() => handleBlur('dest')}
                placeholder="도착지" style={inputStyle}
                className="placeholder:text-[#a0a0a8]"
              />
              {(destPoint || destQuery) && (
                <button onClick={clearDest} style={clearBtnStyle}><IconX /></button>
              )}
            </div>

            {/* 경로 목록 */}
            {routes.length > 0 && (
              <>
                <div style={{ height: 1, background: '#f0f0f0', margin: '8px 0 0' }} />
                {routes.map((route, idx) => {
                  const cctvCount = routeCctvMap[route.routeId] ?? 0
                  const sel = route.isSelected
                  return (
                    <button key={route.routeId} onClick={() => onSelectRoute(route.routeId)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '6px 10px',
                        borderTop: idx > 0 ? '1px solid #f5f5f5' : 'none',
                        borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                        background: sel ? '#f5f3ff' : 'transparent', cursor: 'pointer', display: 'block',
                      }}>
                      <div style={{ fontSize: 11, color: sel ? '#6366f1' : '#333', fontWeight: sel ? 700 : 500, marginBottom: 1 }}>
                        경로 {idx + 1}
                        <span style={{ fontWeight: 400, color: sel ? '#818cf8' : '#888', marginLeft: 3 }}>
                          {fmtDist(route.distance)}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: sel ? '#818cf8' : '#b0b0b8' }}>
                        {fmtTime(route.duration)} · CCTV {cctvCount}개
                      </div>
                    </button>
                  )
                })}
                <div style={{ textAlign: 'center', padding: '3px 0 0' }}>
                  <button onClick={() => { clearAll(); onClear() }}
                    style={{ fontSize: 10, color: '#b0b0b8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>
                    초기화
                  </button>
                </div>
              </>
            )}

            {/* CCTV 보기 — 항상 하단 고정 */}
            <div style={{ padding: '8px 8px 9px' }}>
              <button
                onClick={handleSearch}
                disabled={!isReady || isLoading}
                style={{
                  width: '100%', border: 'none', borderRadius: 10,
                  padding: '8px 0', fontSize: 11, fontWeight: 700,
                  cursor: isReady && !isLoading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: isReady && !isLoading ? '#6366f1' : '#efeff4',
                  color: isReady && !isLoading ? '#ffffff' : '#9a9aa3',
                  transition: 'background 0.18s, color 0.18s',
                }}
              >
                {isLoading ? <><IconSpin /> 검색 중</> : 'CCTV 보기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 드롭다운 / 에러
          모바일: 카드 우측으로 (키보드 회피), 너비 화면 여백에 맞게
          PC: 카드 아래로                                              ── */}
      {(showDropdown || (error && !showDropdown)) && (
        // 모바일: absolute right-side | PC: static below
        <div
          className="absolute top-0 md:static md:mt-1"
          style={{ left: 161 }}          // 155(card) + 6(gap)
        >
          {showDropdown && (
            <div style={{
              // 모바일: 170px (총 16+155+6+170=347px, 390px 폰 기준 여유 있음)
              // PC: 230px
              width: 170,
              borderRadius: 13, background: '#ffffff',
              border: '1px solid #e9e9ee',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: 260, overflowY: 'auto', overflowX: 'hidden',
            }}
            className="md:w-[230px]"
            >
              {currentResults.map((r, idx) => {
                const main = r.placeName || r.addressName
                const sub = [r.roadAddressName, r.placeName ? r.addressName : ''].filter(Boolean).join(' · ')
                return (
                  <button key={r.id}
                    onPointerDown={e => { e.preventDefault(); handleSelectResult(r) }}
                    className="hover:bg-[#f8f8fb] transition-colors w-full text-left"
                    style={{
                      padding: '9px 11px', minHeight: 44,
                      borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none',
                      borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
                      background: 'transparent', cursor: 'pointer', display: 'block',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#111111', fontWeight: 500, lineHeight: 1.3, marginBottom: sub ? 2 : 0 }}>{main}</div>
                    {sub && <div style={{ fontSize: 10, color: '#555555', lineHeight: 1.4 }}>{sub}</div>}
                  </button>
                )
              })}
            </div>
          )}

          {error && !showDropdown && (
            <div style={{ width: 170, padding: '7px 10px', borderRadius: 11, background: '#fef2f2', border: '1px solid #fecaca' }}
              className="md:w-[220px]">
              <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
