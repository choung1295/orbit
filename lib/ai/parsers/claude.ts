import type Anthropic from "@anthropic-ai/sdk"

const FALLBACK = "응답을 가져올 수 없습니다."

export function parseClaudeResponse(message: Anthropic.Message): string {
    const block = message.content?.[0]
    if (!block || block.type !== "text") return FALLBACK

    // <thinking>...</thinking> 태그 제거
    return block.text.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim() || FALLBACK
}
