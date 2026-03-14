"use client"

import React, { useEffect } from "react"

interface KakaoMapLoaderProps {
  onLoad: () => void
  onError: (msg: string) => void
}

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
      }
    }
  }
}

const KakaoMapLoader: React.FC<KakaoMapLoaderProps> = ({ onLoad, onError }) => {
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

  useEffect(() => {
    if (!apiKey || apiKey === "YOUR_KAKAO_JS_KEY_HERE") return

    if (window.kakao && window.kakao.maps) {
      onLoad()
      return
    }

    const script = document.createElement("script")
    script.id = "kakao-maps-manual"
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`
    script.async = true

    script.onload = () => {
      console.log("Kakao SDK script loaded manually.")
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log("Kakao Maps core ready.")
          onLoad()
        })
      }
    }

    script.onerror = () => {
      onError("SDK 로드 실패: 브라우저 확장 프로그램(광고 제거 등)이나 네트워크 환경을 확인해 주세요.")
    }

    document.head.appendChild(script)
  }, [apiKey, onLoad, onError])

  if (!apiKey || apiKey === "YOUR_KAKAO_JS_KEY_HERE") {
    return (
      <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-amber-200 text-sm">
        카카오 지도 JavaScript 키가 설정되지 않았습니다.<br />
        <code>.env.local</code> 파일에 <code>NEXT_PUBLIC_KAKAO_MAP_API_KEY</code>를 입력해 주세요.
      </div>
    )
  }

  return null
}

export default KakaoMapLoader