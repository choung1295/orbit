import { createClient } from "@/lib/supabase/server"
import { MemoryRecord, MemoryScope, SCOPE_PRIORITY } from "./memory-types"

export async function recallMemory(
    userId: string,
    message: string,
    projectId?: string,
    scope?: MemoryScope,
): Promise<MemoryRecord[]> {
    if (!userId || !message.trim()) return []

    try {
        const supabase = await createClient()
        const nowIso = new Date().toISOString()

        const sessionQuery = supabase
            .from("memories")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .eq("scope", "session")
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
            .order("updated_at", { ascending: false })
            .limit(8)

        const projectQuery = projectId
            ? supabase
                .from("memories")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "active")
                .eq("scope", "project")
                .eq("project_id", projectId)
                .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
                .order("importance", { ascending: false })
                .limit(8)
            : Promise.resolve({ data: [], error: null })

        const userQuery = supabase
            .from("memories")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .eq("scope", "user")
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
            .order("importance", { ascending: false })
            .limit(8)

        const summaryQuery = supabase
            .from("memories")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .eq("scope", "summary")
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
            .order("updated_at", { ascending: false })
            .limit(5)

        const [session, project, user, summary] = await Promise.all([
            sessionQuery,
            projectQuery,
            userQuery,
            summaryQuery,
        ])

        const errors = [session.error, project.error, user.error, summary.error].filter(Boolean)
        if (errors.length > 0) {
            console.error("[recallMemory] 조회 오류:", errors)
            return []
        }

        let all = [
            ...(session.data ?? []),
            ...(project.data ?? []),
            ...(user.data ?? []),
            ...(summary.data ?? []),
        ] as MemoryRecord[]

        if (scope) {
            all = all.filter((m) => m.scope === scope)
        }

        if (all.length === 0) return []

        // user/project scope 기억은 항상 포함 (명시적으로 저장된 중요 기억)
        // session/summary scope는 keyword 관련성 필터 적용
        const relevant = all
            .filter((m) => {
                if (m.scope === "user" || m.scope === "project") return true
                return isRelevant(m.content, message, m.tags)
            })
            .sort((a, b) => calculateRecallScore(b) - calculateRecallScore(a))
            .slice(0, 10)

        // last_used_at 업데이트 (비동기, 실패해도 무관)
        if (relevant.length > 0) {
            const ids = relevant.map((m) => m.id)
            void supabase
                .from("memories")
                .update({ last_used_at: new Date().toISOString() })
                .in("id", ids)
        }
        return relevant
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[recallMemory] 오류:", error.message)
        } else {
            console.error("[recallMemory] 알 수 없는 오류")
        }
        return []
    }
}

function calculateRecallScore(memory: MemoryRecord): number {
    const scopeScore = (SCOPE_PRIORITY[memory.scope] ?? 0) * 10
    const importanceScore = (memory.importance ?? 0.5) * 10
    const confidenceScore = (memory.confidence ?? 0.5) * 10

    let recencyScore = 0
    if (memory.last_used_at) {
        const diffMs = Date.now() - new Date(memory.last_used_at).getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        recencyScore = Math.max(0, 10 - diffDays * 0.5)
    }

    return scopeScore + importanceScore + confidenceScore + recencyScore
}

function isRelevant(content: string, message: string, tags?: string[]): boolean {
    const normalizedContent = content.toLowerCase()
    const normalizedMessage = message.toLowerCase()
    const normalizedTags = (tags ?? []).map((tag) => tag.toLowerCase())

    // 조사 제거 및 분리
    const words = normalizedMessage
        .replace(/[?.,!]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2)

    if (words.length === 0) return true

    // 키워드 가중치 기반 매칭 (메시지에 포함된 단어가 내용이나 태그에 얼마나 있는지)
    const matches = words.filter((w) => 
        normalizedContent.includes(w) || 
        normalizedTags.some(tag => tag.includes(w))
    )

    // 하나라도 매칭되면 관련 있는 것으로 간주하되, 
    // "기억해", "알려줘" 같은 기능적 단어만 매칭되는 경우를 방지하기 위해 
    // 실제 의미 있는 명사 중심의 매칭이 유리함 (현재는 단순 포함 여부)
    return matches.length >= 1
}