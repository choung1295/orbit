'use client'

import { useState } from 'react'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import { PanelLeft } from 'lucide-react'

export default function OrbitAppPage() {
    const [activeChatId, setActiveChatId] = useState('1')
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const handleNewChat = () => {
        setActiveChatId(`new-${Date.now()}`)
    }

    return (
        <div className="flex h-screen bg-[#0f0f11] overflow-hidden">
            {/* 사이드바 */}
            <div
                className={`shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
            >
                <ChatSidebar
                    activeChatId={activeChatId}
                    onSelectChat={setActiveChatId}
                    onNewChat={handleNewChat}
                />
            </div>

            {/* 메인 채팅 영역 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 상단 툴바 */}
                <div className="flex items-center gap-3 px-6 h-16 border-b border-[#2a2a35] shrink-0">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg text-[#606070] hover:text-[#f0f0f5] hover:bg-[#222222]"
                        aria-label="사이드바 토글"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-sm font-medium text-[#a0a0b0] truncate">
                        Next.js 서버 컴포넌트
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-600/15 text-indigo-300 border border-indigo-500/20">
                            Orbit 0.1
                        </span>
                    </div>
                </div>

                {/* 채팅 윈도우 */}
                <div className="flex-1 min-h-0 px-4 py-4">
                    <ChatWindow />
                </div>
            </div>
        </div>
    )
}