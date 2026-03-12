import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export type AIProvider =
    | "openai"
    | "deepseek"
    | "ollama"
    | "mistral"
    // 상용 AI 체험존
    | "anthropic"
    | "google"
    | "xai"
    | "microsoft"

export type AIMode = "fast" | "deep"

export type AITask =
    | "text"
    | "reasoning"
    | "image_gen"
    | "image_read"
    | "video_gen"
    | "video_read"

// 오픈소스 기본 라우팅
const TASK_PROVIDER_MAP: Record<AITask, AIProvider> = {
    text: "ollama",
    reasoning: "deepseek",
    image_gen: "ollama",
    image_read: "ollama",
    video_gen: "ollama",
    video_read: "ollama",
}

const MODEL_MAP: Record<AIProvider, Record<AIMode, string>> = {
    // 오픈소스
    openai: { fast: "gpt-4o-mini", deep: "gpt-4o" },
    deepseek: { fast: "deepseek-chat", deep: "deepseek-reasoner" },
    ollama: { fast: "llama3", deep: "llama3:70b" },
    mistral: { fast: "mistral-small-latest", deep: "mistral-large-latest" },
    // 상용 체험존
    anthropic: { fast: "claude-haiku-4-5-20251001", deep: "claude-sonnet-4-6" },
    google: { fast: "gemini-1.5-flash", deep: "gemini-1.5-pro" },
    xai: { fast: "grok-3-mini", deep: "grok-3" },
    microsoft: { fast: "o1-mini", deep: "o1" },
}

const BASE_URL_MAP: Record<AIProvider, string> = {
    openai: "https://api.openai.com/v1",
    deepseek: "https://api.deepseek.com/v1",
    ollama: "http://localhost:11434/v1",
    mistral: "https://api.mistral.ai/v1",
    anthropic: "https://api.anthropic.com",
    google: "https://generativelanguage.googleapis.com/v1beta",
    xai: "https://api.x.ai/v1",
    microsoft: "https://api.openai.com/v1",
}

const API_KEY_MAP: Record<AIProvider, string> = {
    openai: process.env.OPENAI_API_KEY ?? "",
    deepseek: process.env.DEEPSEEK_API_KEY ?? "",
    ollama: "ollama",
    mistral: process.env.MISTRAL_API_KEY ?? "",
    anthropic: process.env.ANTHROPIC_API_KEY ?? "",
    google: process.env.GOOGLE_API_KEY ?? "",
    xai: process.env.XAI_API_KEY ?? "",
    microsoft: process.env.OPENAI_API_KEY ?? "",
}

// 오픈소스 AI 호출 (OpenAI SDK 호환)
async function callOpenAICompatible(
    prompt: string,
    provider: AIProvider,
    mode: AIMode
): Promise<string> {
    const client = new OpenAI({
        apiKey: API_KEY_MAP[provider],
        baseURL: BASE_URL_MAP[provider],
    })
    const response = await client.chat.completions.create({
        model: MODEL_MAP[provider][mode],
        messages: [{ role: "system", content: prompt }],
        temperature: mode === "deep" ? 0.7 : 0.3,
        max_tokens: mode === "deep" ? 2000 : 800,
    })
    return response.choices[0].message.content ?? ""
}

// Anthropic 전용 호출
async function callAnthropic(
    prompt: string,
    mode: AIMode
): Promise<string> {
    const client = new Anthropic({ apiKey: API_KEY_MAP.anthropic })
    const response = await client.messages.create({
        model: MODEL_MAP.anthropic[mode],
        max_tokens: mode === "deep" ? 2000 : 800,
        messages: [{ role: "user", content: prompt }],
    })
    return response.content[0].type === "text"
        ? response.content[0].text
        : ""
}

// 메인 호출 함수
export async function callAI(
    prompt: string,
    mode: AIMode = "fast",
    task: AITask = "text",
    provider?: AIProvider  // playground에서 직접 지정 가능
): Promise<string> {

    const resolvedProvider = provider ?? TASK_PROVIDER_MAP[task]

    try {
        if (resolvedProvider === "anthropic") {
            return await callAnthropic(prompt, mode)
        }
        return await callOpenAICompatible(prompt, resolvedProvider, mode)

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[callAI] 오류 (${resolvedProvider}):`, error.message)
        }
        return "응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }
}