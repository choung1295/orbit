import Link from 'next/link'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
            {/* 배경 그라디언트 오버 */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)`,
                        backgroundSize: '80px 80px',
                    }}
                />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in">
                {/* 뱃지 */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Chat Platform
                </div>

                {/* 헤드라인 */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#f0f0f5] leading-[1.1] mb-6">
                    Think faster with{' '}
                    <span className="gradient-text">Orbit AI</span>
                </h1>

                {/* 서브 카피 */}
                <p className="text-xl text-[#a0a0b0] max-w-2xl mx-auto mb-10 leading-relaxed">
                    The AI chat workspace built for deep work. Multi-model support,
                    real-time sync, and powerful context — all in one place.
                </p>

                {/* CTA 버튼 */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/auth/signup"
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition-all"
                    >
                        회원가입
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#22222a] hover:bg-[#2a2a35] rounded-xl font-semibold text-white transition-all"
                    >
                        로그인
                    </Link>
                </div>

                {/* 소셜 프루프 */}
                <p className="mt-10 text-sm text-[#606070]">
                    <Zap className="inline w-4 h-4 text-yellow-500 mr-1" />
                    No credit card required &bull; Free plan always available
                </p>

                {/* 앱 미리보기 프레임 */}
                <div className="mt-16 relative mx-auto max-w-4xl">
                    <div className="glass rounded-2xl p-1 shadow-black/50">
                        <div className="bg-[#16161b] rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1f] border-b border-[#2a2a35]">
                                <div className="w-3 h-3 rounded-full bg-[#ef4444]/70" />
                                <div className="w-3 h-3 rounded-full bg-[#f59e0b]/70" />
                                <div className="w-3 h-3 rounded-full bg-[#10b981]/70" />
                                <div className="flex-1 ml-2 h-6 rounded-md bg-[#22222a] max-w-[200px]" />
                            </div>
                            <div className="flex h-64">
                                <div className="w-48 border-r border-[#2a2a35] p-3 space-y-1">
                                    {['New Chat', 'Project Alpha', 'Code Review', 'Research'].map((item) => (
                                        <div
                                            key={item}
                                            className={`h-8 rounded-lg flex items-center px-3 text-xs ${item === 'New Chat'
                                                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                                                    : 'text-[#606070]'
                                                }`}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 p-4 space-y-3">
                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-[#22222a] shrink-0" />
                                        <div className="flex-1 space-y-1">
                                            <div className="h-3 bg-[#22222a] rounded w-3/4" />
                                            <div className="h-3 bg-[#22222a] rounded w-1/2" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <div className="max-w-[60%] space-y-1">
                                            <div className="h-3 bg-indigo-600/30 rounded w-full" />
                                            <div className="h-3 bg-indigo-600/30 rounded w-4/5" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 shrink-0" />
                                        <div className="flex-1 space-y-1">
                                            <div className="h-3 bg-[#22222a] rounded w-full" />
                                            <div className="h-3 bg-[#22222a] rounded w-2/3" />
                                            <div className="h-3 bg-[#22222a] rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -inset-4 bg-indigo-600/5 rounded-3xl blur-xl -z-10" />
                </div>
            </div>
        </section>
    )
}