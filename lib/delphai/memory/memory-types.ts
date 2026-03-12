export type MemoryType =
    | "user_preference"
    | "project_principle"
    | "project_decision"
    | "task_continuity"
    | "constraint"
    | "episodic_note"

export type MemoryStatus =
    | "candidate"
    | "active"
    | "superseded"
    | "conflicted"
    | "archived"

export type MemoryScope =
    | "session"
    | "user"
    | "project"
    | "summary"

export type MemorySource =
    | "user_explicit"
    | "user_implied"
    | "assistant_inferred"
    | "system_derived"

export interface MemoryRecord {
    id: string
    user_id: string

    content: string
    type: MemoryType
    scope: MemoryScope
    status: MemoryStatus
    source: MemorySource

    key?: string
    version: number
    project_id?: string

    importance: number
    confidence: number

    tags?: string[]

    created_at: string
    updated_at: string
    last_used_at?: string
    expires_at?: string
}

export const SCOPE_PRIORITY: Record<MemoryScope, number> = {
    session: 4,
    project: 3,
    user: 2,
    summary: 1,
}

export function calculateRecallScore(
    memory: MemoryRecord,
    now: Date = new Date()
): number {
    const scopeScore = SCOPE_PRIORITY[memory.scope] * 10
    const importanceScore = memory.importance * 10
    const confidenceScore = memory.confidence * 10

    let recencyScore = 0
    if (memory.last_used_at) {
        const diffMs = now.getTime() - new Date(memory.last_used_at).getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        recencyScore = Math.max(0, 10 - diffDays * 0.5)
    }

    return scopeScore + importanceScore + confidenceScore + recencyScore
}