"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import {
    Plus, MessageSquare, Settings, ChevronDown,
    Menu, X, MoreHorizontal, Pencil, Share2,
    FolderInput, Trash2, Archive,
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
            className="flex-1 min-w-0 bg-white/5 border border-indigo-500/60 rounded-md px-2 py-0.5 text-xs text-white outline-none focus:border-indigo-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        />
    )
}

// ─── 공통 MenuItem ────────────────────────────────────────────────────────────

function MenuItem({ icon, label, onClick, danger = false }: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
    return (
        <button
            onClick={onClick}
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-xs ${danger
                    ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
        >
            {icon}<span>{label}</span>
        </button>
    )
}

// ─── 점세개 메뉴 — click 기반 서브패널 ───────────────────────────────────────

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
    // "main" | "project" — 서브메뉴를 같은 패널에서 전환
    const [panel, setPanel] = useState<"main" | "project">("main")
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
                setPanel("main")
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    const close = () => { setOpen(false); setPanel("main") }

    return (
        <div
            ref={menuRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => { setOpen((v) => !v); setPanel("main") }}
                className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="메뉴"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div className="absolute right-0 top-7 z-50 w-48 rounded-xl bg-[#1a1a24] border border-white/10 shadow-xl shadow-black/50 py-1 text-xs">
                    {panel === "main" ? (
                        <>
                            <MenuItem icon={<Share2 className="w-3.5 h-3.5" />} label="공유"
                                onClick={() => { onShare(); close() }} />
                            <MenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="이름 변경"
                                onClick={() => { onRename(); close() }} />

                            {/* 프로젝트로 이동 — click으로 패널 전환 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setPanel("project") }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-xs"
                            >
                                <FolderInput className="w-3.5 h-3.5" />
                                <span className="flex-1 text-left">프로젝트로 이동</span>
                                <span className="text-zinc-600 text-[10px]">▶</span>
                            </button>

                            <div className="border-t border-white/5 my-1" />
                            <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="삭제" danger
                                onClick={() => { onDelete(); close() }} />
                        </>
                    ) : (
                        <>
                            {/* 프로젝트 목록 패널 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setPanel("main") }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors text-xs border-b border-white/5 mb-1"
                            >
                                <span className="text-[10px]">◀</span>
                                <span>프로젝트 선택</span>
                            </button>
                            <ProjectMoveMenu
                                projects={projects}
                                currentProjectId={currentProjectId}
                                onMove={async (projectId) => {
                                    await onMoveToProject(projectId)
                                    close()
                                }}
                                onProjectCreated={(project) => {
                                    onProjectCreated(project)
                                }}
                            />
                        </>
                    )}
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
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group cursor-grab active:cursor-grabbing select-none ${isActive ? "bg-[#1e1e2e]" : "hover:bg-white/[0.04]"
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
                    <span className={`text-xs truncate block transition-colors ${isActive ? "text-zinc-100 font-medium" : "text-zinc-400 group-hover:text-zinc-200"
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
        } catch {
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

    const handleMoveToProject = useCallback(async (chatId: string, projectId: string) => {
        // optimistic update
        setConversations((prev) => prev.map((c) =>
            c.id === chatId ? { ...c, project_id: projectId, storage_type: "project" } : c
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
                                className="p-1 rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-white/5 transition-colors">
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
                <SearchBar onSearch={handleSearch} onClear={handleSearchClear} />
            </div>

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
                        <ProjectsSection
                            projects={projects}
                            conversations={conversations}
                            activeChatId={activeChatId}
                            onProjectsChange={setProjects}
                            onConversationsChange={setConversations}
                            onConversationMove={(convId, projectId) => handleMoveToProject(convId, projectId)}
                            onSelectChat={(id) => handleSelectChat(id, onClose)}
                        />

                        {recentConvs.length > 0 && (
                            <>
                                <SectionHeader label="Recent" />
                                {renderList(recentConvs, onClose)}
                            </>
                        )}

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

            <div className="px-3 py-3 border-t border-[#1e1e28] space-y-0.5">
                <Link 
                    href="/orbit/cctv"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-indigo-400 hover:bg-white/[0.04] hover:text-indigo-300 transition-colors text-xs font-medium"
                >
                    <FolderInput className="w-3.5 h-3.5 shrink-0" />
                    실시간 CCTV 지도
                </Link>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors text-xs">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    제안하기
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors text-xs">
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
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#1e1e26] border border-white/10 text-zinc-400 hover:text-white transition-colors shadow-lg"
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