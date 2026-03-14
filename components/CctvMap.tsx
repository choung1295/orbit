"use client"

import React, { useEffect, useRef, useState } from "react"
import KakaoMapLoader from "./KakaoMapLoader"
import Hls from "hls.js"

interface CCTVData {
  cctvname: string
  cctvurl: string
  cctvcoordx: string
  cctvcoordy: string
}

const CctvMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [cctvs, setCctvs] = useState<CCTVData[]>([])
  const [loading, setLoading] = useState(false) // Initially false to show the loading screen ONLY during actual fetch
  const [fetchInProgress, setFetchInProgress] = useState(false)
  const [debugStatus, setDebugStatus] = useState<string>("Initializing SDK...")

  // Fetch CCTV Data for a specific range
  const fetchCctvs = async (minX: number, maxX: number, minY: number, maxY: number) => {
    try {
      setFetchInProgress(true)
      setDebugStatus(`Fetching data (${minX.toFixed(2)}~${maxX.toFixed(2)})...`)
      const res = await fetch(`/api/traffic/cctv?minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}`)
      const data = await res.json()
      const items = data?.body?.items || []
      
      console.log(`Fetched ${items.length} items for range:`, { minX, maxX, minY, maxY })
      setCctvs(items.slice(0, 300))
      
      if (items.length === 0) {
        setDebugStatus("No items found. Zoom out or move the map.")
      } else {
        setDebugStatus(`Loaded ${items.length} markers.`)
      }
    } catch (error: any) {
      setDebugStatus(`Data Error: ${error.message}`)
    } finally {
      setTimeout(() => setFetchInProgress(false), 300)
    }
  }

  // Initialize Map
  const initMap = () => {
    if (!mapContainerRef.current || map) return
    
    try {
      console.log("Initializing Kakao Map...")
      const center = new window.kakao.maps.LatLng(37.4, 127.1) // Seongnam area
      const options = {
        center: center,
        level: 8,
      }
      const kakaoMap = new window.kakao.maps.Map(mapContainerRef.current, options)
      
      const zoomControl = new window.kakao.maps.ZoomControl()
      kakaoMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT)
      
      setMap(kakaoMap)
      setDebugStatus("Map Initialized.")
      
      // Initial fetch for the startup view
      fetchCctvs(127.0, 127.2, 37.3, 37.5)
    } catch (err: any) {
      setDebugStatus(`Map Error: ${err.message}`)
      console.error("Map initialization failed:", err)
    }
  }

  const handleRefresh = () => {
      if (!map) return
      const bounds = map.getBounds()
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      fetchCctvs(sw.getLng(), ne.getLng(), sw.getLat(), ne.getLat())
  }

  // Plot Markers
  useEffect(() => {
    if (!map || cctvs.length === 0) return

    const markers: any[] = []
    cctvs.forEach((cctv) => {
      const lat = parseFloat(cctv.cctvcoordy)
      const lng = parseFloat(cctv.cctvcoordx)
      if (isNaN(lat) || isNaN(lng)) return

      const markerPosition = new window.kakao.maps.LatLng(lat, lng)
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: cctv.cctvname,
      })

      marker.setMap(map)
      markers.push(marker)

      const content = document.createElement("div")
      content.className = "bg-[#1a1a1f] p-3 rounded-lg border border-gray-700 shadow-2xl w-72"
      content.style.marginBottom = "140px"
      
      const safeName = cctv.cctvname.replace(/[^a-zA-Z0-9가-힣]/g, "-")
      const containerId = `video-container-${safeName}`
      
      content.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-xs font-bold text-white truncate">${cctv.cctvname}</h3>
          <button class="close-btn text-gray-500 hover:text-white px-2 py-1 text-sm">✕</button>
        </div>
        <div id="${containerId}" class="aspect-video bg-black rounded overflow-hidden flex items-center justify-center">
            <span class="text-[10px] text-gray-600 italic">영상 로딩 중...</span>
        </div>
        <p class="mt-2 text-[10px] text-gray-500 text-center">도로 실시간 영상 (ITS)</p>
      `

      const overlay = new window.kakao.maps.CustomOverlay({
        content: content,
        position: markerPosition,
        yAnchor: 1,
      })

      window.kakao.maps.event.addListener(marker, "click", () => {
        overlay.setMap(map)
        setTimeout(() => {
          const container = document.getElementById(containerId)
          if (container) {
            container.innerHTML = ""
            const video = document.createElement("video")
            video.className = "w-full h-full rounded"
            video.controls = true
            video.autoplay = true
            video.muted = true
            video.playsInline = true
            container.appendChild(video)
            
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = cctv.cctvurl
            } else if (Hls.isSupported()) {
              const hls = new Hls()
              hls.loadSource(cctv.cctvurl)
              hls.attachMedia(video)
            }
          }
          content.querySelector(".close-btn")?.addEventListener("click", () => overlay.setMap(null))
        }, 50)
      })
    })

    return () => markers.forEach(m => m.setMap(null))
  }, [map, cctvs])

  return (
    <div className="space-y-4">
      <KakaoMapLoader onLoad={initMap} onError={setDebugStatus} />
      
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${map ? "bg-green-500 ring-2 ring-green-950" : "bg-red-500 animate-pulse"}`} />
            <span className="text-[11px] text-gray-400 font-mono italic">{debugStatus}</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-[11px] text-gray-500 font-mono">
                {cctvs.length} Markers
            </div>
            <button 
                onClick={handleRefresh}
                disabled={!map || fetchInProgress}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg"
            >
                현 위치에서 검색
            </button>
        </div>
      </div>

      <div className="relative h-[650px] w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-950">
        <div ref={mapContainerRef} className="w-full h-full" />
        {fetchInProgress && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-white text-sm font-medium">데이터 수신 중...</div>
            </div>
          </div>
        )}
        {!map && !fetchInProgress && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3 p-6 text-center max-w-sm">
              <div className="w-10 h-10 border-2 border-gray-600 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
              <div className="text-white text-base font-bold">지도 서비스를 초기화 중입니다</div>
              <p className="text-gray-400 text-xs">
                상태 메시지: <span className="text-amber-400">{debugStatus}</span><br/>
                오랫동안 멈춰있다면 <strong>F12-Console</strong> 에러를 확인해 주세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CctvMap
