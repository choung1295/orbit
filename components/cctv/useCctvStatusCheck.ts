'use client'

/**
 * 시내 CCTV 실시간 상태 체크 훅 — 브라우저 클라이언트 직접 요청
 *
 * Vercel 서버 IP는 UTIC에 차단될 수 있으므로, 브라우저에서 직접 HEAD 요청을 보냅니다.
 * mode: 'no-cors' 로 CORS 제약 우회 — 응답 내용은 읽을 수 없지만
 * "응답 있음(opaque)" vs "타임아웃/네트워크 오류" 로 생사 구분 가능합니다.
 *
 * 동작 조건:
 *   - cityCctvList가 1~SKIP_THRESHOLD 개일 때만 실행 (초과 시 줌아웃으로 간주, 생략)
 *   - 최대 MAX_CHECK 개만 체크, CONCURRENT 개씩 병렬 처리
 *   - 1.5초 디바운스 (마커 먼저 표시 후 백그라운드 체크)
 *   - 뷰포트 변경 시 이전 결과가 새 뷰포트에 덮어쓰이지 않도록 generation 관리
 */

import { useState, useEffect, useRef } from 'react'
import { CityCctvItem } from './cctvUtils'

const MAX_CHECK      = 50
const SKIP_THRESHOLD = 100   // 마커 이 수 초과 시 체크 생략
const DEBOUNCE_MS    = 1500
const TIMEOUT_MS     = 3000
const CONCURRENT     = 10   // 동시 요청 수 (UTIC 부하 방지)

function buildCheckUrl(id: string): string {
  return `https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=${encodeURIComponent(id)}`
}

/** true = 점검중(타임아웃·오류), false = 응답 있음 */
async function checkOne(id: string): Promise<boolean> {
  try {
    await fetch(buildCheckUrl(id), {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return false // opaque 응답 = 서버가 살아 있음
  } catch {
    return true  // 타임아웃 또는 네트워크 오류 = 점검중
  }
}

/** CONCURRENT 개씩 순차 배치 처리 */
async function checkBatch(ids: string[]): Promise<string[]> {
  const failed: string[] = []
  for (let i = 0; i < ids.length; i += CONCURRENT) {
    const chunk = ids.slice(i, i + CONCURRENT)
    const results = await Promise.all(chunk.map(checkOne))
    chunk.forEach((id, idx) => { if (results[idx]) failed.push(id) })
  }
  return failed
}

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

    // 줌아웃 상태 — 마커 너무 많으면 체크 생략
    if (cityCctvList.length > SKIP_THRESHOLD) return

    timerRef.current = setTimeout(async () => {
      try {
        const ids = cityCctvList.slice(0, MAX_CHECK).map(i => i.CCTVID)
        const failed = await checkBatch(ids)
        // 뷰포트가 바뀐 후 돌아온 오래된 결과는 무시
        if (gen === genRef.current) {
          setFailedIds(new Set<string>(failed))
        }
      } catch {
        // 무시
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cityCctvList])

  return failedIds
}
