'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'

type Mode = 'distance' | 'area' | 'radius'
type Point = { lat: number; lng: number }

function haversineM(a: Point, b: Point): number {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)}km` : `${Math.round(m)}m`
}

function fmtArea(m2: number): string {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)}km²`
  if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(2)}ha`
  return `${Math.round(m2).toLocaleString()}m²`
}

function polygonAreaM2(pts: Point[]): number {
  if (pts.length < 3) return 0
  const clat = (pts.reduce((s, p) => s + p.lat, 0) / pts.length) * Math.PI / 180
  const R = 6371000
  const xs = pts.map(p => p.lng * Math.PI / 180 * R * Math.cos(clat))
  const ys = pts.map(p => p.lat * Math.PI / 180 * R)
  let area = 0
  for (let i = 0; i < xs.length; i++) {
    const j = (i + 1) % xs.length
    area += xs[i] * ys[j] - xs[j] * ys[i]
  }
  return Math.abs(area / 2)
}

interface Props {
  map: any
  mode: Mode
  onClose: () => void
}

export default function MeasureTool({ map, mode, onClose }: Props) {
  const [points, setPoints] = useState<Point[]>([])
  const [finished, setFinished] = useState(false)
  const overlaysRef = useRef<any[]>([])
  const dotMarkersRef = useRef<any[]>([])
  const previewLineRef = useRef<any>(null)
  const pointsRef = useRef<Point[]>([])
  const finishedRef = useRef(false)

  const clearAll = () => {
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []
    dotMarkersRef.current.forEach(d => d.setMap(null))
    dotMarkersRef.current = []
  }

  const clearPreview = () => {
    if (previewLineRef.current) {
      previewLineRef.current.halo?.setMap(null)
      previewLineRef.current.line?.setMap(null)
      previewLineRef.current = null
    }
  }

  const addDot = (p: Point) => {
    const dot = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(p.lat, p.lng),
      content: '<div style="width:8px;height:8px;background:#6366f1;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35);transform:translate(-4px,-4px)"></div>',
      zIndex: 10,
    })
    dot.setMap(map)
    dotMarkersRef.current.push(dot)
  }

  const drawShapes = (pts: Point[]) => {
    clearAll()
    if (pts.length === 0) return
    pts.forEach(addDot)

    if (mode === 'distance' && pts.length >= 2) {
      const path = pts.map(p => new window.kakao.maps.LatLng(p.lat, p.lng))
      const line = new window.kakao.maps.Polyline({
        path, strokeWeight: 3, strokeColor: '#6366f1', strokeOpacity: 0.9, strokeStyle: 'solid',
      })
      line.setMap(map)
      overlaysRef.current.push(line)
    }

    if (mode === 'area' && pts.length >= 2) {
      const path = pts.map(p => new window.kakao.maps.LatLng(p.lat, p.lng))
      const poly = new window.kakao.maps.Polygon({
        path, strokeWeight: 2, strokeColor: '#f59e0b', strokeOpacity: 0.9,
        fillColor: '#fbbf24', fillOpacity: 0.15,
      })
      poly.setMap(map)
      overlaysRef.current.push(poly)
    }

    if (mode === 'radius' && pts.length === 2) {
      const r = haversineM(pts[0], pts[1])
      const circle = new window.kakao.maps.Circle({
        center: new window.kakao.maps.LatLng(pts[0].lat, pts[0].lng),
        radius: r, strokeWeight: 2, strokeColor: '#10b981', strokeOpacity: 0.9,
        fillColor: '#34d399', fillOpacity: 0.1,
      })
      circle.setMap(map)
      overlaysRef.current.push(circle)
    }
  }

  // 지도 클릭 → 점 추가
  useEffect(() => {
    const handler = (e: any) => {
      if (finishedRef.current) return
      const lat = e.latLng.getLat()
      const lng = e.latLng.getLng()
      setPoints(prev => {
        if (mode === 'radius' && prev.length >= 2) return prev
        const next = [...prev, { lat, lng }]
        pointsRef.current = next
        return next
      })
    }
    window.kakao.maps.event.addListener(map, 'click', handler)
    return () => {
      window.kakao.maps.event.removeListener(map, 'click', handler)
      clearAll()
      clearPreview()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mode])

  // 우클릭 → 미리보기 선 종료
  useEffect(() => {
    const rightClickHandler = () => {
      finishedRef.current = true
      setFinished(true)
      clearPreview()
    }
    window.kakao.maps.event.addListener(map, 'rightclick', rightClickHandler)
    return () => {
      window.kakao.maps.event.removeListener(map, 'rightclick', rightClickHandler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // 마우스 이동 → 미리보기 선
  useEffect(() => {
    const moveHandler = (e: any) => {
      if (finishedRef.current) return
      const pts = pointsRef.current
      if (pts.length === 0) return
      if (mode === 'radius' && pts.length >= 2) return

      const mouse = e.latLng
      const last = pts[pts.length - 1]
      const previewPath = [new window.kakao.maps.LatLng(last.lat, last.lng), mouse]

      clearPreview()
      const color = mode === 'distance' ? '#6366f1' : mode === 'area' ? '#f59e0b' : '#10b981'
      // 흰색 외곽선(halo) - 위성지도에서도 잘 보이게
      const halo = new window.kakao.maps.Polyline({
        path: previewPath,
        strokeWeight: 5,
        strokeColor: '#ffffff',
        strokeOpacity: 0.7,
        strokeStyle: 'dashed',
      })
      halo.setMap(map)
      const line = new window.kakao.maps.Polyline({
        path: previewPath,
        strokeWeight: 2,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeStyle: 'dashed',
      })
      line.setMap(map)
      // halo와 line 둘 다 저장 (clearPreview에서 제거)
      previewLineRef.current = { halo, line }
    }

    window.kakao.maps.event.addListener(map, 'mousemove', moveHandler)
    return () => {
      window.kakao.maps.event.removeListener(map, 'mousemove', moveHandler)
      clearPreview()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mode])

  useEffect(() => {
    pointsRef.current = points
    drawShapes(points)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  // 측정 결과
  const result = (() => {
    if (mode === 'distance' && points.length >= 2) {
      let total = 0
      for (let i = 1; i < points.length; i++) total += haversineM(points[i - 1], points[i])
      return `총 거리: ${fmtDist(total)}`
    }
    if (mode === 'area' && points.length >= 3) {
      return `면적: ${fmtArea(polygonAreaM2(points))}`
    }
    if (mode === 'radius' && points.length === 2) {
      return `반경: ${fmtDist(haversineM(points[0], points[1]))}`
    }
    return null
  })()

  const hint = finished
    ? '우클릭으로 완료 · 초기화로 다시 측정'
    : mode === 'distance' ? '클릭으로 점 추가 · 우클릭으로 완료'
    : mode === 'area' ? '클릭으로 점 추가 (3점 이상) · 우클릭으로 완료'
    : '중심점 → 반경점 순서로 클릭하세요'

  const modeLabel = mode === 'distance' ? '거리 측정' : mode === 'area' ? '면적 측정' : '반경 측정'
  const color = mode === 'distance' ? 'text-indigo-600' : mode === 'area' ? 'text-amber-500' : 'text-emerald-600'

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[300]">
      <div className="bg-white border border-black/10 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[280px]">
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-semibold mb-0.5 ${color}`}>{modeLabel}</p>
          {result
            ? <p className="text-sm font-bold text-gray-900">{result}</p>
            : <p className="text-xs text-gray-400">{hint}</p>
          }
        </div>
        <button
          onClick={() => { setPoints([]); finishedRef.current = false; setFinished(false) }}
          className="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          초기화
        </button>
        <button
          onClick={() => { clearAll(); setPoints([]); onClose() }}
          className="px-2.5 py-1 text-[11px] font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          완료
        </button>
      </div>
    </div>
  )
}
