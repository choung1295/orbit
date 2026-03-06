'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap, Orbit } from 'lucide-react'

const PLANS = [
    {
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: '개인 사용자 및 탐색용',
        color: 'border-[#35353f]',
        badge: null,
        features: [
            '월 50회 AI 응답',
            'GPT-3.5 Turbo 모델',
            '대화 히스토리 7일',
            '최대 2개 프로젝트',
            '커뮤니티 지원',
        ],
        cta: '무료로 시작',
        ctaHref: '/auth/signup',
        ctaStyle: 'bg-[#22222a] hover:bg-[#2a2a35] text-[#f0f0f5] border border-[#35353f]',
        recommended: false,
    },
    {
        name: 'Pro',
        monthlyPrice: 19,
        yearlyPrice: 15,
        description: '파워 유저와 소규모 팀에게',
        color: 'border-indigo-500/50',
        badge: '가장 인기',
        features: [
            '월 2,000회 AI 응답',
            'GPT-4o, Claude 3.5, Gemini Pro',
            '무제한 대화 히스토리',
            '무제한 프로젝트',
            '파일 및 URL 컨텍스트',
            '우선 이메일 지원',
        ],
        cta: 'Pro 시작하기',
        ctaHref: '/auth/signup',
        ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
        recommended: true,
    },
    {
        name: 'Enterprise',
        monthlyPrice: 79,
        yearlyPrice: 65,
        description: '대규모 팀과 기업용',
        color: 'border-[#35353f]',
        badge: null,
        features: [
            '무제한 AI 응답',
            '최신 모든 모델 지원',
            '팀 워크스페이스',
            'SSO / SAML',
            'API 액세스',
            '전담 계정 매니저',
            'SLA 99.9% 보장',
        ],
        cta: '영업팀 문의',
        ctaHref: '/auth/signup',
        ctaStyle: 'bg-[#22222a] hover:bg-[#2a2a35] text-[#f0f0f5] border border-[#35353f]',
        recommended: false,
    },
]

export default function PricingPage() {
    const [yearly, setYearly] = useState(false)

    return (
        <div className="min-h-screen pt-24 pb-20 px-4">
            {/* 배경 */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* 헤더 */}
                <div className="text-center mb-16 animate-fade-in">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                            <Orbit className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[#f0f0f5] font-bold">Orbit</span>
                    </Link>
                    <h1 className="text-5xl font-bold text-[#f0f0f5] mb-4">
                        심플한 <span className="gradient-text">가격 정책</span>
                    </h1>
                    <p className="text-lg text-[#a0a0b0] mb-8">
                        필요한 만큼만 사용하고, 성장에 따라 확장하세요.
                    </p>

                    {/* 연/월 토글 */}
                    <div className="inline-flex items-center gap-3 p-1 bg-[#1a1a1f] border border-[#2a2a35] rounded-xl">
                        <button
                            onClick={() => setYearly(false)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!yearly
                                    ? 'bg-[#22222a] text-[#f0f0f5] shadow-sm'
                                    : 'text-[#606070] hover:text-[#a0a0b0]'
                                }`}
                        >
                            월간 결제
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${yearly
                                    ? 'bg-[#22222a] text-[#f0f0f5] shadow-sm'
                                    : 'text-[#606070] hover:text-[#a0a0b0]'
                                }`}
                        >
                            연간 결제
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-md">
                                20% 절약
                            </span>
                        </button>
                    </div>
                </div>

                {/* 플랜 카드 */}
                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col p-8 rounded-2xl bg-[#16161b] border-2 transition-all duration-300 ${plan.recommended
                                    ? `${plan.color} shadow-xl shadow-indigo-500/10`
                                    : plan.color
                                }`}
                        >
                            {/* 추천 배지 */}
                            {plan.badge && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-500/30">
                                        <Zap className="w-3 h-3" />
                                        {plan.badge}
                                    </div>
                                </div>
                            )}

                            {/* 플랜 이름/설명 */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-[#f0f0f5] mb-1">{plan.name}</h2>
                                <p className="text-sm text-[#a0a0b0]">{plan.description}</p>
                            </div>

                            {/* 가격 */}
                            <div className="mb-8">
                                <div className="flex items-end gap-1">
                                    <span className="text-5xl font-bold text-[#f0f0f5]">
                                        ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                                    </span>
                                    {(plan.monthlyPrice > 0) && (
                                        <span className="text-[#606070] mb-2">/월</span>
                                    )}
                                </div>
                                {yearly && plan.yearlyPrice > 0 && (
                                    <p className="text-xs text-emerald-400 mt-1">
                                        연간 ${plan.yearlyPrice * 12} 청구
                                    </p>
                                )}
                            </div>

                            {/* CTA 버튼 */}
                            <Link
                                href={plan.ctaHref}
                                className={`w-full text-center py-3 px-4 rounded-xl font-semibold text-sm transition-all mb-8 ${plan.ctaStyle}`}
                            >
                                {plan.cta}
                            </Link>

                            {/* 기능 목록 */}
                            <ul className="space-y-3 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-[#a0a0b0]">
                                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* 하단 FAQ 힌트 */}
                <p className="text-center text-sm text-[#606070] mt-12">
                    궁금한 점이 있으신가요?{' '}
                    <a href="mailto:hello@orbit.ai" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        hello@orbit.ai
                    </a>
                    로 문의해주세요.
                </p>
            </div>
        </div>
    )
}
