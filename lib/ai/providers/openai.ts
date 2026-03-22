import type { AIMode, PromptInput, ChatMessage } from "../types"
import { MODEL_MAP, API_KEY_MAP, BASE_URL_MAP, MAX_TOKENS, TEMPERATURE } from "../config"

export async function callOpenAI(
    prompt: PromptInput,
    mode: AIMode,
    history: ChatMessage[] = []
): Promise<Response> {
    const apiKey = API_KEY_MAP.openai()
    if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.")

    const endpoint = `${BASE_URL_MAP.openai}/chat/completions`

    return fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL_MAP.openai[mode],
            messages: [
                { role: "system", content: prompt.system },
                ...history,
                { role: "user", content: prompt.user },
            ],
            temperature: TEMPERATURE[mode],
            max_tokens: MAX_TOKENS[mode],
        }),
    })
}

// groq, deepseek, mistral, microsoft 등 OpenAI 호환 provider 범용 호출
import type { AIProvider } from "../types"

export async function callOpenAICompatible(
    provider: AIProvider,
    prompt: PromptInput,
    mode: AIMode,
    history: ChatMessage[] = []
): Promise<Response> {
    const apiKey = API_KEY_MAP[provider]()
    if (!apiKey) throw new Error(`${provider.toUpperCase()}_API_KEY가 설정되지 않았습니다.`)

    const baseUrl = BASE_URL_MAP[provider]
    if (!baseUrl) throw new Error(`${provider}의 API endpoint가 설정되지 않았습니다.`)

    return fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL_MAP[provider][mode],
            messages: [
                { role: "system", content: prompt.system },
                ...history,
                { role: "user", content: prompt.user },
            ],
            temperature: TEMPERATURE[mode],
            max_tokens: MAX_TOKENS[mode],
        }),
    })
}
