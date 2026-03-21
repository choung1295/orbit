import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const origin = searchParams.get('origin')      // "lng,lat"
  const destination = searchParams.get('destination') // "lng,lat"

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 })
  }

  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return NextResponse.json({ error: 'KAKAO_REST_API_KEY not set' }, { status: 500 })

  const url = new URL('https://apis-navi.kakaomobility.com/v1/directions')
  url.searchParams.set('origin', origin)
  url.searchParams.set('destination', destination)
  url.searchParams.set('alternatives', 'true')
  url.searchParams.set('priority', 'RECOMMEND')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${key}` },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
