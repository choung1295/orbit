import { createClient } from "@/lib/supabase/client"
import { MemoryRecord, MemoryScope } from "./memory-types"

export async function recallMemory(
    userId: string,
    message: string,
    projectId?: string,
    scope?: MemoryScope,
): Promise<MemoryRecord[]> {

    if (!userId || !message) return []

    try {
        const supabase = createClient()

        let query = supabase
            .from("memories")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(10)

        // 프로젝트 필터
        if (projectId) {
            query = query.eq("project_id", projectId)
        }

        // 스코프 필터
        if (scope) {
            query = query.eq("scope", scope)
        }

        const { data, error } = await query

        if (error) {
            console.error("[recallMemory] 오류:", error.message)
            return []
        }

        if (!data || data.length === 0) return []

        // 메시지와 관련성 높은 기억만 필터링
        const relevant = (data as MemoryRecord[]).filter(m =>
            isRelevant(m.content, message)
        )

        return relevant

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[recallMemory] 오류:", error.message)
        }
        return []
    }
}

// 단순 키워드 관련성 판단
function isRelevant(content: string, message: string): boolean {
    const messageWords = message
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 1)

    return messageWords.some(word =>
        content.toLowerCase().includes(word)
    )
}