"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, MapPin, AlertCircle } from "lucide-react"

interface LandData {
    address: string
    lat: number
    lng: number
    imageUrl: string
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
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageFailed, setImageFailed] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setData(null)
        setImageLoaded(false)
        setImageFailed(false)

        try {
            const res = await fetch(`/api/land?address=${encodeURIComponent(query.trim())}`)
            const json = await res.json()

            if (!res.ok) {
                setError(json.error ?? "조회 중 오류가 발생했습니다.")
                return
            }

            setData(json)
        } catch {
            setError("서버 연결에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
            {/* 검색 입력 */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="지번 또는 주소 입력 (예: 경기도 평택시 서정동 123)"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white placeholder:text-gray-400 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
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

            {/* 로딩 */}
            {loading && (
                <div className="flex flex-col gap-3">
                    {/* 이미지 스켈레톤 */}
                    <div className="w-full aspect-video rounded-2xl bg-gray-100 animate-pulse" />
                    {/* 카드 스켈레톤 */}
                    <div className="w-full h-24 rounded-2xl bg-gray-100 animate-pulse" />
                </div>
            )}

            {/* 결과 */}
            {data && !loading && (
                <div className="flex flex-col gap-3">
                    {/* 위성 이미지 카드 */}
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
                        <div className="relative w-full aspect-video bg-gray-100">
                            {!imageLoaded && !imageFailed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                                    <span className="text-xs text-gray-400">위성 이미지 불러오는 중...</span>
                                </div>
                            )}

                            {imageFailed ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 gap-1.5">
                                    <AlertCircle className="w-5 h-5 text-gray-400" />
                                    <span className="text-xs text-gray-400">이미지 불러오기 실패</span>
                                </div>
                            ) : (
                                <Image
                                    src={data.imageUrl}
                                    alt={`${data.address} 위성 이미지`}
                                    fill
                                    className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageFailed(true)}
                                    unoptimized
                                />
                            )}
                        </div>

                        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-500">위성 기준 참고 이미지 · 실제 현장과 차이가 있을 수 있습니다</p>
                        </div>
                    </div>

                    {/* 주소 정보 카드 */}
                    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white px-5 py-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-indigo-500 uppercase tracking-wide">위치</span>
                        <span className="text-sm text-gray-800 font-medium">{data.address}</span>
                        <span className="text-xs text-gray-400">
                            {data.lat.toFixed(6)}, {data.lng.toFixed(6)}
                        </span>
                    </div>

                    {/* 토지 정보 카드 (데이터 있을 때만) */}
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
