import { createClient } from "@/lib/supabase/client"
import { MemoryType, MemoryScope, MemorySource } from "./memory-types"

// 저장할 가치가 있는지 판단
function shouldSave(message: string, response: string): boolean {
    const saveKeywords = [
        "기억해",
        "저장해",
        "중요해",
        "결정했어",
        "선택했어",
        "앞으로",
        "방향",
        "원칙",
        "계획",
        "프로젝트",
        "고정",
        "확정",
    ]

    const combined = `${message} ${response}`
    return saveKeywords.some((k) => combined.includes(k)) || message.length > 100
}

// 메시지 유형 감지
function detectType(message: string): MemoryType {
    if (/원칙|규칙|정책/.test(message)) return "project_principle"
    if (/결정|선택|확정/.test(message)) return "project_decision"
    if (/계속|이어서|다음에/.test(message)) return "task_continuity"
    if (/하지마|금지|제한/.test(message)) return "constraint"
    if (/좋아|싫어|선호|스타일/.test(message)) return "user_preference"
    return "episodic_note"
}

// scope 감지
function detectScope(message: string, projectId?: string): MemoryScope {
    if (/좋아|싫어|선호|습관|스타일|성격/.test(message)) return "user"
    if (projectId) return "project"
    return "user"
}

// importance 계산
function calcImportance(message: string, type: MemoryType): number {
    const highImportance: MemoryType[] = [
        "project_principle",
        "project_decision",
        "constraint",
    ]

    const base = highImportance.includes(type) ? 0.8 : 0.5

    if (/기억해|저장해|중요해|반드시/.test(message)) return 1.0
    if (message.length > 200) return Math.min(base + 0.1, 1.0)

    return base
}

// source 결정
function detectSource(message: string): MemorySource {
    if (/기억해|저장해|중요해|앞으로|내가 원하는 건|원칙은/.test(message)) {
        return "user_explicit"
    }
    return "user_implied"
}

// confidence 계산
function calcConfidence(source: MemorySource): number {
    switch (source) {
        case "user_explicit":
            return 0.95
        case "user_implied":
            return 0.75
        case "assistant_inferred":
            return 0.6
        case "system_derived":
            return 0.8
        default:
            return 0.7
    }
}

// key 생성
function buildMemoryKey(
    type: MemoryType,
    scope: MemoryScope,
    projectId?: string
): string | undefined {
    if (scope === "project" && projectId) {
        return `project.${projectId}.${type}`
    }
    if (scope === "user") {
        return `user.${type}`
    }
    if (scope === "session") {
        return `session.${type}`
    }
    return `summary.${type}`
}

// tags 생성
function buildTags(
    message: string,
    type: MemoryType,
    scope: MemoryScope,
    projectId?: string
): string[] {
    const tags: string[] = [type, scope]

    if (projectId) {
        tags.push(projectId)
    }

    if (message.match(/(오르빗|orbit|orbitai)/i)) {
        tags.push("orbit")
    }

    if (message.match(/(델파이|delphai)/i)) {
        tags.push("delphai")
    }

    if (message.match(/(로그인|login)/i)) {
        tags.push("login")
    }

    if (message.match(/(메모리|memory)/i)) {
        tags.push("memory")
    }

    if (message.match(/(ui|화면|디자인)/i)) {
        tags.push("ui")
    }

    return Array.from(new Set(tags))
}

// expires_at 기본값
function defaultExpiresAt(
    type: MemoryType,
    scope: MemoryScope
): string | undefined {
    if (scope === "session" || type === "task_continuity") {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        return d.toISOString()
    }
    return undefined
}

// 기억 본문 정리
function buildContent(
    message: string,
    response: string,
    type: MemoryType
): string {
    if (
        type === "project_principle" ||
        type === "project_decision" ||
        type === "constraint"
    ) {
        return message.trim()
    }

    return `user: ${message.trim()}\nassistant: ${response.trim()}`
}

export async function saveMemory(
    userId: string,
    message: string,
    response: string,
    projectId?: string,
    scope?: MemoryScope
): Promise<void> {
    if (!userId || !message.trim() || !response.trim()) return
    if (!shouldSave(message, response)) return

    try {
        const supabase = createClient()

        const type = detectType(message)
        const resolvedScope = scope ?? detectScope(message, projectId)
        const source = detectSource(message)
        const importance = calcImportance(message, type)
        const confidence = calcConfidence(source)
        const key = buildMemoryKey(type, resolvedScope, projectId)
        const tags = buildTags(message, type, resolvedScope, projectId)
        const expiresAt = defaultExpiresAt(type, resolvedScope)
        const content = buildContent(message, response, type)

        if (key) {
            await supabase
                .from("memories")
                .update({
                    status: "superseded",
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId)
                .eq("key", key)
                .eq("status", "active")
        }

        const { error } = await supabase.from("memories").insert({
            user_id: userId,
            project_id: projectId ?? null,
            content,
            type,
            scope: resolvedScope,
            status: "active",
            source,
            key,
            version: 1,
            importance,
            confidence,
            tags,
            expires_at: expiresAt,
        })

        if (error) {
            console.error("[saveMemory] 저장 오류:", error.message)
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[saveMemory] 오류:", error.message)
        } else {
            console.error("[saveMemory] 알 수 없는 오류")
        }
    }
}