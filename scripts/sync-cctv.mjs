/**
 * ITS CCTV 데이터 수집 → Supabase cctv_cache 저장 스크립트
 * 실행: node scripts/sync-cctv.mjs
 */

import https from 'https'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ITS_API_KEY = process.env.MOLIT_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ITS_API_KEY) {
  console.error('필수 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MOLIT_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false, timeout: 60000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
    req.on('error', reject)
  })
}

async function syncCctv() {
  console.log('ITS CCTV 데이터 수집 시작...')

  const url = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${ITS_API_KEY}&type=all&cctvType=1&minX=124.0&maxX=132.0&minY=33.0&maxY=43.0&getType=json`

  let rawData
  try {
    rawData = await httpsGetJson(url)
  } catch (e) {
    console.error('ITS API 호출 실패:', e.message)
    process.exit(1)
  }

  const items = rawData?.response?.data ?? rawData?.data ?? []
  if (!Array.isArray(items) || items.length === 0) {
    console.error('CCTV 데이터 없음. 응답:', JSON.stringify(rawData).slice(0, 200))
    process.exit(1)
  }

  console.log(`수집된 CCTV 수: ${items.length}`)

  const rows = items
    .map((item) => {
      const lat = parseFloat(item.coordy ?? item.coordY ?? item.latitude ?? item.lat)
      const lng = parseFloat(item.coordx ?? item.coordX ?? item.longitude ?? item.lng)
      const name = item.cctvname ?? item.cctvName ?? item.name ?? 'CCTV'
      const url = item.cctvurl ?? item.cctvUrl ?? item.url ?? ''
      if (isNaN(lat) || isNaN(lng)) return null
      return { id: `${name}_${lat}_${lng}`, name, lat, lng, url }
    })
    .filter(Boolean)

  console.log(`유효 CCTV 수: ${rows.length}, Supabase upsert 시작...`)

  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('cctv_cache')
      .upsert(chunk, { onConflict: 'id' })
    if (error) {
      console.error(`upsert 실패 (${i}~${i + CHUNK}):`, error.message)
      process.exit(1)
    }
    console.log(`  upsert 완료: ${i + chunk.length} / ${rows.length}`)
  }

  console.log('동기화 완료!')
}

syncCctv()
