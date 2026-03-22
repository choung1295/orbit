"use client"

import { useEffect, useRef, useState } from "react"

declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Window { kakao: any }
}

interface Props {
    lat: number
    lng: number
    address: string
}

export default function KakaoLandMap({ lat, lng, address }: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null)
    const [cadastral, setCadastral] = useState(false)
    const [satellite, setSatellite] = useState(true)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const initMap = () => {
            if (!mapRef.current) return

            const center = new window.kakao.maps.LatLng(lat, lng)
            const map = new window.kakao.maps.Map(mapRef.current, {
                center,
                level: 3,
                mapTypeId: window.kakao.maps.MapTypeId.HYBRID,
            })

            const marker = new window.kakao.maps.Marker({ position: center, map })
            marker.setMap(map)

            map.addControl(
                new window.kakao.maps.ZoomControl(),
                window.kakao.maps.ControlPosition.RIGHT
            )

            mapInstanceRef.current = map
            setReady(true)
        }

        if (window.kakao?.maps) {
            window.kakao.maps.load(initMap)
        } else {
            const SCRIPT_ID = "kakao-map-script"
            if (!document.getElementById(SCRIPT_ID)) {
                const s = document.createElement("script")
                s.id = SCRIPT_ID
                s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`
                s.onload = () => window.kakao.maps.load(initMap)
                document.head.appendChild(s)
            }
        }
    }, [lat, lng])

    // 위성/일반 전환
    useEffect(() => {
        if (!mapInstanceRef.current || !ready) return
        mapInstanceRef.current.setMapTypeId(
            satellite
                ? window.kakao.maps.MapTypeId.HYBRID
                : window.kakao.maps.MapTypeId.ROADMAP
        )
    }, [satellite, ready])

    // 지번도 토글
    useEffect(() => {
        if (!mapInstanceRef.current || !ready) return
        if (cadastral) {
            mapInstanceRef.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT)
        } else {
            mapInstanceRef.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT)
        }
    }, [cadastral, ready])

    return (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
            <div ref={mapRef} className="w-full" style={{ height: 400 }} />

            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate">{address}</p>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                        onClick={() => setSatellite(v => !v)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                            satellite
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        위성
                    </button>
                    <button
                        onClick={() => setCadastral(v => !v)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                            cadastral
                                ? "bg-amber-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        지번도
                    </button>
                </div>
            </div>
        </div>
    )
}
