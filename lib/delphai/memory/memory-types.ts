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
    | "session"    // 현재 대화에서만 유효
    | "user"       // 사용자 장기 기억
    | "project"    // 특정 프로젝트에 묶인 기억
    | "summary"    // 요약된 압축 기억

export interface MemoryRecord {
    id: string
    user_id: string
    content: string
    type: MemoryType
    scope: MemoryScope
    status: MemoryStatus
    project_id?: string    // scope가 project일 때만 사용
    created_at: string
    updated_at: string
}