import { useMemo } from 'react'
import { LatLng, RouteData } from '../route/useRoute'
import { CctvItem, getCctvLat, getCctvLng } from './cctvUtils'

const SAMPLE_INTERVAL_M = 100  // polyline 샘플링 간격 (100m)

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// polyline을 일정 간격(m)으로 샘플링
function samplePolyline(polyline: LatLng[], intervalM: number): LatLng[] {
  if (polyline.length === 0) return []
  const samples: LatLng[] = [polyline[0]]
  let accumulated = 0
  for (let i = 1; i < polyline.length; i++) {
    const prev = polyline[i - 1]
    const curr = polyline[i]
    accumulated += haversineM(prev.lat, prev.lng, curr.lat, curr.lng)
    if (accumulated >= intervalM) {
      samples.push(curr)
      accumulated = 0
    }
  }
  return samples
}

/**
 * 경로별 CCTV 필터링
 * - route 생성 시 1회만 계산 (routes, allCctv 변경 시에만 재계산)
 * - 지도 이동/확대 시 재계산 없음
 */
export function useCctvFilter(
  routes: RouteData[],
  allCctv: CctvItem[],
  radiusM = 300
): Record<string, CctvItem[]> {
  return useMemo(() => {
    if (routes.length === 0 || allCctv.length === 0) return {}

    const result: Record<string, CctvItem[]> = {}

    for (const route of routes) {
      const samplePoints = samplePolyline(route.polyline, SAMPLE_INTERVAL_M)
      const seen = new Set<string>()
      const filtered: CctvItem[] = []

      for (const cctv of allCctv) {
        const lat = getCctvLat(cctv)
        const lng = getCctvLng(cctv)
        if (lat == null || lng == null) continue
        if (lng < 124 || lng > 132 || lat < 33 || lat > 43) continue

        const id = `${lat}_${lng}`
        if (seen.has(id)) continue

        for (const pt of samplePoints) {
          if (haversineM(pt.lat, pt.lng, lat, lng) <= radiusM) {
            seen.add(id)
            filtered.push(cctv)
            break
          }
        }
      }

      result[route.routeId] = filtered
    }

    return result
  }, [routes, allCctv, radiusM])
}
