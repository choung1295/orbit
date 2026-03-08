'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Orbit, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
            if (authError) throw authError
            router.push('/orbit')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            {/* 배경 글로우 */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                            <Orbit className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[#f0f0f5] font-bold text-xl">Orbit</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-[#f0f0f5]">다시 만나서 반갑습니다</h1>
                    <p className="text-[#a0a0b0] text-sm mt-2">계정에 로그인하세요</p>
                </div>

                {/* 폼 카드 */}
                <div className="glass rounded-2xl p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* 에러 */}
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* 이메일 */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">이메일</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hello@example.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a1a1f] border border-[#2a2a35] text-[#f0f0f5] placeholder:text-[#606070] text-sm outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* 패스워드 */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#1a1a1f] border border-[#2a2a35] text-[#f0f0f5] placeholder:text-[#606070] text-sm outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606070] hover:text-[#a0a0b0] transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    로그인
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#606070] mt-6">
                        계정이 없으신가요?{' '}
                        <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            회원가입
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
