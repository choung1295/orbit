import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return NextResponse.json({ error: 'KAKAO_REST_API_KEY not set' }, { status: 500 })

  const x = searchParams.get('x') ?? ''
  const y = searchParams.get('y') ?? ''
  const size = Math.min(Number(searchParams.get('size') ?? '5'), 15)

  // 키워드 검색 (장소명 · 상호명)
  const kwParams = new URLSearchParams({ query, size: String(size) })
  if (x && y) { kwParams.set('x', x); kwParams.set('y', y); kwParams.set('sort', 'distance') }

  // 주소 검색 (지번 · 도로명)
  const addrParams = new URLSearchParams({ query, analyze_type: 'similar', size: String(size) })

  const [kwRes, addrRes] = await Promise.all([
    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${kwParams}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    }),
    fetch(`https://dapi.kakao.com/v2/local/search/address.json?${addrParams}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    }),
  ])

  const [kwData, addrData] = await Promise.all([kwRes.json(), addrRes.json()])

  // 키워드 결과 우선, 주소 결과로 보완 (좌표 기준 중복 제거)
  const seen = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merged: any[] = []

  for (const doc of kwData.documents ?? []) {
    const key = `${doc.x}_${doc.y}`
    if (!seen.has(key)) { seen.add(key); merged.push(doc) }
  }

  for (const doc of addrData.documents ?? []) {
    const key = `${doc.x}_${doc.y}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push({
        id: `addr_${doc.x}_${doc.y}`,
        place_name: '',
        address_name: doc.address?.address_name ?? doc.address_name ?? '',
        road_address_name: doc.road_address?.address_name ?? '',
        x: doc.x,
        y: doc.y,
      })
    }
  }

  return NextResponse.json({ documents: merged.slice(0, size) })
}
