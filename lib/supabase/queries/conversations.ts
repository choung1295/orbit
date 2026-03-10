import { createClient } from "../client";

// 대화 목록 가져오기
export async function getConversations() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
}

// 새 대화 만들기
export async function createConversation(title: string = "새 대화") {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("conversations")
        .insert({ title })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// 대화 제목 수정
export async function updateConversationTitle(id: string, title: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;
}

// 대화 삭제
export async function deleteConversation(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

    if (error) throw error;
}