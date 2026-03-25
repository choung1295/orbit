'use strict'

const https = require('https')
const http = require('http')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const SHARD_TOTAL = 10          // 전체 10묶음
const SHARD_WINDOW_MINS = 144   // 24 * 60 / 10 = 하루를 144분 단위로 분할
const CONCURRENCY = 20          // 동시 요청 수
const TIMEOUT_MS = 10000        // 요청 타임아웃 10초
const UPSERT_CHUNK = 100

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('필수 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── 샤드 결정 ────────────────────────────────────────────────────────────────
// SHARD_INDEX 환경변수가 있으면 사용, 없으면 현재 UTC 시간 기반 자동 계산

function getShardIndex() {
  const envShard = process.env.SHARD_INDEX
  if (envShard !== undefined && envShard !== '') return parseInt(envShard, 10)
  const now = new Date()
  const minuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes()
  return Math.floor(minuteOfDay / SHARD_WINDOW_MINS) % SHARD_TOTAL
}

// ── HTTP 헬퍼 ───────────────────────────────────────────────────────────────

function httpPost(url, bodyStr) {
  return new Promise((resolve) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const buf = Buffer.from(bodyStr, 'utf8')
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': buf.length,
        'Referer': 'http://www.utic.go.kr/etc/telMap.do',
        'Origin': 'http://www.utic.go.kr',
        'User-Agent': 'Mozilla/5.0 (compatible; OrbitBot/1.0)',
      },
      rejectUnauthorized: false,
      timeout: 20000,
    }, (res) => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => resolve({ ok: res.statusCode === 200, data }))
    })
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, data: '' }) })
    req.on('error', () => resolve({ ok: false, data: '' }))
    req.write(buf)
    req.end()
  })
}

function httpGet(url) {
  return new Promise((resolve) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OrbitBot/1.0)',
        'Accept': 'text/html,*/*',
      },
      rejectUnauthorized: false,
      timeout: TIMEOUT_MS,
    }, (res) => {
      let body = ''
      res.on('data', c => {
        body += c
        if (body.length > 50000) req.destroy()
      })
      res.on('end', () => resolve({ code: res.statusCode, body, error: null }))
    })
    req.on('timeout', () => { req.destroy(); resolve({ code: 0, body: '', error: 'timeout' }) })
    req.on('error', (e) => resolve({ code: 0, body: '', error: e.message }))
    req.end()
  })
}

// ── CCTV 유틸 ───────────────────────────────────────────────────────────────

function buildStreamUrl(cctv) {
  const kindMap = { MODE: 'Seoul', EC: 'Seoul' }
  const kind = kindMap[cctv.KIND] || cctv.KIND || ''
  const params = new URLSearchParams({
    cctvid: cctv.CCTVID || '',
    cctvname: cctv.CCTVNAME || '',
    kind,
    cctvip: cctv.CCTVIP || 'undefined',
    cctvch: String(cctv.CH || ''),
    id: String(cctv.ID || ''),
    cctvpasswd: 'undefined',
    cctvport: 'undefined',
    minX: '', minY: '', maxX: '', maxY: '',
  })
  return `https://www.utic.go.kr/jsp/map/cctvStream.jsp?${params}`
}

/**
 * 판정 기준:
 * - 네트워크 오류 / 타임아웃 → 점검중
 * - HTTP 500 또는 응답코드 0 → 점검중
 * - 빈 응답 → 점검중
 * - null\n 패턴 → 점검중
 * - SyntaxError / AbortError / NullPointerException → 점검중
 * - Java Exception 패턴 → 점검중
 * - rtmp:// 포함 (Chrome 재생 불가) → 크롬안내
 * - MEDIA_ERR_DECODE / MEDIA_ERR_SRC_NOT_SUPPORTED → 크롬안내
 * - 해당 없음 → 정상
 */
