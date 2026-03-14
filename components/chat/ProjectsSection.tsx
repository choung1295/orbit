"use client"

import { useState } from "react"
import { FolderOpen, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject, deleteProject } from "@/lib/supabase/queries/projects"
import { moveConversationToProject } from "@/lib/supabase/queries/conversations"
import ProjectCreateInput from "@/components/chat/ProjectCreateInput"

interface Conversation {
    id: string
    title: string
    updated_at: string
    storage_type?: string | null
    project_id?: string | null
}

interface ProjectsSectionProps {
    projects: Project[]
    conversations: Conversation[]
    activeChatId?: string
    onProjectsChange: (projects: Project[]) => void
    onConversationMove: (conversationId: string, projectId: string) => void
    onSelectChat: (id: string) => void
}

export default function ProjectsSection({
    projects,
    conversations,
    activeChatId,
    onProjectsChange,
    onConversationMove,
    onSelectChat,
}: ProjectsSectionProps) {
    const [creating, setCreating] = useState(false)
    // 기본값: 모든 프로젝트 펼침
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
    const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)

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

    const handleDelete = async (projectId: string) => {
        if (!confirm("프로젝트를 삭제할까요? 대화는 Recent로 이동됩니다.")) return
        try {
            await deleteProject(projectId)
            onProjectsChange(projects.filter((p) => p.id !== projectId))
        } catch (e) {
            console.error("프로젝트 삭제 실패:", e)
        }
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

    const handleDragLeave = () => {
        setDragOverProjectId(null)
    }

    const handleDrop = async (e: React.DragEvent, projectId: string) => {
        e.preventDefault()
        setDragOverProjectId(null)
        const conversationId = e.dataTransfer.getData("conversationId")
        if (!conversationId) return

        // 이미 같은 프로젝트면 무시
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
                    <FolderOpen className="w-3 h-3 text-zinc-400" />
                    <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">
                        Projects
                    </p>
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className="p-0.5 rounded text-zinc-400 hover:text-white hover:bg-[#2a2a38] transition-colors opacity-0 group-hover/header:opacity-100"
                    aria-label="새 프로젝트"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* 프로젝트 생성 input */}
            {creating && (
                <ProjectCreateInput
                    onSave={handleCreate}
                    onCancel={() => setCreating(false)}
                />
            )}

            {/* 프로젝트 목록 */}
            {projects.length === 0 && !creating ? (
                <p className="px-3 py-1 text-[11px] text-zinc-400 italic">프로젝트 없음</p>
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
                                    onDragLeave={handleDragLeave}
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
                                            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                                        )}
                                        <span className="text-xs text-zinc-200 group-hover/proj:text-white truncate transition-colors font-medium">
                                            {project.name}
                                        </span>
                                        {projectChats.length > 0 && (
                                            <span className="text-[10px] text-zinc-400 ml-auto shrink-0 tabular-nums">
                                                {projectChats.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="p-0.5 rounded text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover/proj:opacity-100 shrink-0"
                                        aria-label="프로젝트 삭제"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* 프로젝트 내 대화 목록 */}
                                {!isCollapsed && (
                                    <div className="ml-3 pl-2 border-l border-[#2a2a38] space-y-0.5 mt-0.5">
                                        {projectChats.length === 0 ? (
                                            <p className="px-2 py-1 text-[11px] text-zinc-500 italic">대화 없음</p>
                                        ) : (
                                            projectChats.map((chat) => (
                                                <button
                                                    key={chat.id}
                                                    onClick={() => onSelectChat(chat.id)}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left group ${activeChatId === chat.id ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"
                                                        }`}
                                                >
                                                    <span className={`w-1 h-1 rounded-full shrink-0 ${activeChatId === chat.id ? "bg-violet-400" : "bg-zinc-600 group-hover:bg-zinc-400"
                                                        }`} />
                                                    <span className={`text-xs truncate transition-colors ${activeChatId === chat.id
                                                            ? "text-white font-medium"
                                                            : "text-zinc-300 group-hover:text-white"
                                                        }`}>
                                                        {chat.title}
                                                    </span>
                                                </button>
                                            ))
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