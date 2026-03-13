import { createClient } from "../client"

export async function getConversations() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { data, error } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

    if (error) throw error
    return data
}

export async function createConversation(title: string = "새 대화") {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { data, error } = await supabase
        .from("conversations")
        .insert({ title, user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateConversationTitle(id: string, title: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id)

    if (error) throw error
}

export async function deleteConversation(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id)

    if (error) throw error
}

// ─── 프로젝트 관련 (확장 지점) ───────────────────────────────────────────────

export async function getProjects() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    // projects 테이블이 생기면 여기서 fetch
    // 지금은 빈 배열 반환 (UI 구조만 준비)
    const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    if (error) {
        // projects 테이블 없으면 조용히 빈 배열
        console.warn("projects 테이블 없음 — 나중에 생성하세요:", error.message)
        return []
    }
    return data ?? []
}

export async function moveConversationToProject(
    conversationId: string,
    projectId: string | null
) {
    const supabase = createClient()
    const { error } = await supabase
        .from("conversations")
        .update({ project_id: projectId, updated_at: new Date().toISOString() })
        .eq("id", conversationId)

    if (error) throw error
}