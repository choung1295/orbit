"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef } from "react"
import Script from "next/script"

declare global {
  interface Window {
    kakao: any
  }
}

const SCRIPT_ID = "kakao-map-script"

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInitialized = useRef(false)

  const initMap = useCallback(() => {
    if (!window.kakao?.maps || mapInitialized.current) return
    window.kakao.maps.load(() => {
      if (!mapRef.current) return
      mapInitialized.current = true
      new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(36.5, 127.5),
        level: 13,
      })
    })
  }, [])

  useEffect(() => {
    if (window.kakao) initMap()
  }, [initMap])

  return (
    <>
      <Script
        id={SCRIPT_ID}
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />
    </>
  )
}
