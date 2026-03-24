'use client'

/**
 * 시내 CCTV 실시간 상태 체크 훅
 *
 * 뷰포트의 cityCctvList가 바뀌면 서버를 통해 각 스트림 URL에 HEAD 요청을 보냅니다.
 * 3초 내 응답 없거나 에러 → failed로 분류 → 점검중 오버레이 표시
 *
 * 동작 조건:
 *   - cityCctvList가 1개 이상이고 SKIP_THRESHOLD 이하일 때만 실행
 *   - 목록이 너무 많으면 (줌아웃 상태) 체크 생략
 *   - 최대 MAX_CHECK개만 체크
 *   - 1.5초 디바운스 (마커 먼저 표시 후 백그라운드 체크)
 *   - 뷰포트 변경 시 이전 요청 abort
 */

import { useState, useEffect, useRef } from 'react'
import { CityCctvItem } from './cctvUtils'

const MAX_CHECK = 50
const SKIP_THRESHOLD = 100  // 이 수를 초과하면 체크 생략 (줌아웃 상태)
const DEBOUNCE_MS = 1500

export function useCctvStatusCheck(cityCctvList: CityCctvItem[]) {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    // 마커 없으면 초기화
    if (cityCctvList.length === 0) {
      abortRef.current?.abort()
      setFailedIds(new Set())
      return
    }

    // 줌아웃 상태로 마커가 너무 많으면 체크 생략 (이전 결과 유지)
    if (cityCctvList.length > SKIP_THRESHOLD) return

    // 디바운스: 마커가 먼저 지도에 표시된 뒤 백그라운드로 체크
    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      try {
        const ids = cityCctvList.slice(0, MAX_CHECK).map(i => i.CCTVID)
        const res = await fetch('/api/traffic/city-cctv-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
          signal: abortRef.current.signal,
        })
        if (!res.ok) return
        const data: { failed?: string[] } = await res.json()
        setFailedIds(new Set<string>(Array.isArray(data.failed) ? data.failed : []))
      } catch {
        // abort 또는 네트워크 오류 → 현재 상태 유지
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cityCctvList])

  return failedIds
}
