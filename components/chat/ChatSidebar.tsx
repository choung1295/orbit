"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import {
    Plus, MessageSquare, Search, Settings,
    ChevronDown, Menu, X, MoreHorizontal,
    Pencil, Share2, FolderInput, Trash2, ChevronRight,
} from "lucide-react"

import {
    getConversations,
    updateConversationTitle,
    deleteConversation,
    getProjects,
    moveConversationToProject,
} from "@/lib/supabase/queries/conversations"

interface Conversation {
    id: string
    title: string
    updated_at: string
}

interface Project {
    id: string
    name: string
}

interface ChatSidebarProps {
    activeChatId?: string
    onSelectChat?: (id: string) => void
    onNewChat?: () => void
}

// ─── 점세개 드롭다운 ────────────────────────────────────────────────────────

interface ConversationMenuProps {
    chat: Conversation
    onRename: () => void
    onDelete: () => void
    onShare: () => void
    projects: Project[]
    onMoveToProject: (projectId: string | null) => void
}

function ConversationMenu({
    chat,
    onRename,
    onDelete,
    onShare,
    projects,
    onMoveToProject,
}: ConversationMenuProps) {
    const [open, setOpen] = useState(false)
    const [projectSubOpen, setProjectSubOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // 바깥 클릭 시 닫기
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
                setProjectSubOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    return (
        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={() => {
                    setOpen((v) => !v)
                    setProjectSubOpen(false)
                }}
                className="p-1 rounded-md text-[#404050] hover:text-[#a0a0b0] hover:bg-[#2a2a38] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="메뉴"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div className="absolute right-0 top-7 z-50 w-44 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1 text-xs">

                    {/* 공유 */}
                    <MenuItem
                        icon={<Share2 className="w-3.5 h-3.5" />}
                        label="공유"
                        onClick={() => { onShare(); setOpen(false) }}
                    />

                    {/* 이름변경 */}
                    <MenuItem
                        icon={<Pencil className="w-3.5 h-3.5" />}
                        label="이름 변경"
                        onClick={() => { onRename(); setOpen(false) }}
                    />

                    {/* 프로젝트로 이동 */}
                    <div className="relative">
                        <button
                            onMouseEnter={() => setProjectSubOpen(true)}
                            onMouseLeave={() => setProjectSubOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e] transition-colors"
                        >
                            <FolderInput className="w-3.5 h-3.5" />
                            <span className="flex-1 text-left">프로젝트로 이동</span>
                            <ChevronRight className="w-3 h-3 text-[#404050]" />
                        </button>

                        {/* 프로젝트 서브메뉴 */}
                        {projectSubOpen && (
                            <div
                                className="absolute left-full top-0 ml-1 w-44 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1 text-xs"
                                onMouseEnter={() => setProjectSubOpen(true)}
                                onMouseLeave={() => setProjectSubOpen(false)}
                            >
                                {projects.length === 0 ? (
                                    <p className="px-3 py-2 text-[#505060] italic">
                                        프로젝트 없음
                                    </p>
                                ) : (
                                    projects.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                onMoveToProject(p.id)
                                                setOpen(false)
                                                setProjectSubOpen(false)
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e] transition-colors text-left truncate"
                                        >
                                            {p.name}
                                        </button>
                                    ))
                                )}
                                {/* 신규 프로젝트 생성 진입점 */}
                                <div className="border-t border-[#2a2a38] mt-1 pt-1">
                                    <button
                                        onClick={() => {
                                            // 추후: 프로젝트 생성 모달 연결
                                            alert("프로젝트 생성 기능은 준비 중입니다.")
                                            setOpen(false)
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-[#22222e] transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        새 프로젝트 만들기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#2a2a38] my-1" />

                    {/* 삭제 */}
                    <MenuItem
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="삭제"
                        danger
                        onClick={() => { onDelete(); setOpen(false) }}
                    />
                </div>
            )}
        </div>
    )
}

function MenuItem({
    icon, label, onClick, danger = false,
}: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    danger?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors ${danger
                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                : "text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e]"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}

// ─── 인라인 이름변경 입력 ────────────────────────────────────────────────────

function InlineRenameInput({
    initialValue,
    onSave,
    onCancel,
}: {
    initialValue: string
    onSave: (val: string) => void
    onCancel: () => void
}) {
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [])

    const save = useCallback(() => {
        const trimmed = value.trim()
        if (trimmed && trimmed !== initialValue) {
            onSave(trimmed)
        } else {
            onCancel()
        }
    }, [value, initialValue, onSave, onCancel])

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); save() }
                if (e.key === "Escape") { e.preventDefault(); onCancel() }
            }}
            onBlur={save}
            className="flex-1 min-w-0 bg-[#22222e] border border-indigo-500/60 rounded-md px-2 py-0.5 text-xs text-[#f0f0f5] outline-none focus:border-indigo-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
        />
    )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function ChatSidebar({
    activeChatId,
    onSelectChat,
    onNewChat,
}: ChatSidebarProps) {
    const [search, setSearch] = useState("")
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [projects, setProjects] = useState<Project[]>([])

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setIsLoading(true)
                const [convData, projData] = await Promise.all([
                    getConversations(),
                    getProjects(),
                ])
                setConversations(convData)
                setProjects(projData)
            } catch (error) {
                console.error("Failed to fetch:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAll()
    }, [activeChatId])

    const filtered = useMemo(
        () => conversations.filter((c) =>
            c.title.toLowerCase().includes(search.toLowerCase())
        ),
        [conversations, search]
    )

    const handleRename = useCallback(async (id: string, newTitle: string) => {
        try {
            await updateConversationTitle(id, newTitle)
            setConversations((prev) =>
                prev.map((c) => c.id === id ? { ...c, title: newTitle } : c)
            )
        } catch (e) {
            console.error("이름 변경 실패:", e)
        } finally {
            setRenamingId(null)
        }
    }, [])

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("이 대화를 삭제할까요?")) return
        try {
            await deleteConversation(id)
            setConversations((prev) => prev.filter((c) => c.id !== id))
            // 현재 보고 있는 대화가 삭제됐으면 새 대화로
            if (activeChatId === id) onNewChat?.()
        } catch (e) {
            console.error("삭제 실패:", e)
        }
    }, [activeChatId, onNewChat])

    const handleMoveToProject = useCallback(async (chatId: string, projectId: string | null) => {
        try {
            await moveConversationToProject(chatId, projectId)
            // 추후 프로젝트 뷰 연동 시 여기서 상태 업데이트
        } catch (e) {
            console.error("프로젝트 이동 실패:", e)
        }
    }, [])

    const handleShare = useCallback((chatId: string) => {
        // 추후 공유 기능 연결 지점
        const url = `${window.location.origin}/orbit?chat=${chatId}`
        navigator.clipboard.writeText(url).then(() => {
            alert("링크가 복사됐습니다.")
        })
    }, [])

    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <aside className="flex flex-col w-64 bg-[#111116] border-r border-[#1e1e28] h-full">
            <div className="px-4 pt-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/orbit" className="flex items-center gap-2 group">
                        <div className="w-6 h-6 shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-[#f0f0f5] text-sm group-hover:text-violet-300 transition-colors tracking-wide">
                            Orbit
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <ChevronDown className="w-4 h-4 text-[#404050]" />
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 rounded-md text-[#404050] hover:text-[#f0f0f5] hover:bg-[#1e1e28] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => { onNewChat?.(); onClose?.() }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all text-sm text-white font-medium shadow-sm active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    New chat
                </button>
            </div>

            <div className="px-4 pb-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18181f] border border-[#2a2a35] focus-within:border-indigo-500/50 transition-colors">
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

            <div className="flex-1 overflow-y-auto px-3 pb-2 custom-scrollbar">
                <p className="px-2 py-1.5 text-[10px] font-semibold text-[#404050] uppercase tracking-widest">
                    Recent
                </p>

                {isLoading ? (
                    <p className="px-2 py-2 text-xs text-[#404050] animate-pulse italic">
                        Thinking...
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-[#404050]">
                        대화가 없습니다.
                    </p>
                ) : (
                    <div className="space-y-0.5">
                        {filtered.map((chat) => {
                            const isActive = activeChatId === chat.id
                            const isRenaming = renamingId === chat.id

                            return (
                                <div
                                    key={chat.id}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group ${isActive ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"}`}
                                >
                                    {/* 활성 인디케이터 */}
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive
                                            ? "bg-violet-400"
                                            : "bg-[#303040] group-hover:bg-[#505060]"
                                            }`}
                                    />

                                    {/* 제목 or 인라인 입력 */}
                                    {isRenaming ? (
                                        <InlineRenameInput
                                            initialValue={chat.title}
                                            onSave={(val) => handleRename(chat.id, val)}
                                            onCancel={() => setRenamingId(null)}
                                        />
                                    ) : (
                                        <button
                                            className="flex-1 min-w-0 text-left"
                                            onClick={() => { onSelectChat?.(chat.id); onClose?.() }}
                                            title={chat.title}
                                        >
                                            <span
                                                className={`text-xs truncate block transition-colors ${isActive
                                                    ? "text-[#f0f0f5] font-medium"
                                                    : "text-[#707080] group-hover:text-[#a0a0b0]"
                                                    }`}
                                            >
                                                {chat.title}
                                            </span>
                                        </button>
                                    )}

                                    {/* 점세개 메뉴 (이름변경 중엔 숨김) */}
                                    {!isRenaming && (
                                        <ConversationMenu
                                            chat={chat}
                                            onRename={() => setRenamingId(chat.id)}
                                            onDelete={() => handleDelete(chat.id)}
                                            onShare={() => handleShare(chat.id)}
                                            projects={projects}
                                            onMoveToProject={(pid) => handleMoveToProject(chat.id, pid)}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="px-3 py-3 border-t border-[#1e1e28] space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#606070] hover:bg-[#18181f] hover:text-[#c0c0c8] transition-colors text-xs">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    제안하기
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#606070] hover:bg-[#18181f] hover:text-[#c0c0c8] transition-colors text-xs">
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    Settings
                </button>
            </div>
        </aside>
    )

    return (
        <>
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#1e1e26] border border-[#2a2a35] text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors shadow-lg"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex h-full shrink-0">
                <SidebarContent />
            </div>

            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative z-50 h-full animate-in slide-in-from-left duration-300">
                        <SidebarContent onClose={() => setMobileOpen(false)} />
                    </div>
                </div>
            )}
        </>
    )
}