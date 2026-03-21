import { useState, useEffect, useRef } from 'react'

export interface SearchResult {
  id: string
  placeName: string
  addressName: string
  roadAddressName: string
  lat: number
  lng: number
}

export interface SelectedPoint {
  label: string
  lat: number
  lng: number
}

async function searchPlaces(
  query: string,
  bias?: { lat: number; lng: number },
): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({ q: trimmed, size: '7' })
  if (bias) { params.set('x', String(bias.lng)); params.set('y', String(bias.lat)) }

  try {
    const res = await fetch(`/api/kakao/geocode?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.documents ?? []).map((doc: any) => ({
      id: String(doc.id || `${doc.x}_${doc.y}`),
      placeName: doc.place_name ?? '',
      addressName: doc.address_name ?? '',
      roadAddressName: doc.road_address_name ?? '',
      lat: Number(doc.y),
      lng: Number(doc.x),
    }))
  } catch {
    return []
  }
}

export function useRouteSearch(mapCenter?: { lat: number; lng: number }) {
  const [originQuery, setOriginQueryRaw] = useState('')
  const [destQuery, setDestQueryRaw] = useState('')
  const [originPoint, setOriginPoint] = useState<SelectedPoint | null>(null)
  const [destPoint, setDestPoint] = useState<SelectedPoint | null>(null)
  const [originResults, setOriginResults] = useState<SearchResult[]>([])
  const [destResults, setDestResults] = useState<SearchResult[]>([])
  const [activeField, setActiveField] = useState<'origin' | 'dest' | null>(null)

  const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 출발지 디바운스 검색
  useEffect(() => {
    if (originTimer.current) clearTimeout(originTimer.current)
    // 이미 선택된 경우 검색 안 함
    if (originPoint) { setOriginResults([]); return }
    if (originQuery.trim().length < 2) { setOriginResults([]); return }

    originTimer.current = setTimeout(async () => {
      const results = await searchPlaces(originQuery, mapCenter)
      setOriginResults(results)
    }, 280)

    return () => { if (originTimer.current) clearTimeout(originTimer.current) }
  // mapCenter는 의존성에서 제외 (검색 중 지도 이동해도 재검색 안 함)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originQuery, originPoint])

  // 도착지 디바운스 검색
  useEffect(() => {
    if (destTimer.current) clearTimeout(destTimer.current)
    if (destPoint) { setDestResults([]); return }
    if (destQuery.trim().length < 2) { setDestResults([]); return }

    destTimer.current = setTimeout(async () => {
      const results = await searchPlaces(destQuery, mapCenter)
      setDestResults(results)
    }, 280)

    return () => { if (destTimer.current) clearTimeout(destTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destQuery, destPoint])

  const setOriginQuery = (q: string) => {
    setOriginQueryRaw(q)
    if (originPoint) setOriginPoint(null)  // 재편집 시 선택 초기화
  }

  const setDestQuery = (q: string) => {
    setDestQueryRaw(q)
    if (destPoint) setDestPoint(null)
  }

  const selectOrigin = (r: SearchResult) => {
    const label = r.placeName || r.addressName
    setOriginPoint({ label, lat: r.lat, lng: r.lng })
    setOriginQueryRaw(label)
    setOriginResults([])
  }

  const selectDest = (r: SearchResult) => {
    const label = r.placeName || r.addressName
    setDestPoint({ label, lat: r.lat, lng: r.lng })
    setDestQueryRaw(label)
    setDestResults([])
  }

  const swap = () => {
    const tmpQ = originQuery
    const tmpP = originPoint
    setOriginQueryRaw(destQuery)
    setOriginPoint(destPoint)
    setDestQueryRaw(tmpQ)
    setDestPoint(tmpP)
    setOriginResults([])
    setDestResults([])
  }

  const clearOrigin = () => { setOriginQueryRaw(''); setOriginPoint(null); setOriginResults([]) }
  const clearDest = () => { setDestQueryRaw(''); setDestPoint(null); setDestResults([]) }
  const clearAll = () => { clearOrigin(); clearDest(); setActiveField(null) }

  return {
    originQuery, destQuery,
    setOriginQuery, setDestQuery,
    originPoint, destPoint,
    originResults, destResults,
    activeField, setActiveField,
    selectOrigin, selectDest,
    swap, clearOrigin, clearDest, clearAll,
    isReady: originPoint !== null && destPoint !== null,
  }
}
