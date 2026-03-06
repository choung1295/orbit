'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Orbit, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) {
            setError('비밀번호가 일치하지 않습니다.')
            return
        }
        if (password.length < 8) {
            setError('비밀번호는 최소 8자 이상이어야 합니다.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signUp({ email, password })
            if (authError) throw authError
            setDone(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#f0f0f5] mb-3">이메일을 확인해주세요</h2>
                    <p className="text-[#a0a0b0] mb-8">
                        <span className="text-[#f0f0f5] font-medium">{email}</span>으로 확인 링크를 보내드렸습니다.
                        이메일의 링크를 클릭하면 계정이 활성화됩니다.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
                    >
                        로그인 페이지로
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                            <Orbit className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[#f0f0f5] font-bold text-xl">Orbit</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-[#f0f0f5]">무료로 시작하세요</h1>
                    <p className="text-[#a0a0b0] text-sm mt-2">신용카드 없이 바로 사용 가능합니다</p>
                </div>

                <div className="glass rounded-2xl p-8">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

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

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="최소 8자 이상"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#1a1a1f] border border-[#2a2a35] text-[#f0f0f5] placeholder:text-[#606070] text-sm outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606070] hover:text-[#a0a0b0]">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">비밀번호 확인</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="비밀번호 재입력"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a1a1f] border border-[#2a2a35] text-[#f0f0f5] placeholder:text-[#606070] text-sm outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    계정 만들기
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#606070] mt-6">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
