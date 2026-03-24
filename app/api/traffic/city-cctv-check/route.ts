import { NextResponse } from 'next/server'

export const preferredRegion = 'icn1'
export const maxDuration = 10

const MAX_IDS = 50
const TIMEOUT_MS = 3000

/** UTIC 스트림 URL에 HEAD 요청 — 실패(timeout/에러/non-2xx) 시 true 반환 */
async function isFailed(id: string, uticKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=${encodeURIComponent(id)}`,
      {
        method: 'HEAD',
        headers: {
          Referer: `http://www.utic.go.kr/etc/telMap.do?key=${uticKey}`,
          'User-Agent': 'Mozilla/5.0 (compatible; OrbitAI/1.0)',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )
    return !res.ok
  } catch {
    return true // timeout 또는 네트워크 오류 → 점검중
  }
}

export async function POST(request: Request) {
  const UTIC_KEY = process.env.UTIC_API_KEY ?? ''

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

  const results = await Promise.all(ids.map(id => isFailed(id, UTIC_KEY)))
  const failed = ids.filter((_, i) => results[i])

  return NextResponse.json({ failed, checked: ids.length })
}
