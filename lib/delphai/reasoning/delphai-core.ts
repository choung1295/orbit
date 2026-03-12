import { recallMemory } from "../memory/recall"
import { saveMemory } from "../memory/save"
import { buildPrompt } from "../prompt/build"
import { callAI, AIProvider, AITask } from "../../ai/callAI"
import { retrieveContext } from "../rag/retrieve-context"
import { guardInput } from "../security/guard"

export type UserPlan = "free" | "pro"
export type UserLevel = "beginner" | "default" | "expert"

export interface DelphaiInput {
    userId: string
    message: string
    plan?: UserPlan
    userLevel?: UserLevel
    projectId?: string
    isPlayground?: boolean
    provider?: AIProvider
}

export interface DelphaiOutput {
    response: string
    provider: string
    mode: string
    error?: string
}

// 크레딧 확인 (Supabase 연동 — 추후 구현)
async function checkCredits(): Promise<boolean> {
    return true
}

// 크레딧 차감 (Supabase 연동 — 추후 구현)
async function deductCredit(userId: string, provider: AIProvider): Promise<void> {
    console.log(`[credit] ${userId} / ${provider} 크레딧 차감`)
}

// 메시지 유형 자동 감지
function detectTask(message: string): AITask {
    if (/이미지|사진|그려|생성해/.test(message)) return "image_gen"
    if (/영상|비디오|동영상/.test(message)) return "video_gen"
    return "text"
}

// 추론 깊이 자동 감지
function detectMode(message: string): "fast" | "deep" {
    const deepKeywords = ["분석", "전략", "설계", "비교", "추론", "왜", "어떻게", "계획"]
    const isDeep = deepKeywords.some(k => message.includes(k))
    return isDeep || message.length > 200 ? "deep" : "fast"
}

export async function runDelphai(input: DelphaiInput): Promise<DelphaiOutput> {
    const {
        userId,
        message,
        plan = "free",
        userLevel = "default",
        projectId,
        isPlayground = false,
        provider,
    } = input

    // 1. 인젝션 차단
    const safe = guardInput(message)
    if (!safe) {
        return {
            response: "요청을 처리할 수 없습니다. 입력 내용을 확인해주세요.",
            provider: "none",
            mode: "none",
            error: "injection_detected",
        }
    }

    // 2. 체험존 크레딧 확인
    if (isPlayground) {
        const hasCredits = await checkCredits()
        if (!hasCredits) {
            return {
                response: "크레딧이 부족합니다. 충전 후 이용해주세요.",
                provider: provider ?? "none",
                mode: "none",
                error: "insufficient_credits",
            }
        }
    }

    // 3. 메모리 recall (pro만)
    const memories = plan === "pro"
        ? await recallMemory(userId, message, projectId).catch(() => [])
        : []

    // 4. RAG 컨텍스트 (pro만, 체험존 제외)
    const ragContext = plan === "pro" && !isPlayground
        ? await retrieveContext(message).catch(() => "")
        : ""

    // 5. 프롬프트 합성
    const prompt = buildPrompt({
        message,
        memories,
        ragContext,
        userLevel,
        plan,
    })

    // 6. 모델 라우팅
    const task = detectTask(message)
    const mode = detectMode(message)

    // 7. AI 호출
    let response = ""
    try {
        response = await callAI(prompt, mode, task, provider)
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "알 수 없는 오류"
        console.error("[runDelphai] callAI 오류:", msg)
        return {
            response: "응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            provider: provider ?? "auto",
            mode,
            error: msg,
        }
    }

    // 8. 메모리 저장 (pro만, 체험존 제외)
    if (plan === "pro" && !isPlayground) {
        await saveMemory(userId, message, response, projectId).catch(err => {
            console.error("[runDelphai] saveMemory 오류:", err)
        })
    }

    // 9. 체험존 크레딧 차감
    if (isPlayground && provider) {
        await deductCredit(userId, provider).catch(err => {
            console.error("[runDelphai] deductCredit 오류:", err)
        })
    }

    return {
        response,
        provider: provider ?? "auto",
        mode,
    }
}