'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import { PanelLeft, User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function OrbitAppPage() {
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [nickname, setNickname] = useState("")
    const [displayInitial, setDisplayInitial] = useState("?")

    const router = useRouter()
    const supabase = createClient()
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setIsLoggedIn(true)

                const { data } = await supabase
                    .from("users")
                    .select("nickname")
                    .eq("id", user.id)
                    .single()

                const name = data?.nickname || user.email?.split("@")[0] || "사용자"
                setNickname(name)
                setDisplayInitial(name.slice(0, 2))
            } else {
                setIsLoggedIn(false)
            }
        }
        checkUser()
    }, [supabase])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/auth/login")
    }

    const handleNewChat = () => {
        setActiveChatId(null)
    }

    return (
        <div className="flex h-[100dvh] w-full bg-[#0f0f11] overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <div className={`hidden md:block shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <ChatSidebar
                    activeChatId={activeChatId ?? ''}
                    onSelectChat={setActiveChatId}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className="md:hidden">
                <ChatSidebar
                    activeChatId={activeChatId ?? ''}
                    onSelectChat={setActiveChatId}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-3 pl-16 pr-6 md:px-6 h-16 border-b border-[#2a2a35] shrink-0">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden md:flex p-2 rounded-lg text-[#606070] hover:text-[#f0f0f5] hover:bg-[#222222]"
                        aria-label="사이드바 토글"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-sm font-medium text-[#a0a0b0] truncate">Orbit AI</h2>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-600/15 text-indigo-300 border border-indigo-500/20">
                            Orbit 0.1
                        </span>

                        {isLoggedIn ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold select-none hover:opacity-90 transition-opacity"
                                    style={{ background: "conic-gradient(from 180deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #6366f1)" }}
                                >
                                    {displayInitial}
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[#18181f] border border-[#2a2a35] rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-2 border-b border-[#2a2a35] mb-1">
                                            <p className="text-sm font-medium text-[#f0f0f5] truncate">{nickname}</p>
                                        </div>
                                        <button
                                            onClick={() => router.push('/auth/nickname')}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b0] hover:bg-[#22222a] hover:text-[#f0f0f5] transition-colors"
                                        >
                                            <User className="w-4 h-4 shrink-0" />
                                            내 프로필
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#a0a0b0] hover:bg-[#22222a] hover:text-[#f0f0f5] transition-colors">
                                            <Settings className="w-4 h-4 shrink-0" />
                                            설정
                                        </button>
                                        <div className="h-px bg-[#2a2a35] my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 shrink-0" />
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#f0f0f5] text-[#111116] hover:bg-white transition-colors"
                            >
                                로그인
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col items-center py-4">
                    <div className="w-full max-w-3xl h-full flex flex-col px-4">
                        <ChatWindow conversationId={activeChatId} onConversationCreated={setActiveChatId} />
                    </div>
                </div>
            </div>
        </div>
    )
}