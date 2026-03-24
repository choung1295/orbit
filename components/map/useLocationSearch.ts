import { useState, useEffect, useRef } from 'react'

export interface LocationSearchResult {
  id: string
  placeName: string
  addressName: string
  lat: number
  lng: number
}

export interface LocationPoint {
  label: string
  lat: number
  lng: number
}

async function searchLocation(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const params = new URLSearchParams({ q: trimmed, size: '8' })
  try {
    const res = await fetch(`/api/kakao/geocode?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.documents ?? []).map((doc: any) => ({
      id: String(doc.id || `${doc.x}_${doc.y}`),
      placeName: doc.place_name ?? '',
      addressName: doc.address_name ?? '',
      lat: Number(doc.y),
      lng: Number(doc.x),
    }))
  } catch {
    return []
  }
}

export function useLocationSearch() {
  const [query, setQueryRaw] = useState('')
  const [results, setResults] = useState<LocationSearchResult[]>([])
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (selectedPoint) { setResults([]); return }
    if (query.trim().length < 2) { setResults([]); return }

    timerRef.current = setTimeout(async () => {
      const r = await searchLocation(query)
      setResults(r)
    }, 280)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedPoint])

  const setQuery = (q: string) => {
    setQueryRaw(q)
    if (selectedPoint) setSelectedPoint(null)
  }

  const selectResult = (r: LocationSearchResult) => {
    const label = r.placeName || r.addressName
    setSelectedPoint({ label, lat: r.lat, lng: r.lng })
    setQueryRaw(label)
    setResults([])
  }

  const clear = () => {
    setQueryRaw('')
    setSelectedPoint(null)
    setResults([])
  }

  return { query, setQuery, results, selectedPoint, selectResult, clear }
}
