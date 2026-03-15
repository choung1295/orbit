'use client'

import { useEffect, useRef, useState } from 'react'
import type Map from 'ol/Map'
import type VectorSource from 'ol/source/Vector'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'

interface CctvItem {
  cctvname?: string; cctvName?: string; name?: string;
  coordx?: number | string; coordX?: number | string; longitude?: number | string; lng?: number | string; lon?: number | string;
  coordy?: number | string; coordY?: number | string; latitude?: number | string; lat?: number | string;
  cctvurl?: string; cctvUrl?: string; url?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface OlRefs {
  Feature: any;
  Point: any;
  fromLonLat: any;
  Style: any;
  CircleStyle: any;
  Fill: any;
  Stroke: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function getName(item: CctvItem): string { return item.cctvname ?? item.cctvName ?? item.name ?? 'CCTV' }
function getLng(item: CctvItem): number | null {
  const raw = item.coordx ?? item.coordX ?? item.longitude ?? item.lng ?? item.lon
  if (raw == null || raw === '') return null
  const n = Number(raw); return isNaN(n) ? null : n
}
function getLat(item: CctvItem): number | null {
  const raw = item.coordy ?? item.coordY ?? item.latitude ?? item.lat
  if (raw == null || raw === '') return null
  const n = Number(raw); return isNaN(n) ? null : n
}
function getUrl(item: CctvItem): string { return item.cctvurl ?? item.cctvUrl ?? item.url ?? '' }

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; const dLat = (lat2 - lat1) * (Math.PI / 180); const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export default function CctvMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const cctvSourceRef = useRef<VectorSource | null>(null)
  const locationSourceRef = useRef<VectorSource | null>(null)
  const olRefs = useRef<OlRefs | null>(null)

  const [isMapReady, setIsMapReady] = useState(false)
  const [cctvList, setCctvList] = useState<CctvItem[]>([])
  const [selected, setSelected] = useState<CctvItem | null>(null)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locError, setLocError] = useState<string | null>(null)
  const [isLoadingLoc, setIsLoadingLoc] = useState(false)
  const [is4kmFilterActive, setIs4kmFilterActive] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const initMap = async () => {
      const [
        { default: Map }, { default: View }, { default: TileLayer }, { default: VectorLayer },
        { default: VectorSource }, { default: XYZ }, { default: Feature }, { default: Point },
        StyleObj, Proj
      ] = await Promise.all([
        import('ol/Map'), import('ol/View'), import('ol/layer/Tile'), import('ol/layer/Vector'),
        import('ol/source/Vector'), import('ol/source/XYZ'), import('ol/Feature'), import('ol/geom/Point'),
        import('ol/style'), import('ol/proj')
      ])

      olRefs.current = { Feature, Point, fromLonLat: Proj.fromLonLat, Style: StyleObj.Style, CircleStyle: StyleObj.Circle, Fill: StyleObj.Fill, Stroke: StyleObj.Stroke }
      cctvSourceRef.current = new VectorSource()
      locationSourceRef.current = new VectorSource()

      if (mapRef.current) mapRef.current.innerHTML = ''
      
      const map = new Map({
        target: mapRef.current!,
        layers: [
          new TileLayer({ 
            source: new XYZ({ 
              url: 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png', 
              crossOrigin: 'anonymous',
              projection: 'EPSG:3857'
            }) 
          }),
          new VectorLayer({ source: cctvSourceRef.current, zIndex: 10 }),
          new VectorLayer({ source: locationSourceRef.current, zIndex: 100 })
        ],
        view: new View({ 
          center: Proj.fromLonLat([127.5, 36.5]), 
          zoom: 7,
          projection: 'EPSG:3857',
          enableRotation: false // [핵심] 모바일 피치 줌 시 지도 회전 방지 (정북 고정)
        })
      })

      mapInstanceRef.current = map
      map.on('click', (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature<Geometry>, { layerFilter: (l) => l.getZIndex() === 10 })
        setSelected(feature ? feature.get('data') : null)
      })
      map.on('pointermove', (evt) => {
        const hit = map.hasFeatureAtPixel(evt.pixel, { layerFilter: (l) => l.getZIndex() === 10 })
        map.getTargetElement().style.cursor = hit ? 'pointer' : ''
      })
      
      map.updateSize()
      setIsMapReady(true)

      const handleResize = () => map.updateSize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
    initMap()
    
