'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import { User, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeProvider, useTheme } from '@/components/chat/ThemeContext'
import ThemeToggle from '@/components/chat/ThemeToggle'

// ── 문 아이콘 (열림: 원근법 패널, 닫힘: 정면 닫힌 문) ─────────────────────
function DoorIcon({ open, color }: { open: boolean; color: string }) {
    if (open) {
        // 사이드바 열린 상태: 문이 열려있는 원근 뷰
        return (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                {/* 문틀 오른쪽·상단·하단 */}
                <path d="M6 2.5 H17 A1.2 1.2 0 0 1 18.2 3.7 V20.3 A1.2 1.2 0 0 1 17 21.5 H6"
                    stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                {/* 열린 문짝 (원근 단축) */}
                <path d="M6 2.5 L10.2 3.9 L10.2 20.1 L6 21.5 Z"
                    fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.3"
                    strokeLinejoin="round" />
                {/* 손잡이 */}
                <circle cx="9.2" cy="12.3" r="1.2" fill={color} />
                {/* 경첩 상단 */}
                <rect x="6" y="5.5" width="2.4" height="1.1" rx="0.5" fill={color} opacity="0.6" />
                {/* 경첩 하단 */}
                <rect x="6" y="16.8" width="2.4" height="1.1" rx="0.5" fill={color} opacity="0.6" />
            </svg>
        )
    }
    // 사이드바 닫힌 상태: 닫혀있는 정면 문
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            {/* 문틀 */}
            <rect x="2.5" y="1.5" width="19" height="21" rx="1.6"
                stroke={color} strokeWidth="1.7" fill="none" />
            {/* 문 패널 내부 상단 */}
            <rect x="5" y="4" width="14" height="7.5" rx="0.9"
                stroke={color} strokeWidth="1" fill="none" opacity="0.35" />
            {/* 문 패널 내부 하단 */}
            <rect x="5" y="13" width="14" height="7.5" rx="0.9"
                stroke={color} strokeWidth="1" fill="none" opacity="0.35" />
            {/* 손잡이 */}
            <circle cx="16.5" cy="12.3" r="1.6" fill={color} />
            {/* 경첩 상단 */}
            <rect x="3.5" y="6" width="2.2" height="1.2" rx="0.5" fill={color} opacity="0.55" />
            {/* 경첩 하단 */}
            <rect x="3.5" y="16.2" width="2.2" height="1.2" rx="0.5" fill={color} opacity="0.55" />
        </svg>
    )
}

export default function OrbitChat() {
    return (
        <ThemeProvider>
            <OrbitChatContent />
        </ThemeProvider>
    )
}

const SIDEBAR_DEFAULT = 256
const SIDEBAR_MIN = 180
const SIDEBAR_MAX = 480

function OrbitChatContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()
    const { theme, variant } = useTheme()

    const conversationId = searchParams.get('chat')

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [nickname, setNickname] = useState('')
    const [displayInitial, setDisplayInitial] = useState('?')
    const [isLoading, setIsLoading] = useState(true)
    const [isResizing, setIsResizing] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const resizeStartX = useRef(0)
    const resizeStartWidth = useRef(SIDEBAR_DEFAULT)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setIsLoggedIn(true)
                const { data } = await supabase
                    .from('users')
                    .select('nickname')
                    .eq('id', user.id)
                    .single()
                const name = data?.nickname || user.email?.split('@')[0] || '사용자'
                setNickname(name)
                setDisplayInitial(name.slice(0, 2))
            } else {
                setIsLoggedIn(false)
            }
            setIsLoading(false)
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

    // ── 드래그 리사이즈 ──────────────────────────────────────────────────────
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault()
        resizeStartX.current = e.clientX
        resizeStartWidth.current = sidebarWidth
        setIsResizing(true)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }

    useEffect(() => {
        if (!isResizing) return
        const onMove = (e: MouseEvent) => {
            const delta = e.clientX - resizeStartX.current
            const next = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, resizeStartWidth.current + delta))
            setSidebarWidth(next)
        }
        const onUp = () => {
            setIsResizing(false)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        return () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
    }, [isResizing])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    const handleNewChat = () => router.push('/orbit')
    const handleSelectChat = (id: string) => router.push('/orbit?chat=' + id)
    const handleConversationCreated = (id: string) => router.replace('/orbit?chat=' + id)

    const d = theme.isDark
    const doorColor = d ? '#606070' : '#9ca3af'

    return (
        <div
            className="flex h-[100dvh] w-full overflow-hidden pb-[env(safe-area-inset-bottom)]"
            style={{ backgroundColor: theme.bg }}
            data-orbit-theme={variant}
        >
            {/* PC 사이드바 */}
            <div
                className="hidden md:block shrink-0 overflow-hidden"
                style={{
                    width: sidebarOpen ? sidebarWidth : 0,
                    transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                <div style={{ width: sidebarWidth, height: '100%' }}>
                    <ChatSidebar
                        activeChatId={conversationId ?? ''}
                        onSelectChat={handleSelectChat}
                        onNewChat={handleNewChat}
                    />
                </div>
            </div>

            {/* ── 리사이즈 핸들 (PC only) ───────────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="hidden md:flex shrink-0 items-center justify-center"
                    onMouseDown={handleResizeStart}
                    style={{
                        width: 8,
                        cursor: 'col-resize',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {/* 핸들 시각 요소 */}
                    <div
                        style={{
                            width: isResizing ? 3 : 2,
                            height: '100%',
                            background: isResizing
                                ? '#6366f1'
                                : d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            transition: 'background 0.15s ease, width 0.15s ease',
                        }}
                    />
                    {/* 중앙 그립 점 3개 */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            opacity: isResizing ? 1 : 0,
                            transition: 'opacity 0.15s ease',
                            pointerEvents: 'none',
                        }}
                        className="group-hover:opacity-100"
                    >
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: 3, height: 3, borderRadius: '50%',
                                background: '#6366f1',
                            }} />
                        ))}
                    </div>
                </div>
            )}

            {/* 모바일 사이드바 */}
            <div className="md:hidden">
                <ChatSidebar
                    activeChatId={conversationId ?? ''}
                    onSelectChat={handleSelectChat}
                    onNewChat={handleNewChat}
                />
            </div>

            {/* 메인 채팅 영역 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 헤더 */}
                <div
                    className="flex items-center gap-3 pl-16 pr-6 md:px-6 h-16 shrink-0"
                    style={{ borderBottom: `1px solid ${theme.panelBorder}` }}
                >
                    {/* 사이드바 토글 — 문 아이콘 */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`hidden md:flex p-2 rounded-lg transition-colors ${d
                            ? 'hover:bg-[#222222]'
                            : 'hover:bg-black/[0.05]'}`}
                        aria-label="사이드바 토글"
                        title={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
                    >
                        <DoorIcon open={sidebarOpen} color={doorColor} />
                    </button>

                    <Link
                        href="/orbit"
                        className="text-sm font-medium truncate hover:opacity-70 transition-opacity"
                        style={{ color: theme.textSub }}
                    >
                        Orbit AI
                    </Link>

                    <div className="ml-auto flex items-center gap-2">
                        {/* ─── 다크/라이트 토글 ────────────────────────── */}
                        <ThemeToggle />

                        {/* ─── 유저 영역 ─────────────────────────────────── */}
                        {!isLoading && (
                            isLoggedIn ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold select-none hover:opacity-90 transition-opacity"
                                        style={{ background: 'conic-gradient(from 180deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #6366f1)' }}
                                    >
                                        {displayInitial}
                                    </button>

                                    {isDropdownOpen && (
                                        <div
                                            className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200"
                                            style={{
                                                backgroundColor: theme.dropdown,
                                                border: `1px solid ${theme.dropdownBorder}`,
                                                boxShadow: d ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
                                            }}
                                        >
                                            <div
                                                className="px-4 py-2 mb-1"
                                                style={{ borderBottom: `1px solid ${theme.panelBorder}` }}
                                            >
                                                <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
                                                    {nickname}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => router.push('/auth/nickname')}
                                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${d
                                                    ? 'text-[#a0a0b0] hover:bg-[#22222a] hover:text-[#f0f0f5]'
                                                    : 'text-gray-500 hover:bg-black/[0.04] hover:text-gray-800'}`}
                                            >
                                                <User className="w-4 h-4 shrink-0" />
                                                내 프로필
                                            </button>
                                            <button
                                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${d
                                                    ? 'text-[#a0a0b0] hover:bg-[#22222a] hover:text-[#f0f0f5]'
                                                    : 'text-gray-500 hover:bg-black/[0.04] hover:text-gray-800'}`}
                                            >
                                                <Settings className="w-4 h-4 shrink-0" />
                                                설정
                                            </button>
                                            <div className="h-px my-1" style={{ backgroundColor: theme.panelBorder }} />
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
                                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                    style={d
                                        ? { backgroundColor: '#f0f0f5', color: '#111116' }
                                        : { backgroundColor: '#1f2937', color: '#ffffff' }}
                                >
                                    로그인
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* 채팅 창 */}
                <div className="flex-1 min-h-0 flex flex-col items-center py-4">
                    <div className="w-full max-w-3xl h-full flex flex-col px-4">
                        <ChatWindow
                            conversationId={conversationId}
                            onConversationCreated={handleConversationCreated}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
