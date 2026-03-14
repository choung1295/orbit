"use client"

import { useState } from "react"
import { FolderOpen, Plus, MoreHorizontal, Trash2 } from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject, deleteProject } from "@/lib/supabase/queries/projects"
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
    onSelectChat: (id: string) => void
}

export default function ProjectsSection({
    projects,
    conversations,
    activeChatId,
    onProjectsChange,
    onSelectChat,
}: ProjectsSectionProps) {
    const [creating, setCreating] = useState(false)
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

    const handleCreate = async (name: string) => {
        try {
            const project = await createProject(name)
            if (project) {
                onProjectsChange([project, ...projects])
            }
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

    const toggleExpand = (projectId: string) => {
        setExpandedProjects((prev) => {
            const next = new Set(prev)
            if (next.has(projectId)) next.delete(projectId)
            else next.add(projectId)
            return next
        })
    }

    return (
        <div className="mb-1">
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between px-2 py-1.5 group/header">
                <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-[#404050]" />
                    <p className="text-[10px] font-semibold text-[#404050] uppercase tracking-widest">
                        Projects
                    </p>
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className="p-0.5 rounded text-[#404050] hover:text-[#a0a0b0] hover:bg-[#2a2a38] transition-colors opacity-0 group-hover/header:opacity-100"
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
                <p className="px-3 py-1 text-[11px] text-[#404050] italic">프로젝트 없음</p>
            ) : (
                <div className="space-y-0.5">
                    {projects.map((project) => {
                        const projectChats = conversations.filter((c) => c.project_id === project.id)
                        const isExpanded = expandedProjects.has(project.id)

                        return (
                            <div key={project.id}>
                                {/* 프로젝트 행 */}
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#18181f] group/proj transition-colors">
                                    <button
                                        onClick={() => toggleExpand(project.id)}
                                        className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                                    >
                                        <span className="text-[#404050] text-[10px]">
                                            {isExpanded ? "▾" : "▸"}
                                        </span>
                                        <span className="text-xs text-[#707080] group-hover/proj:text-[#a0a0b0] truncate transition-colors">
                                            {project.name}
                                        </span>
                                        {projectChats.length > 0 && (
                                            <span className="text-[10px] text-[#404050] ml-auto shrink-0">
                                                {projectChats.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="p-0.5 rounded text-[#404050] hover:text-red-400 transition-colors opacity-0 group-hover/proj:opacity-100 shrink-0"
                                        aria-label="프로젝트 삭제"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* 프로젝트 내 대화 목록 */}
                                {isExpanded && projectChats.length > 0 && (
                                    <div className="ml-4 space-y-0.5">
                                        {projectChats.map((chat) => (
                                            <button
                                                key={chat.id}
                                                onClick={() => onSelectChat(chat.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left group ${activeChatId === chat.id ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"
                                                    }`}
                                            >
                                                <span className={`w-1 h-1 rounded-full shrink-0 ${activeChatId === chat.id ? "bg-violet-400" : "bg-[#303040]"
                                                    }`} />
                                                <span className={`text-xs truncate ${activeChatId === chat.id
                                                        ? "text-[#f0f0f5] font-medium"
                                                        : "text-[#606070] group-hover:text-[#a0a0b0]"
                                                    }`}>
                                                    {chat.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {isExpanded && projectChats.length === 0 && (
                                    <p className="ml-4 px-2 py-1 text-[11px] text-[#404050] italic">대화 없음</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}