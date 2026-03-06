'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Search, Orbit, Settings, LogOut, ChevronDown } from 'lucide-react'

const DUMMY_CHATS = [
    { id: '1', title: 'Next.js 서버 컴포넌트', updatedAt: '2분 전' },
    { id: '2', title: 'TypeScript 타입 추론 질문', updatedAt: '1시간 전' },
    { id: '3', title: 'Supabase RLS 설정 방법', updatedAt: '어제' },
    { id: '4', title: 'React Query vs SWR 비교', updatedAt: '어제' },
    { id: '5', title: 'Tailwind CSS 최적화', updatedAt: '3일 전' },
]

interface ChatSidebarProps {
    activeChatId?: string
    onSelectChat?: (id: string) => void
    onNewChat?: () => void
}

export default function ChatSidebar({ activeChatId = '1', onSelectChat, onNewChat }: ChatSidebarProps) {
    const [search, setSearch] = useState('')

    const filtered = DUMMY_CHATS.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <aside className="flex flex-col w-64 bg-[#12121699] border-r border-[#2a2a35] h-full">
            {/* 헤더 */}
            <div className="p-4 border-b border-[#2a2a35]">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Orbit className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-[#f0f0f5]">Orbit</span>
                    <ChevronDown className="w-4 h-4 text-[#606070] ml-auto" />
                </div>
                {/* 새 채팅 버튼 */}
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-sm font-medium transition-all"
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
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                <p className="px-3 py-1 text-xs font-medium text-[#606070] uppercase tracking-wider">Recent</p>
                {filtered.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat?.(chat.id)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${activeChatId === chat.id
                                ? 'bg-indigo-600/15 border border-indigo-500/20 text-[#f0f0f5]'
                                : 'text-[#a0a0b0] hover:bg-[#1a1a1f] hover:text-[#f0f0f5]'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{chat.title}</p>
                            <p className="text-xs text-[#606070] mt-0.5">{chat.updatedAt}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* 하단 유저 메뉴 */}
            <div className="p-4 border-t border-[#2a2a35] space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-[#1a1a1f] text-sm transition-all">
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0a0b0] hover:text-red-400 hover:bg-red-500/5 text-sm transition-all">
                    <LogOut className="w-4 h-4" />
                    Log out
                </button>
            </div>
        </aside>
    )
}
