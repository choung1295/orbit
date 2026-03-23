/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CctvItem {
  cctvname?: string; cctvName?: string; name?: string;
  coordx?: number | string; coordX?: number | string; longitude?: number | string; lng?: number | string; lon?: number | string;
  coordy?: number | string; coordY?: number | string; latitude?: number | string; lat?: number | string;
  cctvurl?: string; cctvUrl?: string; url?: string;
  /** 출처 구분: 'urban' = 도시교통(ITS), 'city' = 시내교통 */
  source?: 'urban' | 'city'
}

export function getCctvName(item: CctvItem): string {
  return item.cctvname ?? item.cctvName ?? item.name ?? 'CCTV'
}

export function getCctvLng(item: CctvItem): number | null {
  const raw = item.coordx ?? item.coordX ?? item.longitude ?? item.lng ?? item.lon
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

export function getCctvLat(item: CctvItem): number | null {
  const raw = item.coordy ?? item.coordY ?? item.latitude ?? item.lat
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

export function normalizeCctvUrl(url: string): string {
  if (!url) return ''
  return url
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim()
    .replace(/^(https?:\/\/)(https?:\/\/)/i, '$1')
    .replace(/^\/\//, 'http://')
}

export function getCctvUrl(item: CctvItem): string {
  return normalizeCctvUrl(item.cctvurl ?? item.cctvUrl ?? item.url ?? '')
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|m3u8|webm|ts|flv|avi|mov|mkv)$/.test(url.toLowerCase().split('?')[0])
}

export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/.test(url.toLowerCase().split('?')[0])
}

// 모바일 터치 hit area 최소 보장값 (px)
const MIN_HIT_PX = 44

export function getCctvMarkerImg(size: number): string {
  const hit = Math.max(size, MIN_HIT_PX)
  const cx = Math.round(hit / 2)
  const r = Math.round(size / 2) - 1
  return 'data:image/svg+xml;base64,' + btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${hit}" height="${hit}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="#6366f1" stroke="#ffffff" stroke-width="1.5"/></svg>`
  )
}

/** MarkerImage Size/Point에 사용할 실제 hit 크기 반환 */
export function getCctvHitSize(size: number): number {
  return Math.max(size, MIN_HIT_PX)
}

export function getCctvMarkerSize(zoom: number): number {
  if (zoom <= 3) return 26
  if (zoom <= 5) return 22
  if (zoom <= 7) return 18
  if (zoom <= 9) return 14
  return 10
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── 시내교통 CCTV (UTIC) ──────────────────────────────────────────────────
export interface CityCctvItem {
  CCTVID: string
  STRMID: string
  CCTVNAME: string
  XCOORD: number
  YCOORD: number
  MOVIE: string
  CH?: number
  KIND: string
  CENTERNAME: string
  ID?: string
  CCTVIP?: string
}

const CITY_KIND_MAP: Record<string, string> = {
  MODE: 'Seoul',
  EC: 'Seoul',
}

export function buildCityCctvStreamUrl(
  item: CityCctvItem,
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null
): string {
  const params = new URLSearchParams({
    cctvid: item.CCTVID,
    cctvname: item.CCTVNAME,
    kind: CITY_KIND_MAP[item.KIND] ?? item.KIND,
    cctvip: item.CCTVIP ?? 'undefined',
    cctvch: String(item.CH ?? ''),
    id: String(item.ID ?? ''),
    cctvpasswd: 'undefined',
    cctvport: 'undefined',
    minX: String(bounds?.minX ?? ''),
    minY: String(bounds?.minY ?? ''),
    maxX: String(bounds?.maxX ?? ''),
    maxY: String(bounds?.maxY ?? ''),
  })
  return `https://www.utic.go.kr/jsp/map/cctvStream.jsp?${params}`
}

export function getCityCctvMarkerImg(size: number): string {
  const hit = Math.max(size, MIN_HIT_PX)
  const cx = Math.round(hit / 2)
  const r = Math.round(size / 2) - 1
  return 'data:image/svg+xml;base64,' + btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${hit}" height="${hit}"><circle cx="${cx}" cy="${cx}" r="${r}" fill="#14b8a6" stroke="#ffffff" stroke-width="1.5"/></svg>`
  )
}

export const CITY_CLUSTER_STYLES: any[] = [
  { width: '44px', height: '44px', background: '#0d9488', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '40px', fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' },
  { width: '52px', height: '52px', background: '#0f766e', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '48px', fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  { width: '60px', height: '60px', background: '#115e59', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '56px', fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' },
  { width: '68px', height: '68px', background: '#134e4a', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '64px', fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.45)' },
]

export const CLUSTER_STYLES: any[] = [
  { width: '44px', height: '44px', background: '#3B82F6', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '40px', fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' },
  { width: '52px', height: '52px', background: '#7C3AED', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '48px', fontSize: '14px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  { width: '60px', height: '60px', background: '#F59E0B', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '56px', fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' },
  { width: '68px', height: '68px', background: '#EF4444', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '50%', textAlign: 'center', lineHeight: '64px', fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.45)' },
]
