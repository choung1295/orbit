'use client'

import { useState } from 'react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import { PanelLeft } from 'lucide-react'

export default function OrbitAppPage() {
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const handleNewChat = () => {
        setActiveChatId(null)
    }

    return (
        <div className="flex h-screen bg-[#0f0f11] overflow-hidden">
            {/* 데스크탑 사이드바 */}
            <div className={`hidden md:block shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <ChatSidebar
                    activeChatId={activeChatId ?? ''}
                    onSelectChat={setActiveChatId}
                    onNewChat={handleNewChat}
                />
            </div>

            {/* 모바일 사이드바 */}
            <div className="md:hidden">
                <ChatSidebar
                    activeChatId={activeChatId ?? ''}
                    onSelectChat={setActiveChatId}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {/* 상단 헤더 */}
                <div className="flex items-center gap-3 px-6 h-16 border-b border-[#2a2a35] shrink-0">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden md:flex p-2 rounded-lg text-[#606070] hover:text-[#f0f0f5] hover:bg-[#222222]"
                        aria-label="사이드바 토글"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-sm font-medium text-[#a0a0b0] truncate">
                        Orbit AI
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-600/15 text-indigo-300 border border-indigo-500/20">
                            Orbit 0.1
                        </span>
                        <button
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
                            style={{ background: "conic-gradient(from 180deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #6366f1)" }}
                        >
                            파이
                        </button>
                    </div>
                </div>

                {/* 채팅 영역 — 중앙 정렬, 최대 폭 제한 */}
                <div className="flex-1 min-h-0 flex flex-col items-center py-4">
                    <div className="w-full max-w-3xl h-full flex flex-col px-4">
                        <ChatWindow conversationId={activeChatId} onConversationCreated={setActiveChatId} />
                    </div>
                </div>
            </div>
        </div>
    )
}