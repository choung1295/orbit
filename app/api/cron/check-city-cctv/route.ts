import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60
export const preferredRegion = 'icn1'

/**
 * 시내 CCTV 점검중 판단 기준
 * STRMID 또는 MOVIE 필드가 비어있으면 스트림 불가 → 점검중
 * 복잡한 상태 구분 없이 "쓸 수 없으면 점검중"으로 단순 처리
 */
function isMaintenance(item: Record<string, unknown>): boolean {
  const strmid = String(item.STRMID ?? '').trim()
  const movie  = String(item.MOVIE  ?? '').trim()
  return !strmid || !movie
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const UTIC_KEY = process.env.UTIC_API_KEY
  if (!UTIC_KEY) {
    return NextResponse.json({ error: 'UTIC_API_KEY 누락' }, { status: 500 })
  }

  // 한반도 전역 시내 CCTV 목록 조회 (마커별 추가 호출 없음, 1회 배치)
  const body = new URLSearchParams({
    MIN_X: '124.0', MIN_Y: '33.0', MAX_X: '132.0', MAX_Y: '43.0',
  })

  let items: Record<string, unknown>[]
  try {
    const res = await fetch('http://www.utic.go.kr/map/mapcctv.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `http://www.utic.go.kr/etc/telMap.do?key=${UTIC_KEY}`,
        'Origin': 'http://www.utic.go.kr',
        'User-Agent': 'Mozilla/5.0 (compatible; OrbitAI/1.0)',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `UTIC API 오류: ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    items = Array.isArray(data) ? data : []
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `UTIC 호출 실패: ${msg}` }, { status: 502 })
  }

  if (items.length === 0) {
    return NextResponse.json({ message: 'UTIC 데이터 없음', count: 0 })
  }

  const rows = items
    .filter(item => item.CCTVID)
    .map(item => ({
      cctvid: String(item.CCTVID),
      is_maintenance: isMaintenance(item),
      checked_at: new Date().toISOString(),
    }))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('city_cctv_status')
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'cctvid' })
    if (error) {
      return NextResponse.json({ error: `upsert 실패: ${error.message}` }, { status: 500 })
    }
  }

  const maintenanceCount = rows.filter(r => r.is_maintenance).length
  return NextResponse.json({
    success: true,
    total: rows.length,
    maintenance: maintenanceCount,
    updatedAt: new Date().toISOString(),
  })
}
