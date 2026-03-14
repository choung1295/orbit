"use client"

import { useState, useRef } from "react"
import { Plus, Check, Loader2 } from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject } from "@/lib/supabase/queries/projects"

interface ProjectMoveMenuProps {
    projects: Project[]
    currentProjectId?: string | null
    onMove: (projectId: string) => Promise<void>
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
    const [movingId, setMovingId] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // 모든 이벤트 버블링 차단 — 부모 mousedown이 메뉴를 닫는 것 방지
    const stopAll = (e: React.SyntheticEvent) => {
        e.stopPropagation()
        e.preventDefault()
    }

    const handleMove = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation()
        e.preventDefault()
        if (movingId) return
        setMovingId(projectId)
        try {
            await onMove(projectId)
        } catch (err) {
            console.error("이동 실패:", err)
        } finally {
            setMovingId(null)
        }
    }

    const handleCreateAndMove = async () => {
        const trimmed = newName.trim()
        if (!trimmed) { setCreating(false); return }
        setIsSubmitting(true)
        try {
            const project = await createProject(trimmed)
            if (project) {
                onProjectCreated(project)
                await onMove(project.id)
            }
        } catch (err) {
            console.error("프로젝트 생성 후 이동 실패:", err)
        } finally {
            setIsSubmitting(false)
            setCreating(false)
            setNewName("")
        }
    }

    return (
        <div
            className="w-full py-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
        >
            {projects.length === 0 && !creating && (
                <p className="px-3 py-2 text-[11px] text-zinc-500 italic">프로젝트 없음</p>
            )}

            {projects.map((p) => {
                const isCurrent = currentProjectId === p.id
                const isMoving = movingId === p.id
                return (
                    <button
                        key={p.id}
                        onClick={(e) => handleMove(e, p.id)}
                        onMouseDown={stopAll}
                        disabled={!!movingId}
                        className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left text-xs disabled:opacity-60"
                    >
                        {isMoving ? (
                            <Loader2 className="w-3 h-3 animate-spin shrink-0 text-indigo-400" />
                        ) : isCurrent ? (
                            <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                        ) : (
                            <span className="w-3 h-3 shrink-0" />
                        )}
                        <span className={`truncate ${isCurrent ? "text-indigo-300" : ""}`}>
                            {p.name}
                        </span>
                    </button>
                )
            })}

            <div className="border-t border-white/5 mt-1 pt-1">
                {creating ? (
                    <div className="px-2 py-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <input
                            ref={inputRef}
                            autoFocus
                            type="text"
                            placeholder="프로젝트 이름..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === "Enter") { e.preventDefault(); handleCreateAndMove() }
                                if (e.key === "Escape") { e.preventDefault(); setCreating(false); setNewName("") }
                            }}
                            disabled={isSubmitting}
                            className="w-full bg-white/5 border border-indigo-500/60 rounded-md px-2 py-1 text-xs text-white outline-none focus:border-indigo-400 transition-colors placeholder:text-zinc-500"
                        />
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setCreating(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                        onMouseDown={stopAll}
                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-colors text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        새 프로젝트 만들기
                    </button>
                )}
            </div>
        </div>
    )
}