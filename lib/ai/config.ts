import type { AIProvider, AIMode, AITask } from "./types"

// 현재 활성 provider — AI_PROVIDER 환경변수로 교체 가능
export const ACTIVE_PROVIDER: AIProvider =
    (process.env.AI_PROVIDER as AIProvider | undefined) ?? "grok"

// provider별 모드에 따른 모델명
export const MODEL_MAP: Record<AIProvider, Record<AIMode, string>> = {
    grok:      { fast: "grok-4-1-fast-non-reasoning",  deep: "grok-4-1-fast-reasoning" },
    openai:    { fast: "gpt-4o-mini",                  deep: "gpt-4o" },
    claude:    { fast: "claude-haiku-4-5-20251001",    deep: "claude-sonnet-4-6" },
    deepseek:  { fast: "deepseek-chat",                deep: "deepseek-reasoner" },
    groq:      { fast: "llama-3.1-8b-instant",         deep: "llama-3.3-70b-versatile" },
    mistral:   { fast: "mistral-small-latest",         deep: "mistral-large-latest" },
    google:    { fast: "gemini-1.5-flash",             deep: "gemini-1.5-pro" },
    microsoft: { fast: "o1-mini",                      deep: "o1" },
}

// OpenAI 호환 provider의 API endpoint
export const BASE_URL_MAP: Partial<Record<AIProvider, string>> = {
    grok:      "https://api.x.ai/v1",
    openai:    "https://api.openai.com/v1",
    deepseek:  "https://api.deepseek.com/v1",
    groq:      "https://api.groq.com/openai/v1",
    mistral:   "https://api.mistral.ai/v1",
    google:    "https://generativelanguage.googleapis.com/v1beta",
    microsoft: "https://api.openai.com/v1",
}

// provider별 API 키 (env에서 읽음)
export const API_KEY_MAP: Record<AIProvider, () => string> = {
    grok:      () => process.env.XAI_API_KEY       ?? "",
    openai:    () => process.env.OPENAI_API_KEY    ?? "",
    claude:    () => process.env.ANTHROPIC_API_KEY ?? "",
    deepseek:  () => process.env.DEEPSEEK_API_KEY  ?? "",
    groq:      () => process.env.GROQ_API_KEY      ?? "",
    mistral:   () => process.env.MISTRAL_API_KEY   ?? "",
    google:    () => process.env.GOOGLE_API_KEY    ?? "",
    microsoft: () => process.env.OPENAI_API_KEY    ?? "",
}

// task 유형에 따른 기본 provider
export const TASK_PROVIDER_MAP: Record<AITask, AIProvider> = {
    text:       ACTIVE_PROVIDER,
    reasoning:  ACTIVE_PROVIDER,
    image_gen:  "openai",
    image_read: "openai",
    video_gen:  "openai",
    video_read: "openai",
}

// 응답 설정
export const MAX_TOKENS: Record<AIMode, number> = {
    fast: 800,
    deep: 2000,
}

export const TEMPERATURE: Record<AIMode, number> = {
    fast: 0.3,
    deep: 0.7,
}