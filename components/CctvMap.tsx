'use client'

import { useEffect, useRef, useState } from 'react'

interface CctvItem {
  cctvname?: string
  cctvName?: string
  name?: string
  coordx?: number | string
  coordX?: number | string
  longitude?: number | string
  lng?: number | string
  lon?: number | string
  coordy?: number | string
  coordY?: number | string
  latitude?: number | string
  lat?: number | string
  cctvurl?: string
  cctvUrl?: string
  url?: string
}

function getName(item: CctvItem): string {
  return item.cctvname ?? item.cctvName ?? item.name ?? 'CCTV'
}

function getLng(item: CctvItem): number | null {
  const raw = item.coordx ?? item.coordX ?? item.longitude ?? item.lng ?? item.lon
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

function getLat(item: CctvItem): number | null {
  const raw = item.coordy ?? item.coordY ?? item.latitude ?? item.lat
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

function getUrl(item: CctvItem): string {
  return item.cctvurl ?? item.cctvUrl ?? item.url ?? ''
}

export default function CctvMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  const [selected, setSelected] = useState<CctvItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined)
      mapInstanceRef.current = null
    }

    const init = async () => {
      const { default: Map } = await import('ol/Map')
      const { default: View } = await import('ol/View')
      const { default: TileLayer } = await import('ol/layer/Tile')
      const { default: VectorLayer } = await import('ol/layer/Vector')
      const { default: VectorSource } = await import('ol/source/Vector')
      const { default: XYZ } = await import('ol/source/XYZ')
      const { default: Feature } = await import('ol/Feature')
      const { default: Point } = await import('ol/geom/Point')
      const { Style, Circle: CircleStyle, Fill, Stroke } = await import('ol/style')
      const { fromLonLat } = await import('ol/proj')

      let cctvList: CctvItem[] = []
      try {
        const res = await fetch('/api/traffic/cctv?minX=124.0&maxX=132.0&minY=33.0&maxY=43.0')
        const data = await res.json()
        cctvList = data?.response?.data ?? data?.data ?? data ?? []
        if (!Array.isArray(cctvList)) cctvList = []
      } catch {
        setError('CCTV 데이터를 불러올 수 없습니다.')
        return
      }

      const vectorSource = new VectorSource()

      for (const item of cctvList) {
        const lng = getLng(item)
        const lat = getLat(item)
        if (lng == null || lat == null) continue
        if (lng < 124 || lng > 132 || lat < 33 || lat > 43) continue

        const feature = new Feature({
          geometry: new Point(fromLonLat([lng, lat])),
          data: item,
        })
        feature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 6,
              fill: new Fill({ color: '#6366f1' }),
              stroke: new Stroke({ color: '#fff', width: 1.5 }),
            }),
          })
        )
        vectorSource.addFeature(feature)
      }

      const vectorLayer = new VectorLayer({ source: vectorSource })

      const baseLayer = new TileLayer({
        source: new XYZ({
          url: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
          crossOrigin: 'anonymous',
        }),
      })

      const map = new Map({
        target: mapRef.current!,
        layers: [baseLayer, vectorLayer],
        view: new View({
          center: fromLonLat([127.5, 36.5]),
          zoom: 7,
        }),
      })

      mapInstanceRef.current = map

      map.on('click', (evt) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f: any) => f)
        if (feature) {
          setSelected(feature.get('data') as CctvItem)
        } else {
          setSelected(null)
        }
      })

      map.on('pointermove', (evt) => {
        const hit = map.hasFeatureAtPixel(evt.pixel)
        map.getTargetElement().style.cursor = hit ? 'pointer' : ''
      })
    }

    init()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full">
      <div ref={mapRef} className="w-full h-[70vh] md:h-[600px] rounded-xl overflow-hidden" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#18181f] border border-[#2a2a35] rounded-xl px-5 py-3 shadow-xl max-w-sm w-full mx-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white text-sm font-semibold">{getName(selected)}</p>
              {getUrl(selected) && (

                href = { getUrl(selected) }
                  target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 text-xs mt-0.5 hover:underline"
                >
              영상 보기 →
            </a>
              )}
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-gray-500 hover:text-white text-lg leading-none shrink-0"
          >
            ✕
          </button>
        </div>
        </div>
  )
}
    </div >
  )
}