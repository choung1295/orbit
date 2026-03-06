import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
    return (
        <section className="py-28 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <div className="relative p-12 rounded-3xl overflow-hidden">
                    {/* 배경 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
                    <div className="absolute inset-0 border border-indigo-500/20 rounded-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl font-bold text-[#f0f0f5] mb-4">
                            Ready to orbit at{' '}
                            <span className="gradient-text">full speed?</span>
                        </h2>
                        <p className="text-lg text-[#a0a0b0] mb-10 max-w-xl mx-auto">
                            Join thousands of teams already using Orbit to think faster, communicate better, and build smarter.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/auth/signup"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-indigo-500/20"
                            >
                                Get started — it&apos;s free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#22222a]/60 hover:bg-[#22222a] text-[#f0f0f5] font-semibold rounded-xl border border-[#35353f] transition-all"
                            >
                                View pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
