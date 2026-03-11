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