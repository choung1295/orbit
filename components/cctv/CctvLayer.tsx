'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react'
import { CctvItem, getCctvLat, getCctvLng, getCctvName, getCctvMarkerImg, getCctvMarkerSize, CLUSTER_STYLES } from './cctvUtils'

interface Props {
  map: any
  cctvList: CctvItem[]
  zoomLevel: number
  onSelect: (item: CctvItem) => void
}

export default function CctvLayer({ map, cctvList, zoomLevel, onSelect }: Props) {
  const clustererRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !window.kakao?.maps) return

    // 기존 클러스터러 제거
    if (clustererRef.current) {
      clustererRef.current.clear()
      clustererRef.current.setMap(null)
      clustererRef.current = null
    }

    if (cctvList.length === 0) return

    const size = getCctvMarkerSize(zoomLevel)
    const half = Math.round(size / 2)
    const markerImage = new window.kakao.maps.MarkerImage(
      getCctvMarkerImg(size),
      new window.kakao.maps.Size(size, size),
      { offset: new window.kakao.maps.Point(half, half) }
    )

    const markers: any[] = []
    cctvList.forEach(item => {
      const lat = getCctvLat(item)
      const lng = getCctvLng(item)
      if (lat == null || lng == null) return

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        image: markerImage,
        title: getCctvName(item),
      })
      window.kakao.maps.event.addListener(marker, 'click', () => onSelect(item))
      markers.push(marker)
    })

    clustererRef.current = new window.kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 10,
      disableClickZoom: false,
      markers,
      styles: CLUSTER_STYLES,
    })

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clear()
        clustererRef.current.setMap(null)
        clustererRef.current = null
      }
    }
  }, [map, cctvList, zoomLevel, onSelect])

  return null
}
