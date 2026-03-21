import { NextResponse } from 'next/server'

export const preferredRegion = 'icn1'
export const maxDuration = 30

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const minX = searchParams.get('minX') ?? '124.0'
  const minY = searchParams.get('minY') ?? '33.0'
  const maxX = searchParams.get('maxX') ?? '132.0'
  const maxY = searchParams.get('maxY') ?? '43.0'

  const UTIC_KEY = process.env.UTIC_API_KEY
  if (!UTIC_KEY) {
    return NextResponse.json({ error: 'UTIC_API_KEY 누락' }, { status: 500 })
  }

  const body = new URLSearchParams({
    MIN_X: minX,
    MIN_Y: minY,
    MAX_X: maxX,
    MAX_Y: maxY,
  })

  try {
    const response = await fetch('http://www.utic.go.kr/map/mapcctv.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `http://www.utic.go.kr/etc/telMap.do?key=${UTIC_KEY}`,
        'Origin': 'http://www.utic.go.kr',
        'User-Agent': 'Mozilla/5.0 (compatible; OrbitAI/1.0)',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `UTIC API 오류: ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ data: Array.isArray(data) ? data : [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `UTIC 호출 실패: ${msg}` }, { status: 502 })
  }
}
