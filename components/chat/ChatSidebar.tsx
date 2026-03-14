"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import {
    Plus, MessageSquare, Settings, ChevronDown,
    Menu, X, MoreHorizontal, Pencil, Share2,
    FolderInput, Trash2, ChevronRight, Archive,
} from "lucide-react"

import {
    getConversations,
    updateConversationTitle,
    deleteConversation,
    moveConversationToProject,
    type Conversation,
} from "@/lib/supabase/queries/conversations"

import { getProjects, type Project } from "@/lib/supabase/queries/projects"
import { searchConversations, type SearchResult } from "@/lib/supabase/queries/searchConversations"

import SearchBar from "@/components/chat/SearchBar"
import SearchResults from "@/components/chat/SearchResults"
import ProjectsSection from "@/components/chat/ProjectsSection"
import ProjectMoveMenu from "@/components/chat/ProjectMoveMenu"

interface ChatSidebarProps {
    activeChatId?: string
    onSelectChat?: (id: string) => void
    onNewChat?: () => void
}

// ─── 날짜 분류 ────────────────────────────────────────────────────────────────

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

function classifyConversation(c: Conversation): "project" | "recent" | "archive" {
    if (c.storage_type === "project" || c.project_id) return "project"
    if (c.storage_type === "recent") return "recent"
    if (c.storage_type === "archive") return "archive"
    const age = Date.now() - new Date(c.updated_at).getTime()
    return age <= SEVEN_DAYS ? "recent" : "archive"
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
            className="flex-1 min-w-0 bg-[#22222e] border border-indigo-500/60 rounded-md px-2 py-0.5 text-xs text-white outline-none focus:border-indigo-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
        />
    )
}

// ─── 공통 MenuItem ────────────────────────────────────────────────────────────

