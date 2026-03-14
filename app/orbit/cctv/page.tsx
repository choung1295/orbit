import CctvMap from "@/components/ui/CctvMap"

export default function CctvPage() {
  return (
    <main className="min-h-screen bg-[#0f0f11] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">?¤ì‹œê°?êµí†µ CCTV</h1>
          <p className="text-gray-400">êµ??êµí†µ?•ë³´?¼í„°(ITS)?ì„œ ?œê³µ?˜ëŠ” ?¤ì‹œê°??„êµ­ ?„ë¡œ ?í™©?…ë‹ˆ??</p>
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
