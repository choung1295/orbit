"use client"

import { useState, useRef } from "react"
import { Plus, Check } from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject } from "@/lib/supabase/queries/projects"

interface ProjectMoveMenuProps {
    projects: Project[]
    currentProjectId?: string | null
    onMove: (projectId: string, projectName: string) => void
    onProjectCreated: (project: Project) => void
}

export default function ProjectMoveMenu({
    projects,
    currentProjectId,
    onMove,
    onProjectCreated,
}: ProjectMoveMenuProps) {
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleCreateAndMove = async () => {
        const trimmed = newName.trim()
        if (!trimmed) { setCreating(false); return }

        setIsSubmitting(true)
        try {
            const project = await createProject(trimmed)
            if (project) {
                onProjectCreated(project)
                onMove(project.id, project.name)
            }
        } catch (e) {
            console.error("프로젝트 생성 실패:", e)
        } finally {
            setIsSubmitting(false)
            setCreating(false)
            setNewName("")
        }
    }

    return (
        <div className="w-full">
            {projects.length === 0 && !creating ? (
                <p className="px-3 py-2 text-[11px] text-[#505060] italic">프로젝트 없음</p>
            ) : (
                projects.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onMove(p.id, p.name)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[#909098] hover:text-[#e0e0e8] hover:bg-[#22222e] transition-colors text-left text-xs"
                    >
                        {currentProjectId === p.id && (
                            <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                        )}
                        <span className={`truncate ${currentProjectId === p.id ? "text-indigo-300" : ""}`}>
                            {p.name}
                        </span>
                    </button>
                ))
            )}

            <div className="border-t border-[#2a2a38] mt-1 pt-1">
                {creating ? (
                    <div className="px-2 py-1">
                        <input
                            ref={inputRef}
                            autoFocus
                            type="text"
                            placeholder="프로젝트 이름..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); handleCreateAndMove() }
                                if (e.key === "Escape") { e.preventDefault(); setCreating(false); setNewName("") }
                            }}
                            onBlur={() => {
                                if (!isSubmitting) {
                                    setTimeout(() => { setCreating(false); setNewName("") }, 150)
                                }
                            }}
                            disabled={isSubmitting}
                            className="w-full bg-[#1a1a24] border border-indigo-500/60 rounded-md px-2 py-1 text-xs text-[#f0f0f5] outline-none focus:border-indigo-400 transition-colors placeholder:text-[#505060]"
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => { setCreating(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-[#22222e] transition-colors text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        새 프로젝트 만들기
                    </button>
                )}
            </div>
        </div>
    )
}