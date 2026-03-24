'use client'

/**
 * 시내 CCTV 실시간 상태 체크 훅
 *
 * 서버(/api/traffic/city-cctv-check)를 통해 UTIC 스트림 페이지에 GET 요청.
 * HTTP 200 = 정상, 500 = 점검중. HEAD는 UTIC이 지원하지 않으므로 GET 사용.
 * Vercel ICN1(서울) 리전에서 요청 → 한국 IP로 처리.
 *
 * 동작 조건:
 *   - cityCctvList 1~SKIP_THRESHOLD 개일 때만 실행
 *   - 최대 MAX_CHECK 개, 1.5초 디바운스 (마커 먼저 표시 후 백그라운드)
 *   - 뷰포트 변경 시 이전 결과 stale 방지 (generation 관리)
 */

import { useState, useEffect, useRef } from 'react'
import { CityCctvItem } from './cctvUtils'

const MAX_CHECK      = 50
const SKIP_THRESHOLD = 100
const DEBOUNCE_MS    = 1500

export function useCctvStatusCheck(cityCctvList: CityCctvItem[]) {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const genRef   = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const gen = ++genRef.current

    if (cityCctvList.length === 0) {
      setFailedIds(new Set())
      return
    }

    if (cityCctvList.length > SKIP_THRESHOLD) return

    timerRef.current = setTimeout(async () => {
      try {
        const ids = cityCctvList.slice(0, MAX_CHECK).map(i => i.CCTVID)
        const res = await fetch('/api/traffic/city-cctv-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        if (!res.ok) return
        const data: { failed?: string[] } = await res.json()
        if (gen === genRef.current) {
          setFailedIds(new Set<string>(Array.isArray(data.failed) ? data.failed : []))
        }
      } catch {
        // 네트워크 오류 → 현재 상태 유지
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cityCctvList])

  return failedIds
}
