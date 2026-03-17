'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    kakao: any
  }
}

const SCRIPT_ID = "kakao-map-script"

const CCTV_MARKER_IMG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="6" fill="#6366f1" stroke="#ffffff" stroke-width="1.5"/></svg>'
)
const MY_LOCATION_MARKER_IMG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="#ff00ff" stroke="#ffffff" stroke-width="2"/></svg>'
)

interface CctvItem {
  cctvname?: string; cctvName?: string; name?: string;
  coordx?: number | string; coordX?: number | string; longitude?: number | string; lng?: number | string; lon?: number | string;
  coordy?: number | string; coordY?: number | string; latitude?: number | string; lat?: number | string;
  cctvurl?: string; cctvUrl?: string; url?: string;
}

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
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function CctvMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [isMapReady, setIsMapReady] = useState(false)
  const [cctvList, setCctvList] = useState<CctvItem[]>([])
  const [selected, setSelected] = useState<CctvItem | null>(null)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const myMarkerRef = useRef<any>(null)
  const [locError, setLocError] = useState<string | null>(null)
  const [isLoadingLoc, setIsLoadingLoc] = useState(false)
  const [is4kmFilterActive, setIs4kmFilterActive] = useState(false)

  const initMap = useCallback(() => {
    if (!window.kakao?.maps || mapInstanceRef.current) return
    window.kakao.maps.load(() => {
      if (!mapRef.current) return
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(36.5, 127.5),
        level: 13,
      })
      mapInstanceRef.current = map
      setIsMapReady(true)
    })
  }, [])

  useEffect(() => {
    if (window.kakao) initMap()
  }, [initMap])

  useEffect(() => {
    const fetchCctvData = async () => {
      try {
        const res = await fetch('/api/traffic/cctv?minX=124.0&maxX=132.0&minY=33.0&maxY=43.0')
        const data = await res.json()
        setCctvList(
          Array.isArray(data?.response?.data ?? data?.data ?? data)
            ? (data?.response?.data ?? data?.data ?? data)
            : []
        )
      } catch {
        console.error('CCTV 데이터를 불러올 수 없습니다.')
      }
    }
    fetchCctvData()
  }, [])

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    cctvList.forEach(item => {
      const lng = getLng(item)
      const lat = getLat(item)
      if (lng == null || lat == null || lng < 124 || lng > 132 || lat < 33 || lat > 43) return
      if (is4kmFilterActive && myLocation && getDistance(myLocation.lat, myLocation.lng, lat, lng) > 4.0) return

      const markerImage = new window.kakao.maps.MarkerImage(
        CCTV_MARKER_IMG,
        new window.kakao.maps.Size(14, 14),
        { offset: new window.kakao.maps.Point(7, 7) }
      )

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        map: mapInstanceRef.current,
        image: markerImage,
        title: getName(item),
      })

      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelected(item)
      })

      markersRef.current.push(marker)
    })
  }, [isMapReady, cctvList, is4kmFilterActive, myLocation])

  useEffect(() => {
    if (!isMapReady || !myLocation || !mapInstanceRef.current) return
    const position = new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng)
    mapInstanceRef.current.setCenter(position)
    mapInstanceRef.current.setLevel(5)
  }, [isMapReady, myLocation])

  function showLocError(msg: string) {
    setLocError(msg)
    setTimeout(() => setLocError(null), 3000)
  }

  const handleMyLocation = () => {
    if (!isMapReady || !window.kakao?.maps) {
      showLocError('지도가 아직 준비되지 않았습니다.')
      return
    }
    if (!navigator.geolocation) {
      showLocError('위치 기능을 지원하지 않습니다.')
      return
    }
    setIsLoadingLoc(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const position = new window.kakao.maps.LatLng(lat, lng)

        if (myMarkerRef.current) {
          myMarkerRef.current.setMap(null)
          myMarkerRef.current = null
        }

        const locMarkerImage = new window.kakao.maps.MarkerImage(
          MY_LOCATION_MARKER_IMG,
          new window.kakao.maps.Size(20, 20),
          { offset: new window.kakao.maps.Point(10, 10) }
        )

        const marker = new window.kakao.maps.Marker({
          position,
          map: mapInstanceRef.current,
          image: locMarkerImage,
        })

        myMarkerRef.current = marker
        setMyLocation({ lat, lng })
        setIsLoadingLoc(false)
      },
      (err) => {
        setIsLoadingLoc(false)
        let msg = '위치를 가져올 수 없습니다.'
        if (err.code === 1) msg = '위치 권한이 거부되었습니다.'
        showLocError(msg)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border-4 border-gray-800/10 shadow-2xl bg-gray-200 h-[65dvh] md:h-[600px]">
      <Script
        id={SCRIPT_ID}
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      <div
        className="fixed bottom-10 left-4 right-4 md:absolute md:top-4 md:bottom-auto flex flex-wrap justify-center md:justify-end gap-3 pointer-events-none"
        style={{ zIndex: 9999999 }}
      >
        <button
          onClick={handleMyLocation}
          disabled={isLoadingLoc || !isMapReady}
          className="pointer-events-auto px-6 py-3 bg-[#6366f1] text-white font-black text-sm rounded-2xl shadow-[0_10px_40px_rgba(99,102,241,0.6)] hover:bg-indigo-700 active:scale-90 transition-all disabled:opacity-70 flex items-center gap-2 border-2 border-white whitespace-nowrap"
        >
          {isLoadingLoc ? '탐색 중...' : '📍 내 위치 찾기'}
        </button>

        {myLocation && (
          <button
            onClick={() => setIs4kmFilterActive(!is4kmFilterActive)}
            className={`pointer-events-auto px-6 py-3 font-black text-sm rounded-2xl shadow-2xl active:scale-90 transition-all border-2 whitespace-nowrap ${
              is4kmFilterActive
                ? 'bg-emerald-500 text-white border-white'
                : 'bg-white text-indigo-600 border-indigo-500'
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
              <h3 className="text-white text-sm md:text-base font-black leading-tight mb-2">
                {getName(selected)}
              </h3>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}