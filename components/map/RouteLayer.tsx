'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react'
import { RouteData } from '../route/useRoute'

const COLOR_SELECTED = '#6366f1'
const COLOR_UNSELECTED = '#94a3b8'

interface Props {
  map: any
  routes: RouteData[]
}

export default function RouteLayer({ map, routes }: Props) {
  const polylinesRef = useRef<any[]>([])

  useEffect(() => {
    if (!map || !window.kakao?.maps) return

    // 기존 폴리라인 제거
    polylinesRef.current.forEach(p => p.setMap(null))
    polylinesRef.current = []

    if (routes.length === 0) return

    routes.forEach(route => {
      if (route.polyline.length === 0) return

      const path = route.polyline.map(
        pt => new window.kakao.maps.LatLng(pt.lat, pt.lng)
      )

      const polyline = new window.kakao.maps.Polyline({
        path,
        strokeWeight: route.isSelected ? 6 : 4,
        strokeColor: route.isSelected ? COLOR_SELECTED : COLOR_UNSELECTED,
        strokeOpacity: route.isSelected ? 0.9 : 0.45,
        strokeStyle: 'solid',
      })
      polyline.setMap(map)
      polylinesRef.current.push(polyline)
    })

    // 선택된 경로로 지도 뷰 맞춤
    const selected = routes.find(r => r.isSelected)
    if (selected && selected.polyline.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds()
      selected.polyline.forEach(pt =>
        bounds.extend(new window.kakao.maps.LatLng(pt.lat, pt.lng))
      )
      map.setBounds(bounds, 60)  // 60px 여백
    }

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null))
      polylinesRef.current = []
    }
  }, [map, routes])

  return null
}
