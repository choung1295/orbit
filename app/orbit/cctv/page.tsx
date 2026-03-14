import dynamic from "next/dynamic"

const CctvMap = dynamic(() => import("@/components/CctvMap"), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full flex items-center justify-center bg-gray-900 text-white">지도를 불러오는 중...</div>
})

export default function CctvPage() {
  return (
    <main className="min-h-screen bg-[#0f0f11] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">실시간 교통 CCTV</h1>
          <p className="text-gray-400">국가교통정보센터(ITS)에서 제공하는 실시간 전국 도로 상황입니다.</p>
        </header>

        <section className="animate-fade-in">
          <CctvMap />
        </section>

        <footer className="text-center text-xs text-gray-600">
          &copy; Orbit AI - Data provided by ITS
        </footer>
      </div>
    </main>
  )
}
