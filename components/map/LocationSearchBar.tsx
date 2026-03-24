'use client'

import { useRef, useEffect } from 'react'
import type { LocationSearchResult, LocationPoint } from './useLocationSearch'

interface Props {
  query: string
  results: LocationSearchResult[]
  selectedPoint: LocationPoint | null
  onQueryChange: (q: string) => void
  onSelect: (r: LocationSearchResult) => void
  onClear: () => void
}

export default function LocationSearchBar({
  query, results, selectedPoint, onQueryChange, onSelect, onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 결과 닫기
  useEffect(() => {
    if (results.length === 0) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // 결과는 hook이 관리하므로 빈 쿼리 아닐 땐 그냥 닫힘 (선택 없이 포커스 해제)
        // 강제 닫기는 하지 않음 — 사용자가 다시 클릭하면 다시 뜸
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [results.length])

  const isActive = selectedPoint !== null

  return (
    <div ref={containerRef} className="relative">
      {/* 입력창 */}
      <div className={[
        'flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.18)] border transition-colors',
        isActive ? 'border-blue-300' : 'border-black/10',
      ].join(' ')}>
        {/* 검색 아이콘 */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={isActive ? '#3B82F6' : '#9CA3AF'}
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="지명, 동이름, 주소로 위치 찾기"
          className="flex-1 text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none min-w-0"
        />

        {query && (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
            aria-label="검색 초기화"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* 자동완성 드롭다운 */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] overflow-hidden z-[210]">
          {results.map(r => (
            <button
              key={r.id}
              onMouseDown={e => { e.preventDefault(); onSelect(r) }}
              className="flex flex-col items-start w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-black/5 last:border-0"
            >
              <span className="text-xs font-medium text-gray-800 truncate w-full">
                {r.placeName || r.addressName}
              </span>
              {r.placeName && r.addressName && (
                <span className="text-[10px] text-gray-400 truncate w-full mt-0.5">
                  {r.addressName}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
