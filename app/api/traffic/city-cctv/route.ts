import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const body = new URLSearchParams({ MIN_X: minX, MIN_Y: minY, MAX_X: maxX, MAX_Y: maxY })

  let rawItems: Record<string, unknown>[]
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
      return NextResponse.json({ error: `UTIC API 오류: ${response.status}` }, { status: 502 })
    }
    const data = await response.json()
    rawItems = Array.isArray(data) ? data : []
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `UTIC 호출 실패: ${msg}` }, { status: 502 })
  }

  if (rawItems.length === 0) {
    return NextResponse.json({ data: [] })
  }

  // 점검중 상태 병합 — 캐시된 값을 단일 배치 쿼리로 조회
  // 조회 실패 시 is_maintenance 없이 응답 (지도 로딩 우선)
  let maintenanceSet = new Set<string>()
  try {
    const cctvIds = rawItems.map(i => String(i.CCTVID)).filter(Boolean)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: statusRows } = await supabase
      .from('city_cctv_status')
      .select('cctvid')
      .eq('is_maintenance', true)
      .in('cctvid', cctvIds)
    if (statusRows) {
      maintenanceSet = new Set(statusRows.map((r: { cctvid: string }) => r.cctvid))
    }
  } catch {
    // 상태 조회 실패 → 점검중 없이 정상 응답 (지도 로딩 우선)
  }

  const data = rawItems.map(item => ({
    ...item,
    is_maintenance: maintenanceSet.has(String(item.CCTVID)),
  }))

  return NextResponse.json({ data })
}