function MenuItem({ icon, label, onClick, danger = false }: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-xs ${danger
                    ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    : "text-zinc-300 hover:text-white hover:bg-[#22222e]"
                }`}
        >
            {icon}<span>{label}</span>
        </button>
    )
}

// ─── 점세개 메뉴 (Recent/Archive용) ──────────────────────────────────────────

function ConversationMenu({
    onRename, onDelete, onShare, projects, currentProjectId,
    onMoveToProject, onProjectCreated,
}: {
    onRename: () => void
    onDelete: () => void
    onShare: () => void
    projects: Project[]
    currentProjectId?: string | null
    onMoveToProject: (projectId: string) => Promise<void>
    onProjectCreated: (project: Project) => void
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
        <div
            ref={menuRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => { setOpen((v) => !v); setProjectSubOpen(false) }}
                className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-[#2a2a38] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="메뉴"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div className="absolute right-0 top-7 z-50 w-44 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1 text-xs">
                    <MenuItem icon={<Share2 className="w-3.5 h-3.5" />} label="공유"
                        onClick={() => { onShare(); setOpen(false) }} />
                    <MenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="이름 변경"
                        onClick={() => { onRename(); setOpen(false) }} />

                    {/* 프로젝트로 이동 서브메뉴 */}
                    <div
                        className="relative"
                        onMouseEnter={() => setProjectSubOpen(true)}
                        onMouseLeave={() => setProjectSubOpen(false)}
                    >
                        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-[#22222e] transition-colors text-xs">
                            <FolderInput className="w-3.5 h-3.5" />
                            <span className="flex-1 text-left">프로젝트로 이동</span>
                            <ChevronRight className="w-3 h-3 text-zinc-500" />
                        </button>
                        {projectSubOpen && (
                            <div
                                className="absolute left-full top-0 ml-1 w-48 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <ProjectMoveMenu
                                    projects={projects}
                                    currentProjectId={currentProjectId}
                                    onMove={async (projectId) => {
                                        await onMoveToProject(projectId)
                                        setOpen(false)
                                        setProjectSubOpen(false)
                                    }}
                                    onProjectCreated={onProjectCreated}
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#2a2a38] my-1" />
                    <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="삭제" danger
                        onClick={() => { onDelete(); setOpen(false) }} />
                </div>
            )}
        </div>
    )
}

// ─── 대화 항목 행 (draggable) ─────────────────────────────────────────────────

function ConversationItem({
    chat, isActive, isRenaming,
    onSelect, onRenameStart, onRenameSave, onRenameCancel,
    onDelete, onShare, projects, onMoveToProject, onProjectCreated,
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
    onMoveToProject: (projectId: string) => Promise<void>
    onProjectCreated: (project: Project) => void
}) {
    const [isDragging, setIsDragging] = useState(false)

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("conversationId", chat.id)
                e.dataTransfer.effectAllowed = "move"
                setIsDragging(true)
            }}
            onDragEnd={() => setIsDragging(false)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group cursor-grab active:cursor-grabbing ${isActive ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"
                } ${isDragging ? "opacity-40" : ""}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? "bg-violet-400" : "bg-zinc-600 group-hover:bg-zinc-500"
                }`} />

            {isRenaming ? (
                <InlineRenameInput
                    initialValue={chat.title}
                    onSave={onRenameSave}
                    onCancel={onRenameCancel}
                />
            ) : (
                <button className="flex-1 min-w-0 text-left" onClick={onSelect} title={chat.title}>
                    <span className={`text-xs truncate block transition-colors ${isActive
                            ? "text-zinc-100 font-medium"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        }`}>
                        {chat.title}
                    </span>
                </button>
            )}

            {!isRenaming && (
                <ConversationMenu
                    onRename={onRenameStart}
                    onDelete={onDelete}
                    onShare={onShare}
                    projects={projects}
                    currentProjectId={chat.project_id}
                    onMoveToProject={onMoveToProject}
                    onProjectCreated={onProjectCreated}
                />
            )}
        </div>
    )
}

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon?: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1.5 mt-3">
            {icon && <span className="text-zinc-500">{icon}</span>}
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">{label}</p>
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

    const handleSearch = useCallback(async (keyword: string) => {
        if (keyword.trim().length < 2) { setSearchResults([]); setSearchKeyword(""); return }
        setSearchKeyword(keyword)
        setIsSearching(true)
        try {
            const results = await searchConversations(keyword)
            setSearchResults(results)
        } catch (e) {
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, [])

    const handleSearchClear = useCallback(() => {
        setSearchKeyword("")
        setSearchResults([])
        setIsSearching(false)
    }, [])

    // ─── 프로젝트 이동 — optimistic update ───────────────────────────────────
    const handleMoveToProject = useCallback(async (chatId: string, projectId: string) => {
        setConversations((prev) => prev.map((c) =>
            c.id === chatId
                ? { ...c, project_id: projectId, storage_type: "project" }
                : c
        ))
        try {
            await moveConversationToProject(chatId, projectId)
        } catch (e) {
            console.error("프로젝트 이동 실패:", e)
            const original = await getConversations()
            setConversations(original)
        }
    }, [])

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

    const handleShare = useCallback((chatId: string) => {
        const url = `${window.location.origin}/orbit?chat=${chatId}`
        navigator.clipboard.writeText(url).then(() => alert("링크가 복사됐습니다."))
    }, [])

    const handleSelectChat = useCallback((id: string, onClose?: () => void) => {
        onSelectChat?.(id)
        onClose?.()
        handleSearchClear()
    }, [onSelectChat, handleSearchClear])

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
                    onMoveToProject={(projectId) => handleMoveToProject(chat.id, projectId)}
                    onProjectCreated={(p) => setProjects((prev) => [p, ...prev])}
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
                        <span className="font-semibold text-zinc-100 text-sm group-hover:text-violet-300 transition-colors tracking-wide">
                            Orbit
                        </span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <ChevronDown className="w-4 h-4 text-zinc-600" />
                        {onClose && (
                            <button onClick={onClose}
                                className="p-1 rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-[#1e1e28] transition-colors">
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
            <div className="px-4 pb-3 relative">
                <SearchBar onSearch={handleSearch} onClear={handleSearchClear} />
            </div>

            {/* 리스트 */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 custom-scrollbar">
                {searchKeyword.length >= 2 ? (
                    <SearchResults
                        results={searchResults}
                        isSearching={isSearching}
                        keyword={searchKeyword}
                        onSelect={(id) => handleSelectChat(id, onClose)}
                        activeId={activeChatId}
                    />
                ) : isLoading ? (
                    <p className="px-2 py-2 text-xs text-zinc-500 animate-pulse italic">Thinking...</p>
                ) : (
                    <>
                        {/* Projects */}
                        <ProjectsSection
                            projects={projects}
                            conversations={conversations}
                            activeChatId={activeChatId}
                            onProjectsChange={setProjects}
                            onConversationsChange={setConversations}
                            onConversationMove={(convId, projectId) => handleMoveToProject(convId, projectId)}
                            onSelectChat={(id) => handleSelectChat(id, onClose)}
                        />

                        {/* Recent */}
                        {recentConvs.length > 0 && (
                            <>
                                <SectionHeader label="Recent" />
                                {renderList(recentConvs, onClose)}
                            </>
                        )}

                        {/* Archive */}
                        {archiveConvs.length > 0 && (
                            <>
                                <SectionHeader icon={<Archive className="w-3 h-3" />} label="Archive" />
                                {renderList(archiveConvs, onClose)}
                            </>
                        )}

                        {conversations.length === 0 && projects.length === 0 && (
                            <p className="px-2 py-2 text-xs text-zinc-500">대화가 없습니다.</p>
                        )}
                    </>
                )}
            </div>

            {/* 하단 */}
            <div className="px-3 py-3 border-t border-[#1e1e28] space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:bg-[#18181f] hover:text-zinc-200 transition-colors text-xs">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    제안하기
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:bg-[#18181f] hover:text-zinc-200 transition-colors text-xs">
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
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#1e1e26] border border-[#2a2a35] text-zinc-400 hover:text-white transition-colors shadow-lg"
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