function determineStatus(body, code, error) {
  if (error || !body) return '점검중'
  if (code === 500 || code === 0) return '점검중'
  if (body.trim() === '') return '점검중'
  if (/null[\r\n]/.test(body)) return '점검중'
  if (/'null'|"null"/.test(body)) return '점검중'
  if (/SyntaxError/i.test(body)) return '점검중'
  if (/AbortError/i.test(body)) return '점검중'
  if (/NullPointerException/i.test(body)) return '점검중'
  if (/javax?\.(servlet|lang)\.\w*Exception/i.test(body)) return '점검중'
  if (/rtmp:\/\//i.test(body)) return '크롬안내'
  if (/MEDIA_ERR_DECODE|MEDIA_ERR_SRC_NOT_SUPPORTED/i.test(body)) return '크롬안내'
  return '정상'
}

async function checkBatch(cctvs) {
  const checkedAt = new Date().toISOString()
  return Promise.all(cctvs.map(async (cctv) => {
    const { code, body, error } = await httpGet(buildStreamUrl(cctv))
    return {
      cctv_id: cctv.CCTVID,
      status: determineStatus(body, code, error),
      checked_at: checkedAt,
    }
  }))
}

// ── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const shardIndex = getShardIndex()
  console.log(`=== 시내 CCTV 상태 점검 · 샤드 ${shardIndex}/${SHARD_TOTAL - 1} ===`)

  // 1. UTIC 시내 CCTV 목록 조회
  const postBody = new URLSearchParams({
    MIN_X: '124.0', MIN_Y: '33.0', MAX_X: '132.0', MAX_Y: '43.0',
  }).toString()

  console.log('[ 1 ] UTIC 시내 CCTV 목록 조회 중...')
  const { ok, data } = await httpPost('http://www.utic.go.kr/map/mapcctv.do', postBody)
  if (!ok) {
    console.error('[ERR] UTIC API 호출 실패')
    process.exit(1)
  }

  let cctvList
  try {
    cctvList = JSON.parse(data)
  } catch {
    console.error('[ERR] UTIC 응답 파싱 실패')
    process.exit(1)
  }

  if (!Array.isArray(cctvList) || cctvList.length === 0) {
    console.error('[ERR] CCTV 목록 없음')
    process.exit(1)
  }

  // CCTVID 기준으로 정렬 → 실행마다 동일한 순서 보장
  const valid = cctvList
    .filter(c => c.CCTVID)
    .sort((a, b) => String(a.CCTVID).localeCompare(String(b.CCTVID)))

  // 담당 샤드 분리: index % SHARD_TOTAL === shardIndex
  const shard = valid.filter((_, i) => i % SHARD_TOTAL === shardIndex)

  console.log(`[ 1 ] 전체 ${valid.length}건 → 샤드 ${shardIndex}: ${shard.length}건`)

  if (shard.length === 0) {
    console.log('[ 1 ] 처리 대상 없음, 종료')
    return
  }

  // 2. 병렬 상태 체크
  console.log(`[ 2 ] 상태 체크 시작 (동시 ${CONCURRENCY}건, 타임아웃 ${TIMEOUT_MS / 1000}초)...`)
  const results = []

  for (let i = 0; i < shard.length; i += CONCURRENCY) {
    const batch = shard.slice(i, i + CONCURRENCY)
    const batchResults = await checkBatch(batch)
    results.push(...batchResults)
    process.stdout.write(`\r      진행: ${results.length}/${shard.length}`)
  }

  console.log()
  const 정상 = results.filter(r => r.status === '정상').length
  const 점검중 = results.filter(r => r.status === '점검중').length
  const 크롬안내 = results.filter(r => r.status === '크롬안내').length
  console.log(`[ 2 ] 완료: 정상=${정상} / 점검중=${점검중} / 크롬안내=${크롬안내}`)

  // 3. Supabase upsert
  console.log('[ 3 ] Supabase upsert 중...')
  let upserted = 0

  for (let i = 0; i < results.length; i += UPSERT_CHUNK) {
    const chunk = results.slice(i, i + UPSERT_CHUNK)
    const { error } = await supabase
      .from('cctv_status')
      .upsert(chunk, { onConflict: 'cctv_id' })
    if (error) {
      console.error(`[ERR] upsert 실패 (${i}~${i + UPSERT_CHUNK}):`, error.message)
      continue
    }
    upserted += chunk.length
  }

  console.log(`[ 3 ] upsert 완료: ${upserted}건`)
  console.log('=== 완료 ===')
}

main().catch(e => { console.error(e); process.exit(1) })
