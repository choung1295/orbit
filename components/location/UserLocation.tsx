'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'

const MY_LOCATION_MARKER_IMG = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="13" fill="white"/><circle cx="14" cy="14" r="9" fill="#EF4444"/><circle cx="14" cy="14" r="3.5" fill="white"/></svg>'
)

interface Props {
  map: any
  isMapReady: boolean
  myLocation: { lat: number; lng: number } | null
  onLocationChange: (loc: { lat: number; lng: number } | null) => void
  is4kmFilterActive: boolean
  onFilterChange: (active: boolean) => void
}

export default function UserLocation({
  map,
  isMapReady,
  myLocation,
  onLocationChange,
  is4kmFilterActive,
  onFilterChange,
}: Props) {
  const myMarkerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // 위치 마커 + 정확도 원 지도에 표시
  useEffect(() => {
    if (!map || !myLocation) return
    const position = new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng)

    if (myMarkerRef.current) {
      myMarkerRef.current.setMap(null)
      myMarkerRef.current = null
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setMap(null)
      accuracyCircleRef.current = null
    }

    const locMarkerImage = new window.kakao.maps.MarkerImage(
      MY_LOCATION_MARKER_IMG,
      new window.kakao.maps.Size(28, 28),
      { offset: new window.kakao.maps.Point(14, 14) }
    )

    myMarkerRef.current = new window.kakao.maps.Marker({
      position,
      map,
      image: locMarkerImage,
    })

    // 정확도 반경 원 표시
    if (accuracy && accuracy > 0) {
      accuracyCircleRef.current = new window.kakao.maps.Circle({
        center: position,
        radius: accuracy,
        strokeWeight: 1,
        strokeColor: '#6366f1',
        strokeOpacity: 0.5,
        fillColor: '#6366f1',
        fillOpacity: 0.08,
      })
      accuracyCircleRef.current.setMap(map)
    }

    map.setCenter(position)
    map.setLevel(5)
  }, [map, myLocation, accuracy])

  // 에러 자동 제거
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(t)
  }, [error])

  // 언마운트 시 watch 정리
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  const handleMyLocation = async () => {
    if (!isMapReady || !window.kakao?.maps) {
      setError('지도가 아직 준비되지 않았습니다.')
      return
    }

    // 이전 watch 정리
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    setIsLoading(true)
    let bestAccuracy = Infinity
    let geoReturned = false

    // 1) IP 기반 위치를 먼저 빠르게 가져옴 (브라우저 위치 오기 전 초기값으로 사용)
    fetch('/api/geoip')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || data.error) return
        // 브라우저 위치가 아직 안 왔거나, IP 위치가 더 정확할 때만 사용
        if (!geoReturned || data.accuracy < bestAccuracy) {
          bestAccuracy = data.accuracy
          setAccuracy(data.accuracy)
          onLocationChange({ lat: data.lat, lng: data.lng })
        }
      })
      .catch(() => null)

    if (!navigator.geolocation) {
      setIsLoading(false)
      return
    }

    // 2) 브라우저 geolocation으로 더 정확한 위치 획득 시 덮어씀
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const acc = pos.coords.accuracy
        geoReturned = true
        if (acc < bestAccuracy) {
          bestAccuracy = acc
          setAccuracy(acc)
          onLocationChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }
        setIsLoading(false)

        // 정확도 50m 이하면 충분 → watch 중단
        if (acc <= 50 && watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      },
      () => {
        // 브라우저 위치 실패해도 IP 위치가 있으면 그냥 사용
        setIsLoading(false)
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )

    // 20초 후 강제 종료
    setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        setIsLoading(false)
      }
    }, 20000)
  }

  return (
    <>
      {/* 에러 토스트 */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-[110] flex justify-center pointer-events-none">
          <div className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-full shadow-lg border border-rose-400">
            {error}
          </div>
        </div>
      )}

      {/* 우측 하단 버튼 그룹 */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2" style={{ zIndex: 100 }}>
        {myLocation && (
          <button
            onClick={() => onFilterChange(!is4kmFilterActive)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-lg transition-all border whitespace-nowrap ${
              is4kmFilterActive
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white text-indigo-600 border-indigo-300'
            }`}
          >
            {is4kmFilterActive ? '전체 CCTV' : '주변 4km'}
          </button>
        )}

        {/* 정확도 표시 */}
        {accuracy !== null && myLocation && (
          <div className="px-2 py-1 bg-white/90 text-[10px] text-gray-500 rounded-full shadow border border-gray-200 whitespace-nowrap">
            정확도 ±{accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`}
          </div>
        )}

        <button
          onClick={handleMyLocation}
          disabled={isLoading || !isMapReady}
          title="내 위치 찾기"
          className="w-11 h-11 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-90 transition-all disabled:opacity-60 flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
