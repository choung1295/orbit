export type AIProvider =
    | "grok"
    | "openai"
    | "claude"
    | "deepseek"
    | "groq"
    | "mistral"
    | "google"
    | "microsoft"

export type AIMode = "fast" | "deep"

export type AITask =
    | "text"
    | "reasoning"
    | "image_gen"
    | "image_read"
    | "video_gen"
    | "video_read"

export interface PromptInput {
    system: string
    user: string
}

export interface ChatMessage {
    role: "user" | "assistant"
    content: string
}
