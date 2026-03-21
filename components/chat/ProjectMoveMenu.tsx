"use client"

import { useState, useRef } from "react"
import { Plus, Check, Loader2 } from "lucide-react"
import type { Project } from "@/lib/supabase/queries/projects"
import { createProject } from "@/lib/supabase/queries/projects"
import { useTheme } from "@/components/chat/ThemeContext"

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
    const { theme } = useTheme()
    const d = theme.isDark
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [movingId, setMovingId] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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
                <p className="px-3 py-2 text-[11px] italic" style={{ color: theme.textMuted }}>프로젝트 없음</p>
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
                        className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left text-xs disabled:opacity-60 ${d
                            ? 'text-zinc-300 hover:text-white hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-black/5'}`}
                    >
                        {isMoving ? (
                            <Loader2 className="w-3 h-3 animate-spin shrink-0 text-indigo-400" />
                        ) : isCurrent ? (
                            <Check className="w-3 h-3 text-indigo-400 shrink-0" />
                        ) : (
                            <span className="w-3 h-3 shrink-0" />
                        )}
                        <span className={`truncate ${isCurrent ? "text-indigo-400" : ""}`}>
                            {p.name}
                        </span>
                    </button>
                )
            })}

            <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${d ? 'rgba(255,255,255,0.05)' : theme.panelBorder}` }}>
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
                            className={`w-full rounded-md px-2 py-1 text-xs outline-none transition-colors ${d
                                ? 'bg-white/5 border border-indigo-500/60 text-white focus:border-indigo-400 placeholder:text-zinc-500'
                                : 'border border-indigo-500 text-gray-800 focus:border-indigo-600'}`}
                            style={d ? {} : { backgroundColor: theme.inlineInput, color: theme.text }}
                        />
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setCreating(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                        onMouseDown={stopAll}
                        className="w-full flex items-center gap-2 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        새 프로젝트 만들기
                    </button>
                )}
            </div>
        </div>
    )
}
