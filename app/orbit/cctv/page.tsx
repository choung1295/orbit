import Link from 'next/link'
import CctvMap from "@/components/CctvMap"

export default function CctvPage() {
  return (
    <main className="h-screen flex flex-col bg-[#0f0f11] overflow-hidden">
      {/* 헤더 */}
      <header className="flex items-center h-14 px-4 border-b border-[#1e1e26] flex-shrink-0">
        <Link
          href="/orbit"
          className="text-sm font-medium text-[#888899] hover:opacity-70 transition-opacity"
        >
          Orbit AI
        </Link>
        <span className="mx-2 text-[#333340] text-sm">/</span>
        <span className="text-sm font-medium text-white">교통 CCTV</span>
      </header>

      {/* 지도 (나머지 전체 높이) */}
      <div className="flex-1 min-h-0">
        <CctvMap />
      </div>
    </main>
  )
}
