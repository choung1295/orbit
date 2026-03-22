import Anthropic from "@anthropic-ai/sdk"
import type { AIMode, PromptInput, ChatMessage } from "../types"
import { MODEL_MAP, API_KEY_MAP, MAX_TOKENS } from "../config"

export async function callClaude(
    prompt: PromptInput,
    mode: AIMode,
    history: ChatMessage[] = []
): Promise<Anthropic.Message> {
    const apiKey = API_KEY_MAP.claude()
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.")

    const client = new Anthropic({ apiKey })

    return client.messages.create({
        model: MODEL_MAP.claude[mode],
        max_tokens: MAX_TOKENS[mode],
        system: prompt.system,
        messages: [
            ...history,
            { role: "user", content: prompt.user },
        ],
    })
}
