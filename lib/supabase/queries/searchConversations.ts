import { createClient } from "../client"

export type StorageType = "project" | "recent" | "archive"

export interface SearchResult {
    conversation_id: string
    title: string
    snippet: string
    storage_type: StorageType
    project_name: string | null
    last_message_at: string
}

interface MessageRow {
    conversation_id: string
    content: string
    created_at: string
}

export async function searchConversations(keyword: string): Promise<SearchResult[]> {
    // 최소 2글자
    if (keyword.trim().length < 2) return []

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // ① title 검색
    const { data: byTitle } = await supabase
        .from("conversations")
        .select("id, title, updated_at, storage_type, project_id")
        .eq("user_id", user.id)
        .ilike("title", `%${keyword}%`)
        .order("updated_at", { ascending: false })
        .limit(20)

    // ② messages.content 검색
    const { data: byMessage } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .ilike("content", `%${keyword}%`)
        .order("created_at", { ascending: false })
        .limit(40)

    const messages: MessageRow[] = byMessage ?? []

    // ③ message conversation_id로 대화 조회
    const msgConvIds = Array.from(
        new Set(messages.map((m) => m.conversation_id).filter(Boolean))
    )

    let byMessageConvs: {
        id: string
        title: string
        updated_at: string
        storage_type: string | null
        project_id: string | null
    }[] = []

    if (msgConvIds.length > 0) {
        const { data } = await supabase
            .from("conversations")
            .select("id, title, updated_at, storage_type, project_id")
            .eq("user_id", user.id)
            .in("id", msgConvIds)

        byMessageConvs = data ?? []
    }

    // ④ 병합 (중복 제거)
    const seen = new Set<string>()
    const merged: {
        id: string
        title: string
        updated_at: string
        storage_type: string | null
        project_id: string | null
        snippet: string
    }[] = []

    for (const c of [...(byTitle ?? []), ...byMessageConvs]) {
        if (seen.has(c.id)) continue
        seen.add(c.id)

        const matchedMsg = messages.find((m: MessageRow) => m.conversation_id === c.id)
        let snippet = ""
        if (matchedMsg) {
            const idx = matchedMsg.content.toLowerCase().indexOf(keyword.toLowerCase())
            const start = Math.max(0, idx - 20)
            const end = Math.min(matchedMsg.content.length, idx + 60)
            snippet =
                (start > 0 ? "…" : "") +
                matchedMsg.content.slice(start, end) +
                (end < matchedMsg.content.length ? "…" : "")
        }

        merged.push({ ...c, snippet })
    }

    // ⑤ storage_type 분류
    const results: SearchResult[] = merged
        .slice(0, 20)
        .map((c) => {
            let storage_type: StorageType = "archive"
            if (c.storage_type === "project") {
                storage_type = "project"
            } else if (c.storage_type === "recent" || c.updated_at >= sevenDaysAgo) {
                storage_type = "recent"
            }
            return {
                conversation_id: c.id,
                title: c.title,
                snippet: c.snippet,
                storage_type,
                project_name: null,
                last_message_at: c.updated_at,
            }
        })
        .sort((a, b) =>
            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )

    return results
}