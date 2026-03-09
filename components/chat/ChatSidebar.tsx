'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, Search, Orbit, Settings, LogOut, ChevronDown } from 'lucide-react'
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

    return (
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
                </div>
                <button
                    onClick={onNewChat}
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

            {/* 대화 목록 — 점으로 표시 */}
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
                                onClick={() => onSelectChat?.(chat.id)}
                                className="w-full flex items-center px-2 py-0.5 rounded hover:bg-[#1a1a1f] transition-colors group"
                                title={chat.title}
                            >
                                <span
                                    className={`leading-none transition-colors ${isActive
                                            ? 'text-indigo-400'
                                            : 'text-[#404050] group-hover:text-[#8080a0]'
                                        }`}
                                    style={{ fontSize: '10px' }}
                                >
                                    {isActive ? '●' : '•'}
                                </span>
                            </button>
                        )
                    })
                )}
            </div>

            {/* 하단 메뉴 */}
            <div className="p-3 border-t border-[#2a2a35] space-y-0.5">
                {/* 제안하기 버튼 추가 */}
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
}
