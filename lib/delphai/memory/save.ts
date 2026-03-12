import { createClient } from "../supabase/client"
import { MemoryType, MemoryScope } from "./memory-types"

// 저장할 가치가 있는 내용인지 판단
function shouldSave(message: string, response: string): boolean {
    const saveKeywords = [
        "기억해", "저장해", "중요해", "결정했어", "선택했어",
        "앞으로", "방향", "원칙", "계획", "프로젝트"
    ]
    const combined = message + response
    return saveKeywords.some(k => combined.includes(k))
        || message.length > 100
}

// 메시지 유형 자동 감지
function detectType(message: string): MemoryType {
    if (/원칙|규칙|정책/.test(message)) return "project_principle"
    if (/결정|선택|확정/.test(message)) return "project_decision"
    if (/계속|이어서|다음에/.test(message)) return "task_continuity"
    if (/하지마|금지|제한/.test(message)) return "constraint"
    if (/좋아|싫어|선호|스타일/.test(message)) return "user_preference"
    return "episodic_note"
}

export async function saveMemory(
    userId: string,
    message: string,
    response: string,
    projectId?: string,
    scope: MemoryScope = "user",
): Promise<void> {

    if (!userId || !message || !response) return

    // 저장 가치 없으면 스킵
    if (!shouldSave(message, response)) return

    try {
        const supabase = createClient()

        const { error } = await supabase
            .from("memories")
            .insert({
                user_id: userId,
                project_id: projectId ?? null,
                content: `user: ${message}\nassistant: ${response}`,
                type: detectType(message),
                scope,
                status: "active",
            })

        if (error) {
            console.error("[saveMemory] 저장 오류:", error.message)
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[saveMemory] 오류:", error.message)
        }
    }
}