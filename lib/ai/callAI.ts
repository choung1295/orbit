import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export type AIProvider =
    | "openai"
    | "deepseek"
    | "groq"
    | "mistral"
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

const TASK_PROVIDER_MAP: Record<AITask, AIProvider> = {
    text: "openai",
    reasoning: "openai",
    image_gen: "openai",
    image_read: "openai",
    video_gen: "openai",
    video_read: "openai",
}

const MODEL_MAP: Record<AIProvider, Record<AIMode, string>> = {
    openai: { fast: "gpt-4o-mini", deep: "gpt-4o" },
    deepseek: { fast: "deepseek-chat", deep: "deepseek-reasoner" },
    groq: { fast: "llama-3.1-8b-instant", deep: "llama-3.3-70b-versatile" },
    mistral: { fast: "mistral-small-latest", deep: "mistral-large-latest" },
    anthropic: { fast: "claude-haiku-4-5-20251001", deep: "claude-sonnet-4-6" },
    google: { fast: "gemini-1.5-flash", deep: "gemini-1.5-pro" },
    xai: { fast: "grok-3-mini", deep: "grok-3" },
    microsoft: { fast: "o1-mini", deep: "o1" },
}

const BASE_URL_MAP: Record<AIProvider, string> = {
    openai: "https://api.openai.com/v1",
    deepseek: "https://api.deepseek.com/v1",
    groq: "https://api.groq.com/openai/v1",
    mistral: "https://api.mistral.ai/v1",
    anthropic: "https://api.anthropic.com",
    google: "https://generativelanguage.googleapis.com/v1beta",
    xai: "https://api.x.ai/v1",
    microsoft: "https://api.openai.com/v1",
}

const API_KEY_MAP: Record<AIProvider, string> = {
    openai: process.env.OPENAI_API_KEY ?? "",
    deepseek: process.env.DEEPSEEK_API_KEY ?? "",
    groq: process.env.GROQ_API_KEY ?? "",
    mistral: process.env.MISTRAL_API_KEY ?? "",
    anthropic: process.env.ANTHROPIC_API_KEY ?? "",
    google: process.env.GOOGLE_API_KEY ?? "",
    xai: process.env.XAI_API_KEY ?? "",
    microsoft: process.env.OPENAI_API_KEY ?? "",
}

async function callOpenAICompatible(
    system: string,
    user: string,
    provider: AIProvider,
    mode: AIMode,
    history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
    const client = new OpenAI({
        apiKey: API_KEY_MAP[provider],
        baseURL: BASE_URL_MAP[provider],
    })

    const response = await client.chat.completions.create({
        model: MODEL_MAP[provider][mode],
        messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: user },
        ],
        temperature: mode === "deep" ? 0.7 : 0.3,
        max_tokens: mode === "deep" ? 2000 : 800,
    })
    return response.choices[0].message.content ?? ""
}

async function callAnthropic(
    system: string,
    user: string,
    mode: AIMode,
    history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
    const client = new Anthropic({ apiKey: API_KEY_MAP.anthropic })

    const response = await client.messages.create({
        model: MODEL_MAP.anthropic[mode],
        max_tokens: mode === "deep" ? 2000 : 800,
        system: system,
        messages: [
            ...history,
            { role: "user", content: user },
        ],
    })
    return response.content[0].type === "text"
        ? response.content[0].text
        : ""
}

export interface PromptInput {
    system: string
    user: string
}

export async function callAI(
    prompt: PromptInput,
    mode: AIMode = "fast",
    task: AITask = "text",
    provider?: AIProvider,
    history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {

    const resolvedProvider = provider ?? TASK_PROVIDER_MAP[task]

    try {
        if (resolvedProvider === "anthropic") {
            return await callAnthropic(prompt.system, prompt.user, mode, history)
        }
        return await callOpenAICompatible(prompt.system, prompt.user, resolvedProvider, mode, history)

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[callAI] 오류 (${resolvedProvider}):`, error.message)
        }
        return "응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }
}