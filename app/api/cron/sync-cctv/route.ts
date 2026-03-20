import { NextResponse } from 'next/server'
import https from 'https'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300
export const preferredRegion = 'icn1'

function httpsGetJson(url: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false, timeout: 60000 } as Parameters<typeof https.get>[1], (res) => {
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode ?? 0, body: data.slice(0, 300) }) }
      })
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
    req.on('error', reject)
  })
}

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const ITS_API_KEY = process.env.MOLIT_API_KEY
  if (!ITS_API_KEY) {
    return NextResponse.json({ error: 'MOLIT_API_KEY 누락' }, { status: 500 })
  }

  const url = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${ITS_API_KEY}&type=all&cctvType=1&minX=124.0&maxX=132.0&minY=33.0&maxY=43.0&getType=json`

  let httpStatus: number
  let rawData: unknown
  try {
    const result = await httpsGetJson(url)
    httpStatus = result.status
    rawData = result.body
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `ITS API 호출 실패: ${msg}` }, { status: 502 })
  }

  if (httpStatus !== 200) {
    return NextResponse.json({ error: `ITS API HTTP ${httpStatus}`, body: String(rawData).slice(0, 300) }, { status: 502 })
  }

  const raw = rawData as Record<string, unknown>
  // ITS API 응답: { response: [...] } 또는 { data: [...] } 또는 배열 직접
  const responseVal = raw?.response
  const items = Array.isArray(responseVal) ? responseVal
    : (responseVal as Record<string, unknown>)?.data ?? raw?.data ?? raw?.result ?? null
  const itemArray = Array.isArray(items) ? items : Array.isArray(rawData) ? rawData as unknown[] : []
  if (itemArray.length === 0) {
    return NextResponse.json({ error: 'CCTV 데이터 없음', rawKeys: Object.keys(raw ?? {}), rawSample: JSON.stringify(rawData).slice(0, 500) }, { status: 502 })
  }

  const rows = itemArray
    .map((item: unknown) => {
      const i = item as Record<string, unknown>
      const lat = parseFloat(String(i.coordy ?? i.coordY ?? i.latitude ?? i.lat ?? ''))
      const lng = parseFloat(String(i.coordx ?? i.coordX ?? i.longitude ?? i.lng ?? ''))
      const name = String(i.cctvname ?? i.cctvName ?? i.name ?? 'CCTV')
      const url = String(i.cctvurl ?? i.cctvUrl ?? i.url ?? '')
      if (isNaN(lat) || isNaN(lng)) return null
      return { id: `${name}_${lat}_${lng}`, name, lat, lng, url }
    })
    .filter(Boolean)

  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('cctv_cache')
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'id' })
    if (error) {
      return NextResponse.json({ error: `upsert 실패: ${error.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, count: rows.length, updatedAt: new Date().toISOString() })
}
