import type { AIMode, PromptInput, ChatMessage } from "../types"
import { MODEL_MAP, API_KEY_MAP, BASE_URL_MAP, MAX_TOKENS, TEMPERATURE } from "../config"

export async function callGrok(
    prompt: PromptInput,
    mode: AIMode,
    history: ChatMessage[] = []
): Promise<Response> {
    const apiKey = API_KEY_MAP.grok()
    if (!apiKey) throw new Error("XAI_API_KEY가 설정되지 않았습니다.")

    const endpoint = `${BASE_URL_MAP.grok}/chat/completions`

    return fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL_MAP.grok[mode],
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
