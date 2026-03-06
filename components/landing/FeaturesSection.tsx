import { Brain, RefreshCw, Layers, Shield, Zap, Globe } from 'lucide-react'

const features = [
    {
        icon: Brain,
        title: 'Multi-Model AI',
        desc: 'GPT-4, Claude, Gemini — switch between models in a single conversation without losing context.',
        color: 'text-indigo-400',
        bg: 'bg-indigo-600/10',
        border: 'border-indigo-500/20',
    },
    {
        icon: RefreshCw,
        title: 'Real-Time Sync',
        desc: 'Your conversations sync instantly across all devices. Pick up exactly where you left off.',
        color: 'text-purple-400',
        bg: 'bg-purple-600/10',
        border: 'border-purple-500/20',
    },
    {
        icon: Layers,
        title: 'Deep Context',
        desc: 'Upload documents, paste code, or link URLs. Orbit understands your full context.',
        color: 'text-sky-400',
        bg: 'bg-sky-600/10',
        border: 'border-sky-500/20',
    },
    {
        icon: Shield,
        title: 'Privacy First',
        desc: 'Your data is encrypted at rest and in transit. We never use your conversations for training.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-600/10',
        border: 'border-emerald-500/20',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        desc: "Streaming responses so you get answers as they're generated — no waiting.",
        color: 'text-yellow-400',
        bg: 'bg-yellow-600/10',
        border: 'border-yellow-500/20',
    },
    {
        icon: Globe,
        title: 'Team Workspaces',
        desc: 'Share threads, build shared knowledge bases, and collaborate with your team in real-time.',
        color: 'text-pink-400',
        bg: 'bg-pink-600/10',
        border: 'border-pink-500/20',
    },
]

export default function FeaturesSection() {
    return (
        <section className="py-28 px-4">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-[#f0f0f5] mb-4">
                        Everything you need to{' '}
                        <span className="gradient-text">think deeper</span>
                    </h2>
                    <p className="text-lg text-[#a0a0b0] max-w-xl mx-auto">
                        Orbit is designed from the ground up for serious work — not casual chat.
                    </p>
                </div>

                {/* 피처 그리드 */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon: Icon, title, desc, color, bg, border }) => (
                        <div
                            key={title}
                            className="group p-6 rounded-2xl bg-[#16161b] border border-[#2a2a35] hover:border-[#35353f] transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 rounded-xl ${bg} border ${border} flex items-center justify-center mb-4`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <h3 className="text-[#f0f0f5] font-semibold text-lg mb-2">{title}</h3>
                            <p className="text-[#a0a0b0] text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
