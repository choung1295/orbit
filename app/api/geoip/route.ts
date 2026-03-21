import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Vercel 환경에서는 x-forwarded-for로 실제 클라이언트 IP 추출
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? ''

  // 로컬/사설 IP는 조회 불필요
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return NextResponse.json({ error: 'local' }, { status: 400 })
  }

  try {
    // ipapi.co 무료 플랜 - 한국 IP 정확도 양호
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'orbitai/1.0' },
      next: { revalidate: 0 },
    })
    const data = await res.json()

    if (!data.latitude || !data.longitude || data.error) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    return NextResponse.json({
      lat: data.latitude,
      lng: data.longitude,
      city: data.city,
      accuracy: 3000, // IP 기반은 약 3km 정확도로 가정
    })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
