// 공통 타입 re-export
export type { AIProvider, AIMode, AITask, PromptInput, ChatMessage } from "./types"
export { ACTIVE_PROVIDER, TASK_PROVIDER_MAP } from "./config"

import type { AIProvider, AIMode, AITask, PromptInput, ChatMessage } from "./types"
import { TASK_PROVIDER_MAP } from "./config"
import { callGrok } from "./providers/grok"
import { callOpenAI, callOpenAICompatible } from "./providers/openai"
import { callClaude } from "./providers/claude"
import { parseGrokResponse } from "./parsers/grok"
import { parseOpenAIResponse } from "./parsers/openai"
import { parseClaudeResponse } from "./parsers/claude"

/**
 * AI 호출 중앙 진입점.
 * provider 선택 → 호출 → 파싱 → plain text 반환.
 * provider 추가 시: providers/ + parsers/ 파일 추가 후 아래 switch만 확장.
 */
export async function callAI(
    prompt: PromptInput,
    mode: AIMode = "fast",
    task: AITask = "text",
    provider?: AIProvider,
    history: ChatMessage[] = []
): Promise<string> {
    const resolvedProvider = provider ?? TASK_PROVIDER_MAP[task]

    try {
        switch (resolvedProvider) {
            case "grok": {
                const res = await callGrok(prompt, mode, history)
                return parseGrokResponse(res)
            }
            case "openai": {
                const res = await callOpenAI(prompt, mode, history)
                return parseOpenAIResponse(res)
            }
            case "claude": {
                const msg = await callClaude(prompt, mode, history)
                return parseClaudeResponse(msg)
            }
            // OpenAI 호환 나머지 provider (deepseek, groq, mistral, google, microsoft)
            default: {
                const res = await callOpenAICompatible(resolvedProvider, prompt, mode, history)
                return parseOpenAIResponse(res)
            }
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "알 수 없는 오류"
        console.error(`[callAI] 오류 (${resolvedProvider}/${mode}):`, msg)
        return "응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }
}
