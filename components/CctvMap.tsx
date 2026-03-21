'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CctvItem,
  CityCctvItem,
  getCctvName, getCctvLat, getCctvLng, getCctvUrl,
  getCctvMarkerImg, getCctvMarkerSize,
  getCityCctvMarkerImg, buildCityCctvStreamUrl,
  isVideoUrl, isImageUrl,
  CLUSTER_STYLES, CITY_CLUSTER_STYLES,
} from './cctv/cctvUtils'
import { useRoute } from './route/useRoute'
import { useCctvFilter } from './cctv/useCctvFilter'
import RouteLayer from './map/RouteLayer'
import RoutePanel from './map/RoutePanel'
import CctvLayer from './cctv/CctvLayer'
import MeasureTool from './map/MeasureTool'

declare global {
  interface Window { kakao: any }
}

const MY_LOCATION_IMG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="13" fill="white"/><circle cx="14" cy="14" r="9" fill="#EF4444"/><circle cx="14" cy="14" r="3.5" fill="white"/></svg>'
)

// ── 도시교통 CCTV 미디어 뷰어 ─────────────────────────────────────────────
type MediaState = 'video' | 'image' | 'error'

function CctvMediaViewer({ url, name, reconnectKey }: { url: string; name: string; reconnectKey: number }) {
  const getInitialState = (): MediaState => {
    if (!url) return 'error'
    if (isVideoUrl(url)) return 'video'
    if (isImageUrl(url)) return 'image'
    return 'video'
  }
  const [state, setState] = useState<MediaState>(getInitialState)

  useEffect(() => {
    if (!url) { setState('error'); return }
    if (isVideoUrl(url)) { setState('video'); return }
    if (isImageUrl(url)) { setState('image'); return }
    setState('video')
  }, [url])

  if (!url) return (
    <div className="mt-2 py-4 text-center text-xs text-gray-500 bg-gray-900/40 rounded-lg">영상 정보 없음</div>
  )
  if (state === 'video') return (
    <video key={`${url}-${reconnectKey}`} src={url} autoPlay muted playsInline controls preload="metadata"
      className="w-full rounded-lg mt-2 bg-black" style={{ maxHeight: '180px' }}
      onError={() => setState('image')} />
  )
  if (state === 'image') return (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={`${url}-${reconnectKey}`} src={url} alt={name}
      className="w-full rounded-lg mt-2" style={{ maxHeight: '180px', objectFit: 'contain' }}
      onError={() => setState('error')} />
  )
  return (
    <div className="mt-2 py-4 text-center text-xs text-gray-500 bg-gray-900/40 rounded-lg">영상을 불러오지 못했습니다</div>
  )
}

// ── 상수 ──────────────────────────────────────────────────────────────────
const DEFAULT_VIEW = { lat: 39.2, lng: 127.5, level: 13 }
const MAP_VIEW_KEY = 'orbit_map_view'
const MAP_MEMORY_KEY = 'orbit_map_memory'

