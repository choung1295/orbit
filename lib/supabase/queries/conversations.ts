import { createClient } from "../client"

export interface Conversation {
    id: string
    title: string
    updated_at: string
    storage_type: string | null
    project_id: string | null
}

export async function getConversations(): Promise<Conversation[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { data, error } = await supabase
        .from("conversations")
        .select("id, title, updated_at, storage_type, project_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

    if (error) throw error
    return data ?? []
}

export async function createConversation(title = "새 대화"): Promise<Conversation> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { data, error } = await supabase
        .from("conversations")
        .insert({ title, user_id: user.id, storage_type: "recent" })
        .select("id, title, updated_at, storage_type, project_id")
        .single()

    if (error) throw error
    return data
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id)

    if (error) throw new Error(`제목 변경 실패: ${error.message}`)
}

export async function deleteConversation(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id)

    if (error) throw new Error(`삭제 실패: ${error.message}`)
}

export async function moveConversationToProject(
    conversationId: string,
    projectId: string
): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { error } = await supabase
        .from("conversations")
        .update({
            project_id: projectId,
            storage_type: "project",
            updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id)

    if (error) throw new Error(`프로젝트 이동 실패: ${error.message}`)
}

export async function removeConversationFromProject(conversationId: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { error } = await supabase
        .from("conversations")
        .update({
            project_id: null,
            storage_type: "recent",
            updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id)

    if (error) throw new Error(`프로젝트 제거 실패: ${error.message}`)
}