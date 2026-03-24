import { NextResponse } from 'next/server'

export const preferredRegion = 'icn1'
export const maxDuration = 10

const MAX_IDS = 50
const TIMEOUT_MS = 3000

/**
 * UTIC 시내 CCTV 스트림 페이지에 GET 요청
 * HEAD는 UTIC이 지원하지 않아 전부 에러 반환 → GET으로 변경
 * HTTP 200 = 정상, 500 = 점검중(ID 없음/오류)
 * 바디는 읽지 않고 즉시 폐기 (대역폭 절약)
 */
async function checkOne(id: string): Promise<boolean> {
  try {
    const url = `https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=${encodeURIComponent(id)}&kind=Seoul&cctvip=undefined&cctvpasswd=undefined&cctvport=undefined`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Referer: 'http://www.utic.go.kr/etc/telMap.do',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    res.body?.cancel()   // 바디 폐기
    return !res.ok       // 200 → false(정상), 500 → true(점검중)
  } catch {
    return true          // 타임아웃·연결 오류 → 점검중
  }
}

export async function POST(request: Request) {
  let ids: string[]
  try {
    const body = await request.json()
    ids = Array.isArray(body?.ids) ? (body.ids as string[]).slice(0, MAX_IDS) : []
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  if (ids.length === 0) {
    return NextResponse.json({ failed: [], checked: 0 })
  }

  // 전체 병렬 처리 — 최대 소요 시간 = TIMEOUT_MS (3초)
  const results = await Promise.all(ids.map(checkOne))
  const failed = ids.filter((_, i) => results[i])

  return NextResponse.json({ failed, checked: ids.length })
}
