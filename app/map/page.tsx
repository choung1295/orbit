"use client"

import { useEffect, useRef } from "react"

declare global {
    interface Window {
        vw: {
            Map2D: new (id: string, options: object) => unknown
        }
    }
}

const VWORLD_API_KEY = "7DD6167F-10F4-3194-ABED-DC50B40B6695"
const SCRIPT_ID = "vworld-script"

export default function MapPage() {
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const initMap = () => {
            if (!window.vw || !mapRef.current) return
            new window.vw.Map2D("vworld-map", {
                basemap: "korean",
                center: { x: 127.5, y: 36.5 },
                zoom: 7,
            })
        }

        // 중복 방지
        if (document.getElementById(SCRIPT_ID)) {
            initMap()
            return
        }

        const script = document.createElement("script")
        script.id = SCRIPT_ID
        script.src = `https://map.vworld.kr/js/vworldMapInit.js.do?version=2.0&apiKey=${VWORLD_API_KEY}`
        script.async = true
        script.onload = () => initMap()
        document.head.appendChild(script)
    }, [])

    return (
        <div
            id="vworld-map"
            ref={mapRef}
            style={{ width: "100%", height: "100vh" }}
        />
    )
}