    return () => { 
      if (mapInstanceRef.current) { 
        mapInstanceRef.current.setTarget(undefined); 
        mapInstanceRef.current = null 
      } 
    }
  }, [])

  useEffect(() => {
    const fetchCctvData = async () => {
      try {
        const res = await fetch('/api/traffic/cctv?minX=124.0&maxX=132.0&minY=33.0&maxY=43.0')
        const data = await res.json()
        setCctvList(Array.isArray(data?.response?.data ?? data?.data ?? data) ? (data?.response?.data ?? data?.data ?? data) : [])
      } catch { console.error('CCTV 데이터를 불러올 수 없습니다.') }
    }
    fetchCctvData()
  }, [])

  useEffect(() => {
    const source = cctvSourceRef.current
    if (!isMapReady || !source || !olRefs.current) return
    const { Feature, Point, Style, CircleStyle, Fill, Stroke, fromLonLat } = olRefs.current
    source.clear()
    cctvList.forEach(item => {
      const lng = getLng(item), lat = getLat(item)
      if (lng == null || lat == null || lng < 124 || lng > 132 || lat < 33 || lat > 43) return
      if (is4kmFilterActive && myLocation && getDistance(myLocation.lat, myLocation.lng, lat, lng) > 4.0) return
      const feature = new Feature({ geometry: new Point(fromLonLat([lng, lat])), data: item })
      feature.setStyle(new Style({ image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#6366f1' }), stroke: new Stroke({ color: '#fff', width: 1.5 }) }) }))
      source.addFeature(feature)
    })
  }, [isMapReady, cctvList, is4kmFilterActive, myLocation])

  function showLocError(msg: string) { setLocError(msg); setTimeout(() => setLocError(null), 3000) }

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      showLocError('위치 기능을 지원하지 않습니다.');
      return
    }
    setIsLoadingLoc(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (mapInstanceRef.current && olRefs.current && locationSourceRef.current) {
          const { Feature, Point, Style, CircleStyle, Fill, Stroke, fromLonLat } = olRefs.current
          const coords = fromLonLat([lng, lat])
          locationSourceRef.current.clear()

          const locFeature = new Feature({ geometry: new Point(coords) })
          locFeature.setStyle([
            new Style({ 
              image: new CircleStyle({ radius: 8, fill: new Fill({ color: '#ff00ff' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }),
              zIndex: 2
            }),
            new Style({
              image: new CircleStyle({
                radius: accuracy > 100 ? 30 : 15,
                fill: new Fill({ color: 'rgba(255, 0, 255, 0.15)' }),
                stroke: new Stroke({ color: 'rgba(255, 0, 255, 0.3)', width: 1 })
              }),
              zIndex: 1
            })
          ])
          locationSourceRef.current.addFeature(locFeature)
          setMyLocation({ lat, lng })
          mapInstanceRef.current.updateSize()
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.updateSize()
              mapInstanceRef.current.getView().animate({ center: coords, zoom: 16, duration: 1000 })
            }
          }, 50)
          setIsLoadingLoc(false)
        } else {
          setIsLoadingLoc(false)
        }
      },
      (err) => {
        setIsLoadingLoc(false)
        let msg = '위치를 가져올 수 없습니다.'
        if (err.code === 1) msg = '위치 권한이 거부되었습니다.'
        showLocError(msg)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border-4 border-gray-800/10 shadow-2xl bg-gray-200 h-[65dvh] md:h-[600px]">
      <div 
        ref={mapRef} 
        className="absolute inset-0 w-full h-full" 
      />
      
      {/* 
        [핵심 수정] 컨트롤 영역을 fixed로 전환하여 모바일 브라우저의 모든 레이아웃 간섭을 우회합니다.
        하단에 배치하여 엄지손가락으로 조작하기 쉽게 변경 (모바일 경험 우선)
      */}
      <div 
        className="fixed bottom-10 left-4 right-4 md:absolute md:top-4 md:bottom-auto flex flex-wrap justify-center md:justify-end gap-3 pointer-events-none"
        style={{ zIndex: 9999999 }}
      >
        <button 
          onClick={handleMyLocation} 
          disabled={isLoadingLoc} 
          className="pointer-events-auto px-6 py-3 bg-[#6366f1] text-white font-black text-sm rounded-2xl shadow-[0_10px_40px_rgba(99,102,241,0.6)] hover:bg-indigo-700 active:scale-90 transition-all disabled:opacity-70 flex items-center gap-2 border-2 border-white whitespace-nowrap"
        >
          {isLoadingLoc ? '탐색 중...' : '📍 내 위치 찾기 (v3.0)'}
        </button>
        
        {myLocation && (
          <button 
            onClick={() => setIs4kmFilterActive(!is4kmFilterActive)} 
            className={`pointer-events-auto px-6 py-3 font-black text-sm rounded-2xl shadow-2xl active:scale-90 transition-all border-2 whitespace-nowrap ${
              is4kmFilterActive ? 'bg-emerald-500 text-white border-white' : 'bg-white text-indigo-600 border-indigo-500'
            }`}
          >
            {is4kmFilterActive ? '🌐 전체 CCTV' : '🎯 주변 4km'}
          </button>
        )}
      </div>

      {locError && (
        <div className="absolute top-20 left-4 right-4 z-[1000000] flex justify-center pointer-events-none">
          <div className="px-5 py-2.5 bg-rose-600 text-white text-xs font-black rounded-full shadow-2xl border-2 border-white animate-bounce pointer-events-auto">
            ⚠️ {locError}
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-24 md:bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-[1000000] bg-[#1a1a24] border-2 border-indigo-500/30 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white text-sm md:text-base font-black leading-tight mb-2">{getName(selected)}</h3>
              {getUrl(selected) && (
                <a 
                  href={getUrl(selected)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-[10px] md:text-[12px] font-black rounded-lg hover:bg-indigo-700 transition-all shadow-lg"
                >
                  영상 보기 →
                </a>
              )}
            </div>
            <button 
              onClick={() => setSelected(null)} 
              className="p-1.5 bg-gray-800/50 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-all shadow-inner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}