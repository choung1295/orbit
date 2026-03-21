import { useState, useCallback } from 'react'

export interface LatLng {
  lat: number
  lng: number
}

export interface RouteData {
  routeId: string
  polyline: LatLng[]
  distance: number  // meters
  duration: number  // seconds
  isSelected: boolean
}

async function geocode(query: string): Promise<LatLng | null> {
  const res = await fetch(`/api/kakao/geocode?q=${encodeURIComponent(query)}`)
  const data = await res.json()
  const doc = data.documents?.[0]
  if (!doc) return null
  return { lat: Number(doc.y), lng: Number(doc.x) }
}

function parseVertexes(roads: { vertexes?: number[] }[]): LatLng[] {
  const points: LatLng[] = []
  for (const road of roads) {
    const verts = road.vertexes ?? []
    for (let i = 0; i + 1 < verts.length; i += 2) {
      points.push({ lng: verts[i], lat: verts[i + 1] })
    }
  }
  return points
}

export function useRoute() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoutes = useCallback(async (originAddr: string, destAddr: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const [originCoord, destCoord] = await Promise.all([
        geocode(originAddr),
        geocode(destAddr),
      ])
      if (!originCoord || !destCoord) {
        setError('주소를 찾을 수 없습니다.')
        return
      }

      const res = await fetch(
        `/api/kakao/directions?origin=${originCoord.lng},${originCoord.lat}&destination=${destCoord.lng},${destCoord.lat}`
      )
      const data = await res.json()

      const rawRoutes: RouteData[] = (data.routes ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((r: any) => r.result_code === 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any, idx: number) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const roads = (r.sections ?? []).flatMap((s: any) => s.roads ?? [])
          return {
            routeId: `route-${idx}`,
            polyline: parseVertexes(roads),
            distance: r.summary?.distance ?? 0,
            duration: r.summary?.duration ?? 0,
            isSelected: idx === 0,
          }
        })

      if (rawRoutes.length === 0) {
        setError('경로를 찾을 수 없습니다.')
        return
      }

      setRoutes(rawRoutes)
    } catch {
      setError('경로를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectRoute = useCallback((routeId: string) => {
    setRoutes(prev => prev.map(r => ({ ...r, isSelected: r.routeId === routeId })))
  }, [])

  const clearRoutes = useCallback(() => {
    setRoutes([])
    setError(null)
  }, [])

  // 좌표 직접 사용 (자동완성 선택 후 호출)
  const fetchRoutesByCoords = useCallback(async (
    origin: LatLng,
    dest: LatLng,
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/kakao/directions?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}`
      )
      const data = await res.json()

      const parsed: RouteData[] = (data.routes ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((r: any) => r.result_code === 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any, idx: number) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const roads = (r.sections ?? []).flatMap((s: any) => s.roads ?? [])
          return {
            routeId: `route-${idx}`,
            polyline: parseVertexes(roads),
            distance: r.summary?.distance ?? 0,
            duration: r.summary?.duration ?? 0,
            isSelected: idx === 0,
          }
        })

      if (parsed.length === 0) { setError('경로를 찾을 수 없습니다.'); return }
      setRoutes(parsed)
    } catch {
      setError('경로를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { routes, isLoading, error, fetchRoutes, fetchRoutesByCoords, selectRoute, clearRoutes }
}
