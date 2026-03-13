"use client"

import {
    useState, useEffect, useRef, useCallback, useMemo,
} from "react"
import Link from "next/link"
import {
    Plus, MessageSquare, Settings,
    ChevronDown, Menu, X, MoreHorizontal,
    Pencil, Share2, FolderInput, Trash2, ChevronRight,
    FolderOpen, Archive,
} from "lucide-react"

import {
    getConversations,
    updateConversationTitle,
    deleteConversation,
    getProjects,
    moveConversationToProject,
} from "@/lib/supabase/queries/conversations"

import {
    searchConversations,
    type SearchResult,
} from "@/lib/supabase/queries/searchConversations"

import SearchBar from "@/components/chat/SearchBar"
import SearchResults from "@/components/chat/SearchResults"

interface Conversation {
    id: string
    title: string
    updated_at: string
    project_id?: string | null
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

// ─── 날짜 분류 ───────────────────────────────────────────────────────────────

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

function classifyConversation(c: Conversation): "project" | "recent" | "archive" {
    if (c.project_id) return "project"
    const age = Date.now() - new Date(c.updated_at).getTime()
    return age <= SEVEN_DAYS ? "recent" : "archive"
}

// ─── 공통 MenuItem ────────────────────────────────────────────────────────────

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
            className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-xs ${danger
                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                : "text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e]"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}

// ─── 점세개 드롭다운 ──────────────────────────────────────────────────────────

function ConversationMenu({
    chat: _chat, onRename, onDelete, onShare, projects, onMoveToProject,
}: {
    chat: Conversation
    onRename: () => void
    onDelete: () => void
    onShare: () => void
    projects: Project[]
    onMoveToProject: (projectId: string | null) => void
}) {
    const [open, setOpen] = useState(false)
    const [projectSubOpen, setProjectSubOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

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
                onClick={() => { setOpen((v) => !v); setProjectSubOpen(false) }}
                className="p-1 rounded-md text-[#404050] hover:text-[#a0a0b0] hover:bg-[#2a2a38] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="메뉴"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div className="absolute right-0 top-7 z-50 w-44 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1 text-xs">
                    <MenuItem icon={<Share2 className="w-3.5 h-3.5" />} label="공유" onClick={() => { onShare(); setOpen(false) }} />
                    <MenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="이름 변경" onClick={() => { onRename(); setOpen(false) }} />

                    <div className="relative">
                        <button
                            onMouseEnter={() => setProjectSubOpen(true)}
                            onMouseLeave={() => setProjectSubOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e] transition-colors text-xs"
                        >
                            <FolderInput className="w-3.5 h-3.5" />
                            <span className="flex-1 text-left">프로젝트로 이동</span>
                            <ChevronRight className="w-3 h-3 text-[#404050]" />
                        </button>
                        {projectSubOpen && (
                            <div
                                className="absolute left-full top-0 ml-1 w-44 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1 text-xs"
                                onMouseEnter={() => setProjectSubOpen(true)}
                                onMouseLeave={() => setProjectSubOpen(false)}
                            >
                                {projects.length === 0 ? (
                                    <p className="px-3 py-2 text-[#505060] italic">프로젝트 없음</p>
                                ) : projects.map((p) => (
                                    <button key={p.id}
                                        onClick={() => { onMoveToProject(p.id); setOpen(false); setProjectSubOpen(false) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e] transition-colors text-left truncate"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                                <div className="border-t border-[#2a2a38] mt-1 pt-1">
                                    <button
                                        onClick={() => { alert("프로젝트 생성 기능은 준비 중입니다."); setOpen(false) }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-[#22222e] transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />새 프로젝트 만들기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#2a2a38] my-1" />
                    <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="삭제" danger onClick={() => { onDelete(); setOpen(false) }} />
                </div>
            )}
        </div>
    )
}

// ─── 인라인 이름변경 ──────────────────────────────────────────────────────────

function InlineRenameInput({
    initialValue, onSave, onCancel,
}: { initialValue: string; onSave: (v: string) => void; onCancel: () => void }) {
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

    const save = useCallback(() => {
        const t = value.trim()
        if (t && t !== initialValue) onSave(t)
        else onCancel()
    }, [value, initialValue, onSave, onCancel])

    return (
        <input ref={inputRef} value={value}
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

// ─── 대화 항목 행 ─────────────────────────────────────────────────────────────

function ConversationItem({
    chat, isActive, isRenaming,
    onSelect, onRenameStart, onRenameSave, onRenameCancel,
    onDelete, onShare, projects, onMoveToProject,
}: {
    chat: Conversation
    isActive: boolean
    isRenaming: boolean
    onSelect: () => void
    onRenameStart: () => void
    onRenameSave: (v: string) => void
    onRenameCancel: () => void
    onDelete: () => void
    onShare: () => void
    projects: Project[]
    onMoveToProject: (pid: string | null) => void
}) {
    return (
        <div className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group ${isActive ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? "bg-violet-400" : "bg-[#303040] group-hover:bg-[#505060]"}`} />
            {isRenaming ? (
                <InlineRenameInput initialValue={chat.title} onSave={onRenameSave} onCancel={onRenameCancel} />
            ) : (
                <button className="flex-1 min-w-0 text-left" onClick={onSelect} title={chat.title}>
                    <span className={`text-xs truncate block transition-colors ${isActive ? "text-[#f0f0f5] font-medium" : "text-[#707080] group-hover:text-[#a0a0b0]"}`}>
                        {chat.title}
                    </span>
                </button>
            )}
            {!isRenaming && (
                <ConversationMenu
                    chat={chat}
                    onRename={onRenameStart}
                    onDelete={onDelete}
                    onShare={onShare}
                    projects={projects}
                    onMoveToProject={onMoveToProject}
                />
            )}
        </div>
    )
}

// ─── 섹션 헤더 ───────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon?: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1.5 mt-2 first:mt-0">
            {icon && <span className="text-[#404050]">{icon}</span>}
            <p className="text-[10px] font-semibold text-[#404050] uppercase tracking-widest">{label}</p>
        </div>
    )
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default function ChatSidebar({ activeChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [searchKeyword, setSearchKeyword] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
            } catch (e) {
                console.error("fetch 실패:", e)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAll()
    }, [activeChatId])

    // 검색 debounce 300ms
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!searchKeyword.trim()) {
            setSearchResults([])
            setIsSearching(false)
            return
        }
        setIsSearching(true)
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchConversations(searchKeyword)
                setSearchResults(results)
            } catch (e) {
                console.error("검색 실패:", e)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [searchKeyword])

    const projectConvs = useMemo(() => conversations.filter((c) => classifyConversation(c) === "project"), [conversations])
    const recentConvs = useMemo(() => conversations.filter((c) => classifyConversation(c) === "recent"), [conversations])
    const archiveConvs = useMemo(() => conversations.filter((c) => classifyConversation(c) === "archive"), [conversations])

    const handleRename = useCallback(async (id: string, newTitle: string) => {
        try {
            await updateConversationTitle(id, newTitle)
            setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle } : c))
        } catch (e) { console.error("이름 변경 실패:", e) }
        finally { setRenamingId(null) }
    }, [])

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("이 대화를 삭제할까요?")) return
        try {
            await deleteConversation(id)
            setConversations((prev) => prev.filter((c) => c.id !== id))
            if (activeChatId === id) onNewChat?.()
        } catch (e) { console.error("삭제 실패:", e) }
    }, [activeChatId, onNewChat])

    const handleMoveToProject = useCallback(async (chatId: string, projectId: string | null) => {
        try {
            await moveConversationToProject(chatId, projectId)
            setConversations((prev) => prev.map((c) => c.id === chatId ? { ...c, project_id: projectId } : c))
        } catch (e) { console.error("프로젝트 이동 실패:", e) }
    }, [])

    const handleShare = useCallback((chatId: string) => {
        const url = `${window.location.origin}/orbit?chat=${chatId}`
        navigator.clipboard.writeText(url).then(() => alert("링크가 복사됐습니다."))
    }, [])

    const handleSelectChat = useCallback((id: string, onClose?: () => void) => {
        onSelectChat?.(id)
        onClose?.()
        setSearchKeyword("")
    }, [onSelectChat])

    const renderList = (list: Conversation[], onClose?: () => void) => (
        <div className="space-y-0.5">
            {list.map((chat) => (
                <ConversationItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChatId === chat.id}
                    isRenaming={renamingId === chat.id}
                    onSelect={() => handleSelectChat(chat.id, onClose)}
                    onRenameStart={() => setRenamingId(chat.id)}
                    onRenameSave={(v) => handleRename(chat.id, v)}
                    onRenameCancel={() => setRenamingId(null)}
                    onDelete={() => handleDelete(chat.id)}
                    onShare={() => handleShare(chat.id)}
                    projects={projects}
                    onMoveToProject={(pid) => handleMoveToProject(chat.id, pid)}
                />
            ))}
        </div>
    )

    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <aside className="flex flex-col w-64 bg-[#111116] border-r border-[#1e1e28] h-full">
            {/* 헤더 */}
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
                            <button onClick={onClose} className="p-1 rounded-md text-[#404050] hover:text-[#f0f0f5] hover:bg-[#1e1e28] transition-colors">
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

            {/* 검색창 */}
            <div className="px-4 pb-3">
                <SearchBar
                    value={searchKeyword}
                    onChange={setSearchKeyword}
                    onClear={() => setSearchKeyword("")}
                />
            </div>

            {/* 리스트 */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 custom-scrollbar">
                {searchKeyword ? (
                    // 검색 결과
                    <SearchResults
                        results={searchResults}
                        isSearching={isSearching}
                        keyword={searchKeyword}
                        onSelect={(id) => handleSelectChat(id, onClose)}
                        activeId={activeChatId}
                    />
                ) : isLoading ? (
                    <p className="px-2 py-2 text-xs text-[#404050] animate-pulse italic">Thinking...</p>
                ) : (
                    <>
                        {/* Projects 섹션 */}
                        {projectConvs.length > 0 && (
                            <>
                                <SectionHeader icon={<FolderOpen className="w-3 h-3" />} label="Projects" />
                                {renderList(projectConvs, onClose)}
                            </>
                        )}

                        {/* Recent 섹션 */}
                        {recentConvs.length > 0 && (
                            <>
                                <SectionHeader label="Recent" />
                                {renderList(recentConvs, onClose)}
                            </>
                        )}

                        {/* Archive 섹션 */}
                        {archiveConvs.length > 0 && (
                            <>
                                <SectionHeader icon={<Archive className="w-3 h-3" />} label="Archive" />
                                {renderList(archiveConvs, onClose)}
                            </>
                        )}

                        {conversations.length === 0 && (
                            <p className="px-2 py-2 text-xs text-[#404050]">대화가 없습니다.</p>
                        )}
                    </>
                )}
            </div>

            {/* 하단 */}
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="relative z-50 h-full animate-in slide-in-from-left duration-300">
                        <SidebarContent onClose={() => setMobileOpen(false)} />
                    </div>
                </div>
            )}
        </>
    )
}