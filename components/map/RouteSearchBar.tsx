'use client'

import { useState, useCallback } from 'react'
import { RouteData } from '../route/useRoute'

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`
}
function fmtTime(s: number): string {
  const min = Math.round(s / 60)
  return min >= 60 ? `${Math.floor(min / 60)}시간 ${min % 60}분` : `${min}분`
}

interface Props {
  routes: RouteData[]
  routeCctvMap: Record<string, number>  // routeId → CCTV 개수
  isLoading: boolean
  error: string | null
  onSearch: (origin: string, dest: string) => void
  onSelectRoute: (routeId: string) => void
  onClear: () => void
}

export default function RouteSearchBar({
  routes,
  routeCctvMap,
  isLoading,
  error,
  onSearch,
  onSelectRoute,
  onClear,
}: Props) {
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')

  const handleSearch = useCallback(() => {
    const o = origin.trim()
    const d = dest.trim()
    if (!o || !d) return
    onSearch(o, d)
  }, [origin, dest, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleClear = () => {
    onClear()
    setOrigin('')
    setDest('')
  }

  return (
    <div
      className="absolute top-3 left-3 right-3 z-[100] flex flex-col gap-1.5"
      style={{ pointerEvents: 'auto' }}
    >
      {/* 입력 영역 */}
      <div className="flex gap-1.5 items-center">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <input
            type="text"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="출발지"
            className="w-full px-3 py-1.5 text-xs bg-white/95 border border-gray-200 rounded-lg shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 placeholder-gray-400"
          />
          <input
            type="text"
            value={dest}
            onChange={e => setDest(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="도착지"
            className="w-full px-3 py-1.5 text-xs bg-white/95 border border-gray-200 rounded-lg shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 placeholder-gray-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={handleSearch}
            disabled={isLoading || !origin.trim() || !dest.trim()}
            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap h-[58px]"
          >
            {isLoading ? (
              <svg className="animate-spin w-4 h-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <>경로<br />CCTV</>
            )}
          </button>
        </div>

        {routes.length > 0 && (
          <button
            onClick={handleClear}
            title="경로 지우기"
            className="w-8 h-[58px] flex items-center justify-center bg-white/90 hover:bg-gray-100 border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-gray-700 transition-all flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* 경로 선택 리스트 */}
      {routes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {routes.map((route, idx) => {
            const cctvCount = routeCctvMap[route.routeId] ?? 0
            return (
              <button
                key={route.routeId}
                onClick={() => onSelectRoute(route.routeId)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border transition-all whitespace-nowrap ${
                  route.isSelected
                    ? 'bg-indigo-500 text-white border-indigo-400'
                    : 'bg-white/95 text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <span className="font-bold">경로 {idx + 1}</span>
                <span className="ml-1.5 opacity-80">
                  {fmtDist(route.distance)} · {fmtTime(route.duration)} · CCTV {cctvCount}개
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
