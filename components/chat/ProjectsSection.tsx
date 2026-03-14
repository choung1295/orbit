"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    FolderOpen, Plus, Trash2, ChevronDown, ChevronRight,
    MoreHorizontal, Pencil, Share2, Trash,
} from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject, deleteProject } from "@/lib/supabase/queries/projects"
import {
    moveConversationToProject,
    updateConversationTitle,
    deleteConversation,
    type Conversation,
} from "@/lib/supabase/queries/conversations"
import ProjectCreateInput from "@/components/chat/ProjectCreateInput"

interface ProjectsSectionProps {
    projects: Project[]
    conversations: Conversation[]
    activeChatId?: string
    onProjectsChange: (projects: Project[]) => void
    onConversationsChange: (conversations: Conversation[]) => void
    onConversationMove: (conversationId: string, projectId: string) => void
    onSelectChat: (id: string) => void
}

// ─── 인라인 이름변경 (프로젝트 내부용) ───────────────────────────────────────

function InlineRename({
    initialValue, onSave, onCancel,
}: { initialValue: string; onSave: (v: string) => void; onCancel: () => void }) {
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
            className="flex-1 min-w-0 bg-[#22222e] border border-indigo-500/60 rounded-md px-2 py-0.5 text-xs text-white outline-none focus:border-indigo-400 transition-colors"
        />
    )
}

// ─── 프로젝트 내부 항목 점세개 메뉴 ──────────────────────────────────────────

