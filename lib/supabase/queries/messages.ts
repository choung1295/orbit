import { createClient } from "../client";

// 특정 대화의 메시지 가져오기
export async function getMessages(conversationId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
}

// 메시지 저장
export async function saveMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string
) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, role, content })
        .select()
        .single();

    if (error) throw error;
    return data;
}