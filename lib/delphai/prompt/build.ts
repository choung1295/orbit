import { MemoryRecord } from "../memory/save-memory"
import { SYSTEM_PROMPT } from "./system-prompt"

export function buildPrompt(message: string, memories: MemoryRecord[]): string {
    const memoryText = memories.length > 0
        ? memories.map(m => `- ${m.content}`).join("\n")
        : "없음"

    return `${SYSTEM_PROMPT}

## 관련 기억
${memoryText}

## 사용자 메시지
${message}`
}