function ProjectItemMenu({
    onShare, onRename, onDelete,
}: {
    onShare: () => void
    onRename: () => void
    onDelete: () => void
}) {
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
        <div
            ref={ref}
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => setOpen((v) => !v)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-[#2a2a38] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="메뉴"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {open && (
                <div className="absolute right-0 top-7 z-50 w-40 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-xl shadow-black/40 py-1 text-xs">
                    <button
                        onClick={() => { onShare(); setOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-[#22222e] transition-colors"
                    >
                        <Share2 className="w-3.5 h-3.5" /><span>공유</span>
                    </button>
                    <button
                        onClick={() => { onRename(); setOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-white hover:bg-[#22222e] transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" /><span>이름 변경</span>
                    </button>
                    <div className="border-t border-[#2a2a38] my-1" />
                    <button
                        onClick={() => { onDelete(); setOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash className="w-3.5 h-3.5" /><span>삭제</span>
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default function ProjectsSection({
    projects,
    conversations,
    activeChatId,
    onProjectsChange,
    onConversationsChange,
    onConversationMove,
    onSelectChat,
}: ProjectsSectionProps) {
    const [creating, setCreating] = useState(false)
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
    const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)
    const [renamingId, setRenamingId] = useState<string | null>(null)

    const handleCreate = async (name: string) => {
        try {
            const project = await createProject(name)
            if (project) onProjectsChange([project, ...projects])
        } catch (e) {
            console.error("프로젝트 생성 실패:", e)
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("프로젝트를 삭제할까요? 대화는 Recent로 이동됩니다.")) return
        try {
            await deleteProject(projectId)
            onProjectsChange(projects.filter((p) => p.id !== projectId))
            // 해당 프로젝트 소속 대화를 recent로 복원
            onConversationsChange(conversations.map((c) =>
                c.project_id === projectId
                    ? { ...c, project_id: null, storage_type: "recent" }
                    : c
            ))
        } catch (e) {
            console.error("프로젝트 삭제 실패:", e)
        }
    }

    const handleRenameConversation = async (id: string, newTitle: string) => {
        try {
            await updateConversationTitle(id, newTitle)
            onConversationsChange(conversations.map((c) => c.id === id ? { ...c, title: newTitle } : c))
        } catch (e) {
            console.error("이름 변경 실패:", e)
        } finally {
            setRenamingId(null)
        }
    }

    const handleDeleteConversation = async (id: string) => {
        if (!confirm("이 대화를 삭제할까요?")) return
        try {
            await deleteConversation(id)
            onConversationsChange(conversations.filter((c) => c.id !== id))
        } catch (e) {
            console.error("대화 삭제 실패:", e)
        }
    }

    const handleShare = (chatId: string) => {
        const url = `${window.location.origin}/orbit?chat=${chatId}`
        navigator.clipboard.writeText(url).then(() => alert("링크가 복사됐습니다."))
    }

    const toggleCollapse = (projectId: string) => {
        setCollapsedProjects((prev) => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    // ─── 드롭 핸들러 ─────────────────────────────────────────────────────────

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
        } catch (e) {
            console.error("드롭 이동 실패:", e)
        }
    }

    return (
        <div className="mb-1">
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between px-2 py-1.5 group/header">
                <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-zinc-500" />
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                        Projects
                    </p>
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a38] transition-colors opacity-0 group-hover/header:opacity-100"
                    aria-label="새 프로젝트"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {creating && (
                <ProjectCreateInput onSave={handleCreate} onCancel={() => setCreating(false)} />
            )}

            {projects.length === 0 && !creating ? (
                <p className="px-3 py-1 text-[11px] text-zinc-500 italic">프로젝트 없음</p>
            ) : (
                <div className="space-y-0.5">
                    {projects.map((project) => {
                        const projectChats = conversations.filter((c) => c.project_id === project.id)
                        const isCollapsed = collapsedProjects.has(project.id)
                        const isDragOver = dragOverProjectId === project.id

                        return (
                            <div key={project.id}>
                                {/* 프로젝트 행 — drop target */}
                                <div
                                    onDragOver={(e) => handleDragOver(e, project.id)}
                                    onDragLeave={() => setDragOverProjectId(null)}
                                    onDrop={(e) => handleDrop(e, project.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all group/proj ${isDragOver
                                            ? "bg-indigo-500/20 ring-1 ring-indigo-500/60"
                                            : "hover:bg-[#18181f]"
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleCollapse(project.id)}
                                        className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                                    >
                                        {isCollapsed ? (
                                            <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                                        )}
                                        <span className="text-xs text-zinc-300 group-hover/proj:text-zinc-100 truncate transition-colors font-medium">
                                            {project.name}
                                        </span>
                                        {projectChats.length > 0 && (
                                            <span className="text-[10px] text-zinc-500 ml-auto shrink-0 tabular-nums">
                                                {projectChats.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProject(project.id)}
                                        className="p-0.5 rounded text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover/proj:opacity-100 shrink-0"
                                        aria-label="프로젝트 삭제"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* 프로젝트 내 대화 목록 */}
                                {!isCollapsed && (
                                    <div className="ml-3 pl-2 border-l border-[#2a2a38] space-y-0.5 mt-0.5 mb-1">
                                        {projectChats.length === 0 ? (
                                            <p className="px-2 py-1 text-[11px] text-zinc-600 italic">대화 없음</p>
                                        ) : (
                                            projectChats.map((chat) => {
                                                const isActive = activeChatId === chat.id
                                                const isRenaming = renamingId === chat.id

                                                return (
                                                    <div
                                                        key={chat.id}
                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group ${isActive ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"
                                                            }`}
                                                    >
                                                        <span className={`w-1 h-1 rounded-full shrink-0 ${isActive ? "bg-violet-400" : "bg-zinc-600 group-hover:bg-zinc-500"
                                                            }`} />

                                                        {isRenaming ? (
                                                            <InlineRename
                                                                initialValue={chat.title}
                                                                onSave={(v) => handleRenameConversation(chat.id, v)}
                                                                onCancel={() => setRenamingId(null)}
                                                            />
                                                        ) : (
                                                            <button
                                                                className="flex-1 min-w-0 text-left"
                                                                onClick={() => onSelectChat(chat.id)}
                                                                title={chat.title}
                                                            >
                                                                <span className={`text-xs truncate block transition-colors ${isActive
                                                                        ? "text-zinc-100 font-medium"
                                                                        : "text-zinc-400 group-hover:text-zinc-200"
                                                                    }`}>
                                                                    {chat.title}
                                                                </span>
                                                            </button>
                                                        )}

                                                        {!isRenaming && (
                                                            <ProjectItemMenu
                                                                onShare={() => handleShare(chat.id)}
                                                                onRename={() => setRenamingId(chat.id)}
                                                                onDelete={() => handleDeleteConversation(chat.id)}
                                                            />
                                                        )}
                                                    </div>
                                                )
                                            })
                                        )}
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