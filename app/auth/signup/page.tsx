"use client"

import { useState } from "react"
import Link from "next/link"
import { Orbit, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showPw, setShowPw] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [done, setDone] = useState(false)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirm) {
            setError("비밀번호가 일치하지 않습니다.")
            return
        }

        if (password.length < 8) {
            setError("비밀번호는 최소 8자 이상이어야 합니다.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const supabase = createClient()

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/orbit`,
                },
            })

            if (error) throw error

            if (data.user?.identities?.length === 0) {
                setError("이미 가입된 이메일입니다. 로그인해 주세요.")
                return
            }

            setDone(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0b12] text-white">
                <div className="w-full max-w-md text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-[#f0f0f5] mb-3">이메일을 확인해주세요</h2>

                    <p className="text-[#a0a0b0] text-sm leading-7 mb-8">
                        <span className="text-[#f0f0f5] font-medium">{email}</span> 으로 인증 링크를 보냈습니다.
                        <br />
                        이메일의 링크를 클릭하면 인증이 완료되고 자동으로 로그인됩니다.
                    </p>

                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition"
                    >
                        로그인 페이지로
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative bg-[#0b0b12] text-white">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 blur-3xl rounded-full" />

            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                            <Orbit className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-[#f0f0f5]">Orbit</span>
                    </Link>

                    <h1 className="text-2xl font-bold text-[#f0f0f5]">무료로 시작하세요</h1>
                    <p className="text-[#a0a0b0] text-sm mt-2">지금 바로 계정을 만들고 오르빗을 시작하세요.</p>
                </div>

                <div className="glass rounded-2xl p-8 bg-[#11131a]/80 border border-white/10 shadow-2xl">
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
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white placeholder:text-[#606070] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">비밀번호</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
                                <input
                                    type={showPw ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="최소 8자 이상"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white placeholder:text-[#606070] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606070]"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">비밀번호 확인</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070]" />
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="비밀번호 재입력"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white placeholder:text-[#606070] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606070]"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60"
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
                        이미 계정이 있으신가요?{" "}
                        <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}