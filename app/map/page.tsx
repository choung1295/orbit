"use client"

import { useEffect, useRef } from "react"

declare global {
    interface Window {
        kakao: any
    }
}

const SCRIPT_ID = "kakao-map-script"

export default function MapPage() {
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const initMap = () => {
            if (!window.kakao || !mapRef.current) return
            window.kakao.maps.load(() => {
                const map = new window.kakao.maps.Map(mapRef.current, {
                    center: new window.kakao.maps.LatLng(36.5, 127.5),
                    level: 13,
                })
            })
        }

        if (document.getElementById(SCRIPT_ID)) {
            initMap()
            return
        }

        const script = document.createElement("script")
        script.id = SCRIPT_ID
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`
        script.async = true
        script.onload = () => initMap()
        document.head.appendChild(script)
    }, [])

    return (
        <div
            ref={mapRef}
            style={{ width: "100%", height: "100vh" }}
        />
    )
}