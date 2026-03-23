'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CctvItem, CityCctvItem,
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
import {
  useMapStore,
  DEFAULT_VIEW, MAP_VIEW_KEY, MAP_MEMORY_KEY,
  type LayerId,
} from './map/useMapStore'

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

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function CctvMap() {
  // ── Refs ───────────────────────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const clustererRef = useRef<any>(null)
  const cityCctvClustererRef = useRef<any>(null)
  const fakeCityOverlaysRef = useRef<any[]>([])
  const myMarkerRef = useRef<any>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cityFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const locationMemoryRef = useRef(true)
  const cctvDropdownRef = useRef<HTMLDivElement>(null)
  const popupHistoryPushedRef = useRef(false)
  const popstateFromCodeRef = useRef(false)  // 코드가 호출한 history.go/back() popstate 식별용
  const preMountHistoryLengthRef = useRef(0) // 카카오 SDK 초기화 이전 history.length 기준점

  // ── 가로/세로 방향 감지 (시내 CCTV 전체화면 전환용) ─────────────────────
  const [isLandscape, setIsLandscape] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsLandscape(e.matches)
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Store ─────────────────────────────────────────────────────────────
  const {
    isMapReady, setIsMapReady,
    mapBaseType, setMapBaseType,
    locationMemory, toggleLocationMemory,
    activeLayers, setActiveLayers,
    zoomLevel, setZoomLevel,
    mapBounds, setMapBounds,
    selectedCctv, selectUrbanCctv, selectCityCctv,
    clearSelection, clearUrbanSelection, clearCitySelection,
    reconnectKey, setReconnectKey,
    urbanCctvList, setUrbanCctvList,
    urbanCctvState, setUrbanCctvState,
    cityCctvList, setCityCctvList,
    setCityCctvState,
    myLocation, setMyLocation,
    locationLoading, setLocationLoading,
    showRoutePanel, setShowRoutePanel,
    measureMode, setMeasureMode,
    toolDrawerOpen, setToolDrawerOpen,
    showCctvDropdown, setShowCctvDropdown,
  } = useMapStore()

  // ── 파생 상태 ─────────────────────────────────────────────────────────
  const selectedUrban = selectedCctv?.type === 'urban' ? selectedCctv.item : null
  const selectedCityItem = selectedCctv?.type === 'city' ? selectedCctv.item : null

  // ── 경로 ──────────────────────────────────────────────────────────────
  const { routes, isLoading: routeLoading, error: routeError, fetchRoutesByCoords, selectRoute, clearRoutes } = useRoute()
  const routeCctvMap = useCctvFilter(routes, urbanCctvList)
  const routeMode = routes.length > 0
  const selectedRoute = routes.find(r => r.isSelected)
  const routeCctvList = selectedRoute ? (routeCctvMap[selectedRoute.routeId] ?? []) : []
  const routeCctvCountMap = Object.fromEntries(
    Object.entries(routeCctvMap).map(([id, list]) => [id, list.length])
  )
  // ── CCTV 팝업 히스토리 / 뒤로가기 처리 ───────────────────────────────
  // 카카오 SDK가 히스토리 엔트리를 추가하기 전 기준 길이를 저장
  useEffect(() => {
    preMountHistoryLengthRef.current = history.length
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      // 코드가 직접 호출한 history.go/back() → 무시
      if (popstateFromCodeRef.current) {
        popstateFromCodeRef.current = false
        return
      }
      // 사용자 뒤로가기: 팝업 닫기 + 카카오 SDK 중간 엔트리 건너뜀
      if (!popupHistoryPushedRef.current) return
      popupHistoryPushedRef.current = false
      clearSelection()
      // 마운트 기준점까지 남은 중간 엔트리 수 (카카오 SDK가 추가한 엔트리)
      const remaining = history.length - preMountHistoryLengthRef.current - 1
      if (remaining > 0) {
        popstateFromCodeRef.current = true
        history.go(-remaining)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [clearSelection])

  /** 팝업 최초 오픈 시에만 pushState 1회, 이미 열린 상태면 replaceState로 교체 */
  const openUrbanCctv = useCallback((item: CctvItem) => {
    if (!popupHistoryPushedRef.current) {
      history.pushState({ cctvPopup: true }, '')
      popupHistoryPushedRef.current = true
    } else {
      history.replaceState({ cctvPopup: true }, '')
    }
    selectUrbanCctv(item)
  }, [selectUrbanCctv])

  const openCityCctv = useCallback((item: CityCctvItem) => {
    if (!popupHistoryPushedRef.current) {
      history.pushState({ cctvPopup: true }, '')
      popupHistoryPushedRef.current = true
    } else {
      history.replaceState({ cctvPopup: true }, '')
    }
    selectCityCctv(item)
  }, [selectCityCctv])

  /** X 버튼 닫기: 즉시 닫고 카카오 SDK 엔트리 포함 CCTV 관련 히스토리 전부 제거 */
  const handleClosePopup = useCallback(() => {
    clearSelection()
    if (popupHistoryPushedRef.current) {
      popupHistoryPushedRef.current = false
      popstateFromCodeRef.current = true
      // 카카오 SDK 중간 엔트리 + cctvPopup 엔트리를 한 번에 건너뜀
      const delta = history.length - preMountHistoryLengthRef.current
      history.go(-(delta > 0 ? delta : 1))
    }
  }, [clearSelection])

  const handleSelectCctv = useCallback((item: CctvItem) => {
    openUrbanCctv(item)
  }, [openUrbanCctv])

  // ── locationMemory ref 동기화 ────────────────────────────────────────
  useEffect(() => { locationMemoryRef.current = locationMemory }, [locationMemory])

  // ── 지도 초기화 ──────────────────────────────────────────────────────
  useEffect(() => {
    const createMap = () => {
      if (mapInstanceRef.current || !mapRef.current) return
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 지도 bounds 추적 ─────────────────────────────────────────────────
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
  }, [isMapReady, setMapBounds])

  // ── 위치기억 OFF 시 초기 화면 강제 복원 ─────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || locationMemory) return
    mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(DEFAULT_VIEW.lat, DEFAULT_VIEW.lng))
    mapInstanceRef.current.setLevel(DEFAULT_VIEW.level)
  }, [isMapReady, locationMemory])

  // ── 지도 타입 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    mapInstanceRef.current.setMapTypeId(
      mapBaseType === 'satellite'
        ? window.kakao.maps.MapTypeId.HYBRID
        : window.kakao.maps.MapTypeId.ROADMAP
    )
  }, [isMapReady, mapBaseType])

  // ── 지적도 오버레이 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    if (activeLayers.has('cadastral')) {
      mapInstanceRef.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT)
    } else {
      mapInstanceRef.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT)
    }
  }, [isMapReady, activeLayers])

  // ── 도시교통 CCTV 로딩 (on-demand) ──────────────────────────────────
  const loadUrbanCctv = useCallback(async () => {
    if (urbanCctvState !== 'idle') return
    setUrbanCctvState('loading')
    try {
      const r = await fetch('/api/traffic/cctv?minX=124.0&maxX=132.0&minY=33.0&maxY=43.0')
      const data = await r.json()
      const list = data?.response?.data ?? data?.data ?? data
      setUrbanCctvList(Array.isArray(list) ? list : [])
      setUrbanCctvState('loaded')
    } catch {
      console.error('도시교통 CCTV 로딩 실패')
      setUrbanCctvState('error')
    }
  }, [urbanCctvState, setUrbanCctvState, setUrbanCctvList])

  // ── 시내교통 CCTV 가짜 클러스터 (줌아웃 시 정적 표시) ─────────────────
  const FAKE_CITY_CLUSTERS = [
    { lat: 37.5665, lng: 126.9780, count: 448 },
    { lat: 37.6200, lng: 127.0600, count: 198 },
    { lat: 37.5100, lng: 127.0600, count: 163 },
    { lat: 37.5500, lng: 126.8500, count: 109 },
    { lat: 37.4563, lng: 126.7052, count: 196 },
    { lat: 37.7500, lng: 126.8500, count: 149 },
    { lat: 37.4100, lng: 127.5200, count: 235 },
    { lat: 37.2636, lng: 127.0286, count: 250 },
    { lat: 37.1500, lng: 127.0700, count: 219 },
    { lat: 37.3200, lng: 127.1100, count: 160 },
    { lat: 37.0500, lng: 127.2000, count: 129 },
    { lat: 36.8151, lng: 127.1139, count: 117 },
    { lat: 36.3504, lng: 127.3845, count: 180 },
    { lat: 36.6424, lng: 127.4890, count: 105 },
    { lat: 35.8714, lng: 128.6014, count: 320 },
    { lat: 35.5384, lng: 129.3114, count: 140 },
    { lat: 35.1796, lng: 129.0756, count: 380 },
    { lat: 35.2200, lng: 128.6800, count: 120 },
    { lat: 35.1595, lng: 126.8526, count: 210 },
    { lat: 35.8242, lng: 127.1480, count: 96 },
    { lat: 34.8118, lng: 126.3922, count: 58 },
    { lat: 34.7604, lng: 127.6622, count: 67 },
    { lat: 35.1800, lng: 128.1080, count: 72 },
    { lat: 36.0190, lng: 129.3430, count: 83 },
    { lat: 36.5684, lng: 128.7294, count: 53 },
    { lat: 37.3422, lng: 127.9201, count: 77 },
    { lat: 37.7519, lng: 128.8761, count: 69 },
    { lat: 33.4996, lng: 126.5312, count: 104 },
  ]

  useEffect(() => {
    fakeCityOverlaysRef.current.forEach(o => o.setMap(null))
    fakeCityOverlaysRef.current = []
    if (!isMapReady || !mapInstanceRef.current) return
    if (!activeLayers.has('city-cctv') || zoomLevel <= 9) return

    FAKE_CITY_CLUSTERS.forEach(({ lat, lng, count }) => {
      const size = count >= 200 ? 68 : count >= 100 ? 60 : count >= 50 ? 52 : 44
      const line = size - 4
      const fs = count >= 200 ? 16 : count >= 100 ? 15 : count >= 50 ? 14 : 13
      const bg = count >= 200 ? '#115e59' : count >= 100 ? '#0f766e' : '#0d9488'

      // HTML 문자열 대신 DOM 엘리먼트 사용 → 클릭 이벤트 직접 부착 가능
      const el = document.createElement('div')
      el.style.cssText = `width:${size}px;height:${size}px;background:${bg};border:2px solid rgba(255,255,255,0.9);border-radius:50%;text-align:center;line-height:${line}px;font-size:${fs}px;font-weight:bold;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:translate(-50%,-50%);cursor:pointer;transition:transform 0.15s ease,filter 0.15s ease`
      el.textContent = String(count)

      el.addEventListener('click', () => {
        // 즉각 시각 피드백 (0.1초)
        el.style.transform = 'translate(-50%,-50%) scale(1.12)'
        el.style.filter = 'brightness(1.3)'
        setTimeout(() => {
          el.style.transform = 'translate(-50%,-50%)'
          el.style.filter = ''
        }, 150)

        // 3레벨 줌인 (클러스터 중심 기준)
        const map = mapInstanceRef.current
        if (!map) return
        const targetLevel = Math.max(map.getLevel() - 3, 3)
        map.setLevel(targetLevel, {
          anchor: new window.kakao.maps.LatLng(lat, lng),
          animate: { duration: 400 },
        })
      })

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content: el,
        zIndex: 3,
      })
      overlay.setMap(mapInstanceRef.current)
      fakeCityOverlaysRef.current.push(overlay)
    })
    return () => {
      fakeCityOverlaysRef.current.forEach(o => o.setMap(null))
      fakeCityOverlaysRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, activeLayers, zoomLevel])

  // ── 시내교통 CCTV 로딩 (줌인 시에만 실제 데이터, 디바운스) ──────────────
  useEffect(() => {
    if (!activeLayers.has('city-cctv') || !mapBounds) return
    if (zoomLevel > 9) { setCityCctvList([]); return }
    if (cityFetchTimerRef.current) clearTimeout(cityFetchTimerRef.current)
    cityFetchTimerRef.current = setTimeout(async () => {
      setCityCctvState('loading')
      try {
        const { minX, minY, maxX, maxY } = mapBounds
        const r = await fetch(`/api/traffic/city-cctv?minX=${minX}&minY=${minY}&maxX=${maxX}&maxY=${maxY}`)
        const data = await r.json()
        setCityCctvList(Array.isArray(data?.data) ? data.data : [])
        setCityCctvState('loaded')
      } catch {
        console.error('시내교통 CCTV 로딩 실패')
        setCityCctvState('error')
      }
    }, 600)
    return () => { if (cityFetchTimerRef.current) clearTimeout(cityFetchTimerRef.current) }
  }, [activeLayers, mapBounds, zoomLevel, setCityCctvList, setCityCctvState])

  // ── 레이어 토글 ──────────────────────────────────────────────────────
  const toggleLayer = useCallback((layerId: LayerId) => {
    const isActive = activeLayers.has(layerId)
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return next
    })
    if (isActive) {
      if (layerId === 'urban-cctv') {
        if (popupHistoryPushedRef.current && selectedCctv?.type === 'urban') {
          popupHistoryPushedRef.current = false
          popstateFromCodeRef.current = true
          clearUrbanSelection()
          history.go(-(Math.max(history.length - preMountHistoryLengthRef.current, 1)))
        } else {
          clearUrbanSelection()
        }
      }
      if (layerId === 'city-cctv') {
        if (popupHistoryPushedRef.current && selectedCctv?.type === 'city') {
          popupHistoryPushedRef.current = false
          popstateFromCodeRef.current = true
          clearCitySelection()
          setCityCctvList([])
          history.go(-(Math.max(history.length - preMountHistoryLengthRef.current, 1)))
        } else {
          clearCitySelection()
          setCityCctvList([])
        }
      }
    } else {
      if (layerId === 'urban-cctv') loadUrbanCctv()
    }
  }, [activeLayers, loadUrbanCctv, clearUrbanSelection, clearCitySelection, setCityCctvList, setActiveLayers, selectedCctv])

  // ── 도시교통 30분 자동 재연결 ────────────────────────────────────────
  useEffect(() => {
    if (reconnectTimerRef.current) { clearInterval(reconnectTimerRef.current); reconnectTimerRef.current = null }
    if (!selectedUrban) return
    reconnectTimerRef.current = setInterval(() => setReconnectKey(k => k + 1), 30 * 60 * 1000)
    return () => { if (reconnectTimerRef.current) { clearInterval(reconnectTimerRef.current); reconnectTimerRef.current = null } }
  }, [selectedUrban, setReconnectKey])

  // ── 내 위치 마커 ─────────────────────────────────────────────────────
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

  // ── 내 위치 버튼 (토글) ───────────────────────────────────────────────
  const handleMyLocation = useCallback(() => {
    if (!isMapReady) return
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
  }, [isMapReady, myLocation, setMyLocation, setLocationLoading])

  // ── 도시교통 CCTV 클러스터러 ─────────────────────────────────────────
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    if (clustererRef.current) { clustererRef.current.clear(); clustererRef.current.setMap(null); clustererRef.current = null }
    if (!activeLayers.has('urban-cctv') || routeMode || urbanCctvState !== 'loaded') return
    const size = getCctvMarkerSize(zoomLevel)
    const half = Math.round(size / 2)
    const markerImage = new window.kakao.maps.MarkerImage(getCctvMarkerImg(size), new window.kakao.maps.Size(size, size), { offset: new window.kakao.maps.Point(half, half) })
    const markers: any[] = []
    urbanCctvList.forEach(item => {
      const lng = getCctvLng(item); const lat = getCctvLat(item)
      if (lng == null || lat == null || lng < 124 || lng > 132 || lat < 33 || lat > 43) return
      const marker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(lat, lng), image: markerImage, title: getCctvName(item) })
      window.kakao.maps.event.addListener(marker, 'click', () => openUrbanCctv(item))
      markers.push(marker)
    })
    clustererRef.current = new window.kakao.maps.MarkerClusterer({ map: mapInstanceRef.current, averageCenter: true, minLevel: 10, disableClickZoom: false, markers, styles: CLUSTER_STYLES })
  }, [isMapReady, urbanCctvList, myLocation, zoomLevel, routeMode, activeLayers, urbanCctvState, openUrbanCctv])

  // ── 시내교통 CCTV 클러스터러 ─────────────────────────────────────────
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
      window.kakao.maps.event.addListener(marker, 'click', () => openCityCctv(item))
      markers.push(marker)
    })
    cityCctvClustererRef.current = new window.kakao.maps.MarkerClusterer({ map: mapInstanceRef.current, averageCenter: true, minLevel: 6, disableClickZoom: false, markers, styles: CITY_CLUSTER_STYLES })
  }, [isMapReady, cityCctvList, zoomLevel, activeLayers, openCityCctv])

  const urbanActive = activeLayers.has('urban-cctv')
  const cityActive = activeLayers.has('city-cctv')
  const cadastralActive = activeLayers.has('cadastral')

  useEffect(() => {
    if (!showCctvDropdown) return
    const handler = (e: MouseEvent) => {
      if (cctvDropdownRef.current && !cctvDropdownRef.current.contains(e.target as Node)) {
        setShowCctvDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCctvDropdown, setShowCctvDropdown])

  // 고속·시내 둘 다 해제되면 드롭다운 자동 닫힘
  useEffect(() => {
    if (!urbanActive && !cityActive) setShowCctvDropdown(false)
  }, [urbanActive, cityActive, setShowCctvDropdown])

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* ── 출처 표기 ── */}
      <div className="absolute bottom-1 right-2 z-[100] text-[10px] text-white/70 pointer-events-none select-none">
        교통정보 © ITS · UTIC
      </div>

      {/* ── 좌측 상단: 메뉴바 + 도구버튼 컬럼 ── */}
      <div className="absolute top-3 left-0 z-[200] flex flex-col items-start gap-1.5">

        {/* 메뉴 바 */}
        <div ref={cctvDropdownRef} className="relative">
          <div className="inline-flex items-center gap-0.5 bg-white border border-black/12 border-l-0 rounded-r-xl pl-3 pr-2 py-1 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">

            {/* 지도전환 */}
            <button onClick={() => setMapBaseType(v => v === 'normal' ? 'satellite' : 'normal')}
              className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-gray-900 text-white shadow-sm whitespace-nowrap flex-shrink-0 hover:bg-gray-700 transition-colors">
              {mapBaseType === 'normal' ? '위성' : '일반'}
            </button>

            <div className="w-px h-3.5 bg-black/15 flex-shrink-0 mx-0.5" />

            {/* CCTV 버튼 */}
            <div className="relative">
              <button onClick={() => setShowCctvDropdown(v => !v)}
                className={['px-2.5 py-0.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-0.5',
                  (urbanActive || cityActive) ? 'bg-blue-600 text-white' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'].join(' ')}>
                CCTV
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* CCTV 드롭다운 */}
              {showCctvDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-black/10 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] overflow-hidden z-[210] min-w-[110px]">
                  <button
                    onClick={() => toggleLayer('urban-cctv')}
                    className={['flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors',
                      urbanActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                    <span className={['w-2 h-2 rounded-full flex-shrink-0', urbanActive ? 'bg-blue-500' : 'bg-gray-300'].join(' ')} />
                    고속도로
                  </button>
                  <button
                    onClick={() => toggleLayer('city-cctv')}
                    className={['flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors',
                      cityActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                    <span className={['w-2 h-2 rounded-full flex-shrink-0', cityActive ? 'bg-blue-500' : 'bg-gray-300'].join(' ')} />
                    시내
                  </button>
                </div>
              )}
            </div>

            {/* 지적도 */}
            <button onClick={() => toggleLayer('cadastral')}
              className={['px-2.5 py-0.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0',
                cadastralActive ? 'bg-amber-500 text-white' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'].join(' ')}>
              지적도
            </button>

            <div className="w-px h-3.5 bg-black/15 flex-shrink-0 mx-0.5" />

            {/* 경로설정 */}
            <button onClick={() => setShowRoutePanel(v => !v)}
              className={['px-2.5 py-0.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex-shrink-0',
                showRoutePanel ? 'bg-gray-900 text-white' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'].join(' ')}>
              경로설정
            </button>

            <div className="w-px h-3.5 bg-black/15 flex-shrink-0 mx-0.5" />

            {/* 위치기억 */}
            <button onClick={toggleLocationMemory}
              className={['px-2 py-0.5 text-[10px] font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0',
                locationMemory ? 'bg-emerald-500 text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'].join(' ')}>
              {locationMemory ? '위치기억 ON' : '위치기억 OFF'}
            </button>
          </div>

        </div>

        {/* 도구 버튼 */}
        <button
          onClick={() => setToolDrawerOpen(o => !o)}
          className="flex items-center gap-1.5 active:scale-95 transition-all"
          style={{
            borderRadius: '0 10px 10px 0',
            background: toolDrawerOpen ? 'rgba(240,240,245,0.95)' : 'rgba(255,255,255,0.90)',
            color: '#111827',
            fontSize: 12,
            fontWeight: 600,
            paddingLeft: 12,
            paddingRight: 14,
            paddingTop: 6,
            paddingBottom: 6,
            boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.10)',
            borderLeft: 'none',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
          aria-label="도구 열기"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          도구
        </button>

      </div>

      {/* ── 도구 팝업 ── */}
      {toolDrawerOpen && (
        <>
          <div className="absolute inset-0 z-[298]" onClick={() => setToolDrawerOpen(false)} />
          <div
            className="absolute z-[299] bg-white border border-black/8 rounded-r-xl shadow-[0_4px_20px_rgba(0,0,0,0.18)] overflow-hidden animate-slide-from-wall"
            style={{ top: 88, left: 0, width: 160 }}
          >
            <div className="px-2 pt-2 pb-1">
              <p className="text-[9px] font-semibold text-gray-400 tracking-widest px-1 mb-0.5">지도 이동</p>
              <button onClick={() => { handleMyLocation(); setToolDrawerOpen(false) }} disabled={locationLoading || !isMapReady}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40 ${myLocation ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                {locationLoading
                  ? <svg className="animate-spin w-3.5 h-3.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="8"/></svg>
                }
                <span>내 위치</span>
                {myLocation && <span className="ml-auto text-[9px] text-blue-400">ON</span>}
              </button>
              <button onClick={() => { if (mapInstanceRef.current) mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() - 1) }} disabled={!isMapReady}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-40">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>확대</span>
              </button>
              <button onClick={() => { if (mapInstanceRef.current) mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() + 1) }} disabled={!isMapReady}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-40">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>축소</span>
              </button>
            </div>

            <div className="mx-2 border-t border-black/6" />

            <div className="px-2 pt-1 pb-2">
              <p className="text-[9px] font-semibold text-gray-400 tracking-widest px-1 mb-0.5">측정</p>
              <button onClick={() => { setMeasureMode(m => m === 'distance' ? null : 'distance'); setToolDrawerOpen(false) }} disabled={!isMapReady}
                className={['flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40',
                  measureMode === 'distance' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="9" width="20" height="7" rx="1.2" strokeWidth="1.6"/>
                  <line x1="7" y1="9" x2="7" y2="13" strokeWidth="1.4"/><line x1="12" y1="9" x2="12" y2="13" strokeWidth="1.4"/><line x1="17" y1="9" x2="17" y2="13" strokeWidth="1.4"/>
                  <line x1="4.5" y1="9" x2="4.5" y2="11.2" strokeWidth="1.1"/><line x1="9.5" y1="9" x2="9.5" y2="11.2" strokeWidth="1.1"/><line x1="14.5" y1="9" x2="14.5" y2="11.2" strokeWidth="1.1"/><line x1="19.5" y1="9" x2="19.5" y2="11.2" strokeWidth="1.1"/>
                </svg>
                <span>거리 측정</span>
                {measureMode === 'distance' && <span className="ml-auto text-[9px] text-indigo-400">ON</span>}
              </button>
              <button onClick={() => { setMeasureMode(m => m === 'area' ? null : 'area'); setToolDrawerOpen(false) }} disabled={!isMapReady}
                className={['flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40',
                  measureMode === 'area' ? 'bg-amber-50 text-amber-500' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,3 21,9 18,20 6,20 3,9"/></svg>
                <span>면적 측정</span>
                {measureMode === 'area' && <span className="ml-auto text-[9px] text-amber-400">ON</span>}
              </button>
              <button onClick={() => { setMeasureMode(m => m === 'radius' ? null : 'radius'); setToolDrawerOpen(false) }} disabled={!isMapReady}
                className={['flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40',
                  measureMode === 'radius' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'].join(' ')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><line x1="12" y1="12" x2="21" y2="12"/></svg>
                <span>반경 측정</span>
                {measureMode === 'radius' && <span className="ml-auto text-[9px] text-emerald-400">ON</span>}
              </button>
            </div>
          </div>
        </>
      )}

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
          onClear={() => { clearRoutes(); clearSelection() }}
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
      {selectedUrban && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 z-[100]">
          <div className="bg-gray-950/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-indigo-400 font-medium mb-0.5">도시교통 CCTV</p>
                <h3 className="text-white text-sm font-semibold leading-tight truncate">{getCctvName(selectedUrban)}</h3>
              </div>
              <button onClick={handleClosePopup} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <CctvMediaViewer url={getCctvUrl(selectedUrban)} name={getCctvName(selectedUrban)} reconnectKey={reconnectKey} />
          </div>
        </div>
      )}

      {/* ── 시내교통 CCTV 팝업 가로 모드: document.body에 포털로 렌더링 ── */}
      {/* 카카오맵 SDK의 CSS transform이 fixed 자식을 가로채므로 portal로 우회 */}
      {selectedCityItem && isLandscape && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'rgba(0,0,0,0.7)', flexShrink: 0 }}>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <p style={{ fontSize: '10px', color: '#2dd4bf', margin: 0 }}>{selectedCityItem.CENTERNAME}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCityItem.CCTVNAME}</p>
            </div>
            <button onClick={handleClosePopup} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <iframe
              src={buildCityCctvStreamUrl(selectedCityItem, mapBounds)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '177.78vh',
                height: '100%',
                transform: 'translate(-50%, -50%) scale(1.8)',
                transformOrigin: 'center center',
                border: 'none',
                background: '#000',
              }}
              title={selectedCityItem.CCTVNAME}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-fullscreen"
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── 시내교통 CCTV 팝업 세로 모드 ── */}
      {selectedCityItem && (
        !isLandscape ? (
          /* 세로 모드: 기존 팝업 */
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[100]">
            <div className="bg-gray-950/95 border border-teal-500/20 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-teal-400 font-medium mb-0.5">
                    시내교통 CCTV · {selectedCityItem.CENTERNAME}
                  </p>
                  <h3 className="text-white text-sm font-semibold leading-tight truncate">{selectedCityItem.CCTVNAME}</h3>
                </div>
                <button onClick={handleClosePopup} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <iframe
                src={buildCityCctvStreamUrl(selectedCityItem, mapBounds)}
                className="w-full rounded-lg bg-black"
                style={{ height: '200px', border: 'none' }}
                title={selectedCityItem.CCTVNAME}
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-fullscreen"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-gray-600">영상 재생은 60초만 제공됩니다 (UTIC)</p>
                <a href={buildCityCctvStreamUrl(selectedCityItem, mapBounds)} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-teal-400 hover:text-teal-300 underline">새창으로 보기</a>
              </div>
            </div>
          </div>
        ) : null
      )}
    </div>
  )
}
