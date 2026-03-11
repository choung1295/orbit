import { createClient } from "../client"

export async function getMessages(conversationId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

    if (error) throw error
    return data
}

export async function saveMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string
) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, user_id: user.id, role, content })
        .select()
        .single()

    if (error) throw error
    return data
}