// ── 타입 ──────────────────────────────────────────────────────────────────
type MapBaseType = 'normal' | 'satellite'
type LayerId = 'urban-cctv' | 'city-cctv' | 'cadastral'
interface MapBounds { minX: number; minY: number; maxX: number; maxY: number }

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function CctvMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const clustererRef = useRef<any>(null)
  const cityCctvClustererRef = useRef<any>(null)
  const myMarkerRef = useRef<any>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cityFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locationMemoryRef = useRef(true)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapBaseType, setMapBaseType] = useState<MapBaseType>('satellite')
  const [locationMemory, setLocationMemory] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(MAP_MEMORY_KEY) !== 'false'
  })
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(new Set())
  const [showRoutePanel, setShowRoutePanel] = useState(false)
  const [measureMode, setMeasureMode] = useState<'distance' | 'area' | 'radius' | null>(null)

  // 도시교통 CCTV
  const [urbanCctvList, setUrbanCctvList] = useState<CctvItem[]>([])
  const [urbanCctvLoaded, setUrbanCctvLoaded] = useState(false)
  const [urbanCctvLoading, setUrbanCctvLoading] = useState(false)
  const [selected, setSelected] = useState<CctvItem | null>(null)
  const [reconnectKey, setReconnectKey] = useState(0)

  // 시내교통 CCTV
  const [cityCctvList, setCityCctvList] = useState<CityCctvItem[]>([])
  const [cityCctvLoading, setCityCctvLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityCctvItem | null>(null)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

  // 내 위치
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(13)

  // 경로
  const { routes, isLoading: routeLoading, error: routeError, fetchRoutesByCoords, selectRoute, clearRoutes } = useRoute()
  const routeCctvMap = useCctvFilter(routes, urbanCctvList)
  const routeMode = routes.length > 0
  const selectedRoute = routes.find(r => r.isSelected)
  const routeCctvList = selectedRoute ? (routeCctvMap[selectedRoute.routeId] ?? []) : []
  const routeCctvCountMap = Object.fromEntries(
    Object.entries(routeCctvMap).map(([id, list]) => [id, list.length])
  )
  const handleSelectCctv = useCallback((item: CctvItem) => {
    setSelected(item)
    setSelectedCity(null)
  }, [])

  // ── locationMemory ref 동기화 ────────────────────────────────────────────
  useEffect(() => { locationMemoryRef.current = locationMemory }, [locationMemory])

  // ── 지도 초기화 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const createMap = () => {
      if (mapInstanceRef.current || !mapRef.current) return
      // 저장된 위치 복원 or 초기값
      const memOn = localStorage.getItem(MAP_MEMORY_KEY) !== 'false'
      let initView = DEFAULT_VIEW
      if (memOn) {
        try {
          const saved = JSON.parse(localStorage.getItem(MAP_VIEW_KEY) || 'null')
          if (saved?.lat && saved?.lng && saved?.level) initView = saved
        } catch { /* 무시 */ }
      }
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(initView.lat, initView.lng),
        level: initView.level,
      })
      mapInstanceRef.current = map
      map.relayout()
      requestAnimationFrame(() => mapInstanceRef.current?.relayout())
      window.kakao.maps.event.addListener(map, 'zoom_changed', () => setZoomLevel(map.getLevel()))
      // idle 시 위치 저장
      window.kakao.maps.event.addListener(map, 'idle', () => {
        if (!locationMemoryRef.current) return
        const c = map.getCenter()
        localStorage.setItem(MAP_VIEW_KEY, JSON.stringify({ lat: c.getLat(), lng: c.getLng(), level: map.getLevel() }))
      })
      setIsMapReady(true)
    }
    const tryInit = () => {
      if (mapInstanceRef.current || !mapRef.current) return
      window.kakao.maps.load(createMap)
    }
    if (window.kakao?.maps) { tryInit(); return }
    const SCRIPT_ID = 'kakao-map-script'
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false&libraries=clusterer`
      document.head.appendChild(script)
    }
    const onLoad = () => tryInit()
    script.addEventListener('load', onLoad)
    return () => script?.removeEventListener('load', onLoad)
  }, [])

  // ── 지도 bounds 추적 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const updateBounds = () => {
      const bounds = map.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      setMapBounds({ minX: sw.getLng(), minY: sw.getLat(), maxX: ne.getLng(), maxY: ne.getLat() })
    }
    window.kakao.maps.event.addListener(map, 'idle', updateBounds)
    updateBounds()
    return () => window.kakao.maps.event.removeListener(map, 'idle', updateBounds)
  }, [isMapReady])

  // ── 위치기억 OFF 시 초기 화면 강제 복원 ─────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || locationMemory) return
    mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(DEFAULT_VIEW.lat, DEFAULT_VIEW.lng))
    mapInstanceRef.current.setLevel(DEFAULT_VIEW.level)
  }, [isMapReady, locationMemory])

  // ── 위치기억 토글 ────────────────────────────────────────────────────────
  const toggleLocationMemory = useCallback(() => {
    setLocationMemory(prev => {
      const next = !prev
      localStorage.setItem(MAP_MEMORY_KEY, String(next))
      return next
    })
  }, [])

  // ── 지도 타입 ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    mapInstanceRef.current.setMapTypeId(
      mapBaseType === 'satellite'
        ? window.kakao.maps.MapTypeId.HYBRID
        : window.kakao.maps.MapTypeId.ROADMAP
    )
  }, [isMapReady, mapBaseType])

  // ── 지적도 오버레이 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    if (activeLayers.has('cadastral')) {
      mapInstanceRef.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT)
    } else {
      mapInstanceRef.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT)
    }
  }, [isMapReady, activeLayers])

  // ── 도시교통 CCTV 로딩 (on-demand) ──────────────────────────────────────
  const loadUrbanCctv = useCallback(async () => {
    if (urbanCctvLoaded || urbanCctvLoading) return
    setUrbanCctvLoading(true)
    try {
      const r = await fetch('/api/traffic/cctv?minX=124.0&maxX=132.0&minY=33.0&maxY=43.0')
      const data = await r.json()
      const list = data?.response?.data ?? data?.data ?? data
      setUrbanCctvList(Array.isArray(list) ? list : [])
      setUrbanCctvLoaded(true)
    } catch { console.error('도시교통 CCTV 로딩 실패') }
    finally { setUrbanCctvLoading(false) }
  }, [urbanCctvLoaded, urbanCctvLoading])

  // ── 시내교통 CCTV 로딩 (지도 범위 기반, 디바운스, 줌 레벨 9 이하만) ────
  useEffect(() => {
    if (!activeLayers.has('city-cctv') || !mapBounds) return
    if (zoomLevel > 9) { setCityCctvList([]); return }
    if (cityFetchTimerRef.current) clearTimeout(cityFetchTimerRef.current)
    cityFetchTimerRef.current = setTimeout(async () => {
      setCityCctvLoading(true)
      try {
        const { minX, minY, maxX, maxY } = mapBounds
        const r = await fetch(`/api/traffic/city-cctv?minX=${minX}&minY=${minY}&maxX=${maxX}&maxY=${maxY}`)
        const data = await r.json()
        setCityCctvList(Array.isArray(data?.data) ? data.data : [])
      } catch { console.error('시내교통 CCTV 로딩 실패') }
      finally { setCityCctvLoading(false) }
    }, 600)
    return () => { if (cityFetchTimerRef.current) clearTimeout(cityFetchTimerRef.current) }
  }, [activeLayers, mapBounds, zoomLevel])

  // ── 레이어 토글 ──────────────────────────────────────────────────────────
  const toggleLayer = useCallback((layerId: LayerId) => {
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
        if (layerId === 'urban-cctv') setSelected(null)
        if (layerId === 'city-cctv') { setSelectedCity(null); setCityCctvList([]) }
      } else {
        next.add(layerId)
        if (layerId === 'urban-cctv') loadUrbanCctv()
      }
      return next
    })
  }, [loadUrbanCctv])

  // ── 도시교통 30분 자동 재연결 ────────────────────────────────────────────
  useEffect(() => {
    if (reconnectTimerRef.current) { clearInterval(reconnectTimerRef.current); reconnectTimerRef.current = null }
    if (!selected) return
    reconnectTimerRef.current = setInterval(() => setReconnectKey(k => k + 1), 30 * 60 * 1000)
    return () => { if (reconnectTimerRef.current) { clearInterval(reconnectTimerRef.current); reconnectTimerRef.current = null } }
  }, [selected])

  // ── 내 위치 마커 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !myLocation) return
    const position = new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng)
    if (myMarkerRef.current) { myMarkerRef.current.setMap(null); myMarkerRef.current = null }
    myMarkerRef.current = new window.kakao.maps.Marker({
      position, map: mapInstanceRef.current,
      image: new window.kakao.maps.MarkerImage(MY_LOCATION_IMG, new window.kakao.maps.Size(28, 28), { offset: new window.kakao.maps.Point(14, 14) }),
    })
    mapInstanceRef.current.setCenter(position)
    mapInstanceRef.current.setLevel(5)
  }, [isMapReady, myLocation])

  // ── 내 위치 버튼 (토글) ───────────────────────────────────────────────────
  const handleMyLocation = useCallback(() => {
    if (!isMapReady) return
    // 이미 위치 표시 중이면 → 끄기
    if (myLocation) {
      if (myMarkerRef.current) { myMarkerRef.current.setMap(null); myMarkerRef.current = null }
      setMyLocation(null)
      return
    }
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false) },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [isMapReady, myLocation])

  // ── 도시교통 CCTV 클러스터러 ─────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    if (clustererRef.current) { clustererRef.current.clear(); clustererRef.current.setMap(null); clustererRef.current = null }
    if (!activeLayers.has('urban-cctv') || routeMode || !urbanCctvLoaded) return
    const size = getCctvMarkerSize(zoomLevel)
    const half = Math.round(size / 2)
    const markerImage = new window.kakao.maps.MarkerImage(getCctvMarkerImg(size), new window.kakao.maps.Size(size, size), { offset: new window.kakao.maps.Point(half, half) })
    const markers: any[] = []
    urbanCctvList.forEach(item => {
      const lng = getCctvLng(item); const lat = getCctvLat(item)
      if (lng == null || lat == null || lng < 124 || lng > 132 || lat < 33 || lat > 43) return
      const marker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(lat, lng), image: markerImage, title: getCctvName(item) })
      window.kakao.maps.event.addListener(marker, 'click', () => { setSelected(item); setSelectedCity(null) })
      markers.push(marker)
    })
    clustererRef.current = new window.kakao.maps.MarkerClusterer({ map: mapInstanceRef.current, averageCenter: true, minLevel: 10, disableClickZoom: false, markers, styles: CLUSTER_STYLES })
  }, [isMapReady, urbanCctvList, myLocation, zoomLevel, routeMode, activeLayers, urbanCctvLoaded])

  // ── 시내교통 CCTV 클러스터러 ─────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    if (cityCctvClustererRef.current) { cityCctvClustererRef.current.clear(); cityCctvClustererRef.current.setMap(null); cityCctvClustererRef.current = null }
    if (!activeLayers.has('city-cctv') || cityCctvList.length === 0) return
    const size = getCctvMarkerSize(zoomLevel)
    const half = Math.round(size / 2)
    const markerImage = new window.kakao.maps.MarkerImage(getCityCctvMarkerImg(size), new window.kakao.maps.Size(size, size), { offset: new window.kakao.maps.Point(half, half) })
    const markers: any[] = []
    cityCctvList.forEach(item => {
      if (!item.XCOORD || !item.YCOORD) return
      const marker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(item.YCOORD, item.XCOORD), image: markerImage, title: item.CCTVNAME })
      window.kakao.maps.event.addListener(marker, 'click', () => { setSelectedCity(item); setSelected(null) })
      markers.push(marker)
    })
    cityCctvClustererRef.current = new window.kakao.maps.MarkerClusterer({ map: mapInstanceRef.current, averageCenter: true, minLevel: 10, disableClickZoom: false, markers, styles: CITY_CLUSTER_STYLES })
  }, [isMapReady, cityCctvList, zoomLevel, activeLayers])

  const urbanActive = activeLayers.has('urban-cctv')
  const cityActive = activeLayers.has('city-cctv')
  const cadastralActive = activeLayers.has('cadastral')
  const [showCctvDropdown, setShowCctvDropdown] = useState(false)
  const cctvDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCctvDropdown) return
    const handler = (e: MouseEvent) => {
      if (cctvDropdownRef.current && !cctvDropdownRef.current.contains(e.target as Node)) {
        setShowCctvDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCctvDropdown])

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* ── 상단 메뉴 바 ── */}
      <div className="absolute top-3 left-3 z-[200]" style={{ maxWidth: 'calc(100vw - 56px)' }}>
        <div className="inline-flex items-center gap-1 bg-white border border-black/12 rounded-xl px-2 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">

          {/* 지도전환: 현재 반대 모드 표시 */}
          <button onClick={() => setMapBaseType(v => v === 'normal' ? 'satellite' : 'normal')}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-900 text-white shadow-sm whitespace-nowrap flex-shrink-0 hover:bg-gray-700 transition-colors">
            {mapBaseType === 'normal' ? '위성' : '일반'}
          </button>

          <div className="w-px h-4 bg-black/15 flex-shrink-0 mx-0.5" />

          {/* CCTV 드롭다운 */}
          <div className="relative flex-shrink-0" ref={cctvDropdownRef}>
            <button onClick={() => setShowCctvDropdown(v => !v)}
              className={['px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1',
                (urbanActive || cityActive) ? 'bg-blue-600 text-white' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'].join(' ')}>
              CCTV
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showCctvDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-black/8 rounded-xl shadow-xl overflow-hidden min-w-[110px] z-10">
                <button onClick={() => { toggleLayer('urban-cctv'); setShowCctvDropdown(false) }}
                  className={['w-full text-left px-3 py-2 text-xs font-medium transition-all',
                    urbanActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                  {urbanActive ? '✓ ' : ''}고속{urbanCctvLoading ? ' (로딩)' : ''}
                </button>
                <div className="h-px bg-black/5" />
                <button onClick={() => { toggleLayer('city-cctv'); setShowCctvDropdown(false) }}
                  className={['w-full text-left px-3 py-2 text-xs font-medium transition-all',
                    cityActive ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                  {cityActive ? '✓ ' : ''}시내{cityCctvLoading ? ' (로딩)' : ''}
                </button>
              </div>
            )}
          </div>

          {/* 지적도 토글 */}
          <button onClick={() => toggleLayer('cadastral')}
            className={['px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0',
              cadastralActive ? 'bg-amber-500 text-white' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'].join(' ')}>
            지적도
          </button>

          <div className="w-px h-4 bg-black/15 flex-shrink-0 mx-0.5" />

          {/* 경로설정 */}
          <button onClick={() => setShowRoutePanel(v => !v)}
            className={['px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0',
              showRoutePanel ? 'bg-gray-900 text-white' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'].join(' ')}>
            경로설정
          </button>

          <div className="w-px h-4 bg-black/15 flex-shrink-0 mx-0.5" />

          {/* 위치기억 토글 (보조 기능 - 작게) */}
          <button onClick={toggleLocationMemory}
            className={['px-2 py-0.5 text-[10px] font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0',
              locationMemory ? 'bg-emerald-500 text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'].join(' ')}>
            {locationMemory ? '위치기억 ON' : '위치기억 OFF'}
          </button>
        </div>
      </div>

      {/* ── 우측 버튼 그룹 (내위치 + 줌) ── */}
      <div className="absolute top-3 right-3 z-[200] flex flex-col bg-white border border-black/12 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* 내 위치 */}
        <button onClick={handleMyLocation} disabled={locationLoading || !isMapReady}
          className={`flex items-center justify-center w-11 h-11 transition-all active:scale-95 disabled:opacity-40 ${myLocation ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-gray-50'}`}
          title={myLocation ? '내 위치 끄기' : '내 위치'}>
          {locationLoading
            ? <svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={myLocation ? '#ffffff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={myLocation ? '' : 'text-blue-600'}>
                <circle cx="12" cy="12" r="3" fill={myLocation ? '#ffffff' : 'currentColor'} stroke="none" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                <circle cx="12" cy="12" r="8" />
              </svg>
          }
        </button>
        <div className="h-px bg-black/8 mx-2" />
        {/* 줌 인 */}
        <button
          onClick={() => { if (mapInstanceRef.current) mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() - 1) }}
          disabled={!isMapReady}
          className="flex items-center justify-center w-11 h-10 text-gray-700 text-lg font-light transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-40"
          title="확대">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div className="h-px bg-black/8 mx-2" />
        {/* 줌 아웃 */}
        <button
          onClick={() => { if (mapInstanceRef.current) mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() + 1) }}
          disabled={!isMapReady}
          className="flex items-center justify-center w-11 h-10 text-gray-700 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-40"
          title="축소">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>

        <div className="h-px bg-black/8 mx-2" />

        {/* 거리 측정 */}
        <button
          onClick={() => setMeasureMode(m => m === 'distance' ? null : 'distance')}
          disabled={!isMapReady}
          className={['flex items-center justify-center w-11 h-10 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-40',
            measureMode === 'distance' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'].join(' ')}
          title="거리 측정">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/>
            <line x1="8" y1="9" x2="8" y2="15" strokeWidth="1.4"/>
            <line x1="12" y1="9" x2="12" y2="15" strokeWidth="1.4"/>
            <line x1="16" y1="9" x2="16" y2="15" strokeWidth="1.4"/>
          </svg>
        </button>

        {/* 면적 측정 */}
        <button
          onClick={() => setMeasureMode(m => m === 'area' ? null : 'area')}
          disabled={!isMapReady}
          className={['flex items-center justify-center w-11 h-10 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-40',
            measureMode === 'area' ? 'text-amber-500 bg-amber-50' : 'text-gray-600'].join(' ')}
          title="면적 측정">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12,3 21,9 18,20 6,20 3,9"/>
          </svg>
        </button>

        {/* 반경 측정 */}
        <button
          onClick={() => setMeasureMode(m => m === 'radius' ? null : 'radius')}
          disabled={!isMapReady}
          className={['flex items-center justify-center w-11 h-10 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-40',
            measureMode === 'radius' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'].join(' ')}
          title="반경 측정">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <line x1="12" y1="12" x2="21" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── 측정 도구 ── */}
      {measureMode && isMapReady && mapInstanceRef.current && (
        <MeasureTool
          map={mapInstanceRef.current}
          mode={measureMode}
          onClose={() => setMeasureMode(null)}
        />
      )}

      {/* ── 경로 패널 ── */}
      {showRoutePanel && (
        <RoutePanel
          mapCenter={myLocation ?? undefined}
          routes={routes} routeCctvMap={routeCctvCountMap}
          isLoading={routeLoading} error={routeError}
          onSearch={fetchRoutesByCoords} onSelectRoute={selectRoute}
          onClear={() => { clearRoutes(); setSelected(null) }}
        />
      )}

      {/* ── 경로 폴리라인 ── */}
      {isMapReady && mapInstanceRef.current && (
        <RouteLayer map={mapInstanceRef.current} routes={routes} />
      )}

      {/* ── 경로 CCTV 마커 ── */}
      {isMapReady && mapInstanceRef.current && routeMode && (
        <CctvLayer map={mapInstanceRef.current} cctvList={routeCctvList} zoomLevel={zoomLevel} onSelect={handleSelectCctv} />
      )}

      {/* ── 도시교통 CCTV 팝업 ── */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 z-[100]">
          <div className="bg-gray-950/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-indigo-400 font-medium mb-0.5">도시교통 CCTV</p>
                <h3 className="text-white text-sm font-semibold leading-tight truncate">{getCctvName(selected)}</h3>
              </div>
              <button onClick={() => { setSelected(null); setReconnectKey(0) }} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <CctvMediaViewer url={getCctvUrl(selected)} name={getCctvName(selected)} reconnectKey={reconnectKey} />
          </div>
        </div>
      )}

      {/* ── 시내교통 CCTV 팝업 (iframe) ── */}
      {selectedCity && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[100]">
          <div className="bg-gray-950/95 border border-teal-500/20 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-teal-400 font-medium mb-0.5">
                  시내교통 CCTV · {selectedCity.CENTERNAME}
                </p>
                <h3 className="text-white text-sm font-semibold leading-tight truncate">{selectedCity.CCTVNAME}</h3>
              </div>
              <button onClick={() => setSelectedCity(null)} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <iframe
              src={buildCityCctvStreamUrl(selectedCity, mapBounds)}
              className="w-full rounded-lg bg-black"
              style={{ height: '200px', border: 'none' }}
              title={selectedCity.CCTVNAME}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-600">영상 재생은 60초만 제공됩니다 (UTIC)</p>
              <a href={buildCityCctvStreamUrl(selectedCity, mapBounds)} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-teal-400 hover:text-teal-300 underline">새창으로 보기</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
