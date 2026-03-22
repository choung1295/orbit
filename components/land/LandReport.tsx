"use client"

import { useState } from "react"
import { Search, MapPin, AlertCircle } from "lucide-react"
import KakaoLandMap from "./KakaoLandMap"

interface LandData {
    address: string
    lat: number
    lng: number
    area: string | null
    officialPrice: string | null
    total: string | null
    use: string | null
}

export default function LandReport() {
    const [query, setQuery] = useState("")
    const [data, setData] = useState<LandData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setData(null)

        try {
            const res = await fetch(`/api/land?address=${encodeURIComponent(query.trim())}`)
            const json = await res.json()

            if (!res.ok) {
                setError(json.error ?? "조회 중 오류가 발생했습니다.")
                setLoading(false)
                return
            }

            setData(json)
            setLoading(false)
        } catch {
            setError("서버 연결에 실패했습니다.")
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
            {/* 검색 입력 */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="지번 또는 주소 입력 (예: 충남 아산시 음봉면 신휴리 378-12)"
                        style={{ color: "#111" }}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                    />
                    {!query && (
                        <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none select-none">
                            지번 또는 주소 입력 (예: 충남 아산시 음봉면 신휴리 378-12)
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
                >
                    <Search className="w-4 h-4" />
                    조회
                </button>
            </form>

            {/* 에러 */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* 로딩 스켈레톤 */}
            {loading && (
                <div className="flex flex-col gap-3">
                    <div className="w-full aspect-square rounded-2xl bg-gray-100 animate-pulse" />
                    <div className="w-full h-20 rounded-2xl bg-gray-100 animate-pulse" />
                </div>
            )}

            {/* 결과 */}
            {data && !loading && (
                <div className="flex flex-col gap-3">
                    {/* 카카오 지도 */}
                    <KakaoLandMap lat={data.lat} lng={data.lng} address={data.address} />

                    {/* 위치 카드 */}
                    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white px-5 py-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">위치</span>
                        <span className="text-sm text-gray-800 font-medium">{data.address}</span>
                        <span className="text-xs text-gray-400">
                            {data.lat.toFixed(6)}, {data.lng.toFixed(6)}
                        </span>
                    </div>

                    {/* 토지 정보 카드 */}
                    {(data.area || data.use || data.officialPrice) && (
                        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white px-5 py-4 grid grid-cols-2 gap-y-3 gap-x-4">
                            {data.area && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400">면적</span>
                                    <span className="text-sm font-medium text-gray-800">{data.area}</span>
                                </div>
                            )}
                            {data.use && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400">용도지역</span>
                                    <span className="text-sm font-medium text-gray-800">{data.use}</span>
                                </div>
                            )}
                            {data.officialPrice && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400">공시지가</span>
                                    <span className="text-sm font-medium text-gray-800">{data.officialPrice}</span>
                                </div>
                            )}
                            {data.total && (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400">합계</span>
                                    <span className="text-sm font-medium text-gray-800">{data.total}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
