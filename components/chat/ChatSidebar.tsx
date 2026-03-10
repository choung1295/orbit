'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, Search, Orbit, Settings, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Conversation {
    id: string
    title: string
    created_at: string
}

interface ChatSidebarProps {
    activeChatId?: string
    onSelectChat?: (id: string) => void
    onNewChat?: () => void
}

export default function ChatSidebar({ activeChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
    const [search, setSearch] = useState('')
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [mobileOpen, setMobileOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchConversations = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setConversations(data)
        }
        fetchConversations()
    }, [activeChatId, supabase])

    const filtered = conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
    )

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    const SidebarContent = () => (
        <aside className="flex flex-col w-64 bg-[#12121699] border-r border-[#2a2a35] h-full">
            {/* 헤더 */}
            <div className="p-4 border-b border-[#2a2a35]">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/orbit" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Orbit className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-[#f0f0f5] group-hover:text-indigo-300 transition-colors truncate">
                            Orbit
                        </span>
                    </Link>
                    <ChevronDown className="w-4 h-4 text-[#606070] ml-auto" />
                    {/* 모바일 닫기 버튼 */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden p-1 rounded-md text-[#606070] hover:text-[#f0f0f5] hover:bg-[#22222a] transition-colors"
                        aria-label="사이드바 닫기"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={() => { onNewChat?.(); setMobileOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New chat
                </button>
            </div>

            {/* 검색 */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1f] border border-[#2a2a35]">
                    <Search className="w-4 h-4 text-[#606070] shrink-0" />
                    <input
                        type="text"
                        placeholder="대화 검색..."
                        className="flex-1 bg-transparent text-sm text-[#f0f0f5] placeholder:text-[#606070] outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* 대화 목록 */}
            <div className="flex-1 overflow-y-auto px-4 py-1">
                <p className="px-1 py-1 text-xs font-medium text-[#606070] uppercase tracking-widest mb-1">
                    RECENT
                </p>
                {filtered.length === 0 ? (
                    <p className="px-1 text-xs text-[#606070]">대화가 없습니다.</p>
                ) : (
                    filtered.map((chat) => {
                        const isActive = activeChatId === chat.id
                        return (
                            <button
                                key={chat.id}
                                onClick={() => { onSelectChat?.(chat.id); setMobileOpen(false) }}
                                className="w-full flex items-center gap-2 px-2 py-0.5 rounded hover:bg-[#1a1a1f] transition-colors group"
                                title={chat.title}
                            >
                                <span
                                    className={`leading-none shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-[#707080] group-hover:text-[#a0a0b8]'}`}
                                    style={{ fontSize: '14px' }}
                                >
                                    {isActive ? '●' : '•'}
                                </span>
                                <span className={`text-sm truncate transition-colors ${isActive ? 'text-[#f0f0f5]' : 'text-[#707080] group-hover:text-[#a0a0b8]'}`}>
                                    {chat.title}
                                </span>
                            </button>
                        )
                    })
                )}
            </div>

            {/* 하단 메뉴 */}
            <div className="p-3 border-t border-[#2a2a35] space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0a0b0] hover:bg-[#1a1a1f] hover:text-[#f0f0f5] transition-colors">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    제안하기
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0a0b0] hover:bg-[#1a1a1f] hover:text-[#f0f0f5] transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0a0b0] hover:bg-[#1a1a1f] hover:text-[#f0f0f5] transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Log out
                </button>
            </div>
        </aside>
    )

    return (
        <>
            {/* 모바일 햄버거 버튼 */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#1e1e26] border border-[#2a2a35] text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors"
                aria-label="메뉴 열기"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* 데스크탑 사이드바 */}
            <div className="hidden md:flex h-full">
                <SidebarContent />
            </div>

            {/* 모바일 드로어 오버레이 */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    {/* 배경 딤 */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* 드로어 */}
                    <div className="relative z-50 h-full">
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    )
}