import { createClient } from "../client"

export interface Project {
    id: string
    name: string
    user_id: string
    created_at: string
    updated_at: string
}

export async function getProjects(): Promise<Project[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    if (error) {
        console.warn("projects 조회 실패:", error.message)
        return []
    }
    return data ?? []
}

export async function createProject(name: string): Promise<Project | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const { data, error } = await supabase
        .from("projects")
        .insert({ name: name.trim(), user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteProject(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)

    if (error) throw error
}