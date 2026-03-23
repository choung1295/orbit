"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    FolderOpen, Plus, Trash2, ChevronDown, ChevronRight,
    MoreHorizontal, Pencil, Share2, Trash,
} from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject, deleteProject, updateProjectName } from "@/lib/supabase/queries/projects"
import {
    moveConversationToProject,
    updateConversationTitle,
    deleteConversation,
    type Conversation,
} from "@/lib/supabase/queries/conversations"
import ProjectCreateInput from "@/components/chat/ProjectCreateInput"
import { useTheme } from "@/components/chat/ThemeContext"

interface ProjectsSectionProps {
    projects: Project[]
    conversations: Conversation[]
    activeChatId?: string
    onProjectsChange: (projects: Project[]) => void
    onConversationsChange: (conversations: Conversation[]) => void
    onConversationMove: (conversationId: string, projectId: string) => void
    onSelectChat: (id: string) => void
}

// ─── 인라인 이름변경 ──────────────────────────────────────────────────────────

function InlineRename({
    initialValue, onSave, onCancel,
}: { initialValue: string; onSave: (v: string) => void; onCancel: () => void }) {
    const { theme } = useTheme()
    const d = theme.isDark
    const [value, setValue] = useState(initialValue)
    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

    const save = useCallback(() => {
        const t = value.trim()
        if (t && t !== initialValue) onSave(t)
        else onCancel()
    }, [value, initialValue, onSave, onCancel])

    return (
        <input
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); save() }
                if (e.key === "Escape") { e.preventDefault(); onCancel() }
            }}
            onBlur={save}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 min-w-0 rounded-md px-2 py-0.5 text-xs outline-none transition-colors ${d
                ? 'bg-white/5 border border-indigo-500/60 text-white focus:border-indigo-400'
                : 'border border-indigo-500 text-gray-800 focus:border-indigo-600'}`}
            style={d ? {} : { backgroundColor: theme.inlineInput }}
        />
    )
}

// ─── 프로젝트 내부 항목 점세개 메뉴 ──────────────────────────────────────────

function ProjectItemMenu({
    onShare, onRename, onDelete,
}: { onShare: () => void; onRename: () => void; onDelete: () => void }) {
    const { theme } = useTheme()
    const d = theme.isDark
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    return (
        <div ref={ref} className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => setOpen((v) => !v)}
                className={`p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${d
                    ? 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'}`}
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {open && (
                <div
                    className="absolute right-0 top-7 z-50 w-36 rounded-xl py-1 text-xs shadow-xl"
                    style={{
                        backgroundColor: theme.dropdown,
                        border: `1px solid ${theme.dropdownBorder}`,
                        boxShadow: d ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                >
                    <button
                        onClick={() => { onShare(); setOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${d
                            ? 'text-zinc-300 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-black/5'}`}
                    >
                        <Share2 className="w-3.5 h-3.5" /><span>공유</span>
                    </button>
                    <button
                        onClick={() => { onRename(); setOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${d
                            ? 'text-zinc-300 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-black/5'}`}
                    >
                        <Pencil className="w-3.5 h-3.5" /><span>이름 변경</span>
                    </button>
                    <div className="my-1" style={{ height: '1px', backgroundColor: d ? 'rgba(255,255,255,0.05)' : theme.panelBorder }} />
                    <button
                        onClick={() => { onDelete(); setOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash className="w-3.5 h-3.5" /><span>삭제</span>
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── 프로젝트 헤더 점세개 메뉴 ───────────────────────────────────────────────

function ProjectHeaderMenu({
    onRename, onDelete,
}: { onRename: () => void; onDelete: () => void }) {
    const { theme } = useTheme()
    const d = theme.isDark
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    return (
        <div ref={ref} className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => setOpen((v) => !v)}
                className={`p-0.5 rounded transition-colors opacity-0 group-hover/proj:opacity-100 focus:opacity-100 ${d
                    ? 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'}`}
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {open && (
                <div
                    className="absolute right-0 top-6 z-50 w-36 rounded-xl py-1 text-xs shadow-xl"
                    style={{
                        backgroundColor: theme.dropdown,
                        border: `1px solid ${theme.dropdownBorder}`,
                        boxShadow: d ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                >
                    <button
                        onClick={() => { onRename(); setOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${d
                            ? 'text-zinc-300 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-black/5'}`}
                    >
                        <Pencil className="w-3.5 h-3.5" /><span>이름 변경</span>
                    </button>
                    <div className="my-1" style={{ height: '1px', backgroundColor: d ? 'rgba(255,255,255,0.05)' : theme.panelBorder }} />
                    <button
                        onClick={() => { onDelete(); setOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" /><span>삭제</span>
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default function ProjectsSection({
    projects, conversations, activeChatId,
    onProjectsChange, onConversationsChange, onConversationMove, onSelectChat,
}: ProjectsSectionProps) {
    const { theme } = useTheme()
    const d = theme.isDark

    const [creating, setCreating] = useState(false)
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)
    const [renamingConvId, setRenamingConvId] = useState<string | null>(null)
    const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)

    const handleCreateProject = async (name: string) => {
        try {
            const project = await createProject(name)
            if (project) onProjectsChange([project, ...projects])
        } catch (e) { console.error("프로젝트 생성 실패:", e) }
        finally { setCreating(false) }
    }

    const handleRenameProject = async (projectId: string, newName: string) => {
        try {
            await updateProjectName(projectId, newName)
            onProjectsChange(projects.map((p) => p.id === projectId ? { ...p, name: newName } : p))
        } catch (e) { console.error("프로젝트 이름 변경 실패:", e) }
        finally { setRenamingProjectId(null) }
    }

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("프로젝트를 삭제할까요? 대화는 Recent로 이동됩니다.")) return
        try {
            await deleteProject(projectId)
            onProjectsChange(projects.filter((p) => p.id !== projectId))
            onConversationsChange(conversations.map((c) =>
                c.project_id === projectId ? { ...c, project_id: null, storage_type: "recent" } : c
            ))
        } catch (e) { console.error("프로젝트 삭제 실패:", e) }
    }

    const handleRenameConversation = async (id: string, newTitle: string) => {
        try {
            await updateConversationTitle(id, newTitle)
            onConversationsChange(conversations.map((c) => c.id === id ? { ...c, title: newTitle } : c))
        } catch (e) { console.error("이름 변경 실패:", e) }
        finally { setRenamingConvId(null) }
    }

    const handleDeleteConversation = async (id: string) => {
        if (!confirm("이 대화를 삭제할까요?")) return
        try {
            await deleteConversation(id)
            onConversationsChange(conversations.filter((c) => c.id !== id))
        } catch (e) { console.error("대화 삭제 실패:", e) }
    }

    const handleShare = (chatId: string) => {
        const url = `${window.location.origin}/orbit?chat=${chatId}`
        navigator.clipboard.writeText(url).then(() => alert("링크가 복사됐습니다."))
    }

    const toggleCollapse = (projectId: string) => {
        setExpandedProjects((prev) => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    const handleDragOver = (e: React.DragEvent, projectId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverProjectId(projectId)
    }

    const handleDrop = async (e: React.DragEvent, projectId: string) => {
        e.preventDefault()
        setDragOverProjectId(null)
        const conversationId = e.dataTransfer.getData("conversationId")
        if (!conversationId) return
        const conv = conversations.find((c) => c.id === conversationId)
        if (conv?.project_id === projectId) return
        try {
            await moveConversationToProject(conversationId, projectId)
            onConversationMove(conversationId, projectId)
        } catch (e) { console.error("드롭 이동 실패:", e) }
    }

    return (
        <div className="mb-1">
            {/* 섹션 헤더 */}
            <div
                className="flex items-center justify-between px-2 py-1.5 group/header sticky top-0 z-10"
                style={{ backgroundColor: theme.panel }}
            >
                <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3" style={{ color: theme.textMuted }} />
                    <p
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: theme.textMuted }}
                    >
                        Projects
                    </p>
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className={`p-0.5 rounded transition-colors opacity-0 group-hover/header:opacity-100 ${d
                        ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'}`}
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {creating && (
                <ProjectCreateInput onSave={handleCreateProject} onCancel={() => setCreating(false)} />
            )}

            {projects.length === 0 && !creating ? (
                <p className="px-3 py-1 text-[11px] italic" style={{ color: theme.textMuted }}>프로젝트 없음</p>
            ) : (
                <div className="space-y-0.5">
                    {projects.map((project) => {
                        const projectChats = conversations.filter((c) => c.project_id === project.id)
                        const isCollapsed = !expandedProjects.has(project.id)
                        const isDragOver = dragOverProjectId === project.id
                        const isRenamingProject = renamingProjectId === project.id

                        return (
                            <div key={project.id}>
                                {/* 프로젝트 행 */}
                                <div
                                    onDragOver={(e) => handleDragOver(e, project.id)}
                                    onDragLeave={() => setDragOverProjectId(null)}
                                    onDrop={(e) => handleDrop(e, project.id)}
                                    className={`flex items-center gap-1 px-2 py-[3px] rounded-lg transition-all group/proj ${isDragOver
                                        ? "bg-indigo-500/20 ring-1 ring-indigo-500/50"
                                        : ""}`}
                                    style={isDragOver ? {} : { cursor: 'default' }}
                                    onMouseEnter={e => { if (!isDragOver) e.currentTarget.style.backgroundColor = theme.hover }}
                                    onMouseLeave={e => { if (!isDragOver) e.currentTarget.style.backgroundColor = 'transparent' }}
                                >
                                    <button
                                        onClick={() => !isRenamingProject && toggleCollapse(project.id)}
                                        className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                                    >
                                        {isCollapsed
                                            ? <ChevronRight className="w-3 h-3 shrink-0" style={{ color: theme.textMuted }} />
                                            : <ChevronDown className="w-3 h-3 shrink-0" style={{ color: theme.textMuted }} />
                                        }
                                        {isRenamingProject ? (
                                            <InlineRename
                                                initialValue={project.name}
                                                onSave={(v) => handleRenameProject(project.id, v)}
                                                onCancel={() => setRenamingProjectId(null)}
                                            />
                                        ) : (
                                            <>
                                                <span
                                                    className="text-xs truncate transition-colors font-medium"
                                                    style={{ color: d ? '#c0c0d0' : theme.textSub }}
                                                >
                                                    {project.name}
                                                </span>
                                                {projectChats.length > 0 && (
                                                    <span
                                                        className="text-[10px] ml-auto shrink-0 tabular-nums"
                                                        style={{ color: theme.textMuted }}
                                                    >
                                                        {projectChats.length}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {!isRenamingProject && (
                                        <ProjectHeaderMenu
                                            onRename={() => setRenamingProjectId(project.id)}
                                            onDelete={() => handleDeleteProject(project.id)}
                                        />
                                    )}
                                </div>

                                {/* 프로젝트 내 대화 목록 */}
                                {!isCollapsed && (
                                    <div
                                        className="ml-3 pl-2 space-y-0.5 mt-0.5 mb-1"
                                        style={{ borderLeft: `1px solid ${d ? 'rgba(255,255,255,0.05)' : theme.panelBorder}` }}
                                    >
                                        {projectChats.length === 0 ? (
                                            <p className="px-2 py-1 text-[11px] italic" style={{ color: theme.textMuted }}>대화 없음</p>
                                        ) : projectChats.map((chat) => {
                                            const isActive = activeChatId === chat.id
                                            const isRenaming = renamingConvId === chat.id

                                            return (
                                                <div
                                                    key={chat.id}
                                                    className="flex items-center gap-2 px-2 py-[3px] rounded-lg transition-colors group"
                                                    style={{ backgroundColor: isActive ? theme.active : undefined }}
                                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = theme.hover }}
                                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                                                >
                                                    <span
                                                        className="w-1 h-1 rounded-full shrink-0"
                                                        style={{ backgroundColor: isActive ? '#a78bfa' : (d ? '#52525b' : '#d1d5db') }}
                                                    />

                                                    {isRenaming ? (
                                                        <InlineRename
                                                            initialValue={chat.title}
                                                            onSave={(v) => handleRenameConversation(chat.id, v)}
                                                            onCancel={() => setRenamingConvId(null)}
                                                        />
                                                    ) : (
                                                        <button
                                                            className="flex-1 min-w-0 text-left"
                                                            onClick={() => onSelectChat(chat.id)}
                                                            title={chat.title}
                                                        >
                                                            <span
                                                                className="text-xs truncate block transition-colors"
                                                                style={{
                                                                    color: isActive ? theme.text : theme.textSub,
                                                                    fontWeight: isActive ? 500 : 400,
                                                                }}
                                                            >
                                                                {chat.title}
                                                            </span>
                                                        </button>
                                                    )}

                                                    {!isRenaming && (
                                                        <ProjectItemMenu
                                                            onShare={() => handleShare(chat.id)}
                                                            onRename={() => setRenamingConvId(chat.id)}
                                                            onDelete={() => handleDeleteConversation(chat.id)}
                                                        />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
