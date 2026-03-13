"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Orbit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function NicknamePage() {
    const [nickname, setNickname] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (nickname.trim().length < 2) {
            setError("닉네임은 최소 2자 이상이어야 합니다.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("로그인 정보가 없습니다.")

            const { error } = await supabase
                .from("users")
                .update({ nickname: nickname.trim() })
                .eq("id", user.id)

            if (error) throw error

            router.push("/orbit")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0b12] text-white">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
                        <Orbit className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#f0f0f5]">닉네임을 설정하세요</h1>
                    <p className="text-[#a0a0b0] text-sm mt-2">대화창에 표시될 이름이에요. 나중에 변경할 수 있어요.</p>
                </div>

                <div className="rounded-2xl p-8 bg-[#11131a]/80 border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[#a0a0b0]">닉네임</label>
                            <input
                                type="text"
                                required
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="예: 영철, Alex"
                                maxLength={10}
                                className="w-full px-4 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white placeholder:text-[#606070] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-[#505060]">{nickname.length}/10</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "시작하기"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}