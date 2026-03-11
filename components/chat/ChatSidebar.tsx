'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, Search, Orbit, Settings, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getConversations } from '@/lib/supabase/queries/conversations'

interface Conversation {
    id: string
    title: string
    updated_at: string
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
        getConversations()
            .then(setConversations)
            .catch(console.error)
    }, [activeChatId])

    const filtered = conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
    )

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <aside className="flex flex-col w-64 bg-[#111116] border-r border-[#1e1e28] h-full">

            {/* 상단 로고 + 새 채팅 */}
            <div className="px-4 pt-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/orbit" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Orbit className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-[#f0f0f5] text-sm group-hover:text-indigo-300 transition-colors">
                            Orbit
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <ChevronDown className="w-4 h-4 text-[#404050]" />
                        {onClose && (
                            <button onClick={onClose} className="p-1 rounded-md text-[#404050] hover:text-[#f0f0f5] hover:bg-[#1e1e28] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => { onNewChat?.(); onClose?.() }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm text-white font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New chat
                </button>
            </div>

            {/* 검색 */}
            <div className="px-4 pb-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18181f] border border-[#2a2a35]">
                    <Search className="w-3.5 h-3.5 text-[#505060] shrink-0" />
                    <input
                        type="text"
                        placeholder="대화 검색"
                        className="flex-1 bg-transparent text-xs text-[#f0f0f5] placeholder:text-[#505060] outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* 대화 목록 */}
            <div className="flex-1 overflow-y-auto px-3 pb-2">
                <p className="px-2 py-1.5 text-[10px] font-semibold text-[#404050] uppercase tracking-widest">
                    Recent
                </p>
                {filtered.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-[#404050]">대화가 없습니다.</p>
                ) : (
                    filtered.map((chat) => {
                        const isActive = activeChatId === chat.id
                        return (
                            <button
                                key={chat.id}
                                onClick={() => { onSelectChat?.(chat.id); onClose?.() }}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left group ${isActive ? 'bg-[#1e1e2e]' : 'hover:bg-[#18181f]'}`}
                                title={chat.title}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? 'bg-indigo-400' : 'bg-[#303040] group-hover:bg-[#505060]'}`} />
                                <span className={`text-xs truncate transition-colors ${isActive ? 'text-[#f0f0f5] font-medium' : 'text-[#707080] group-hover:text-[#a0a0b0]'}`}>
                                    {chat.title}
                                </span>
                            </button>
                        )
                    })
                )}
            </div>

            {/* 하단 메뉴 */}
            <div className="px-3 py-3 border-t border-[#1e1e28] space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#606070] hover:bg-[#18181f] hover:text-[#c0c0c8] transition-colors text-xs">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    제안하기
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#606070] hover:bg-[#18181f] hover:text-[#c0c0c8] transition-colors text-xs">
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    Settings
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#606070] hover:bg-[#18181f] hover:text-[#c0c0c8] transition-colors text-xs"
                >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    Log out
                </button>
            </div>
        </aside>
    )

    return (
        <>
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#1e1e26] border border-[#2a2a35] text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex h-full">
                <SidebarContent />
            </div>

            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
                    <div className="relative z-50 h-full">
                        <SidebarContent onClose={() => setMobileOpen(false)} />
                    </div>
                </div>
            )}
        </>
    )
}