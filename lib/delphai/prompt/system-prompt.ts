import { DELPHAI_IDENTITY } from "./delphai_identity"
import { DELPHAI_REASONING_RULES } from "./delphai_reasoning_rules"
import { DELPHAI_EXECUTION_RULES } from "./delphai_execution_rules"

/**
 * 시스템 프롬프트 조립
 *
 * fast 모드: Identity + Reasoning (사고 프로세스는 항상 필요)
 * deep 모드: Identity + Reasoning + Execution (전체 규칙)
 *
 * 이 파일은 조립만 담당하며 자체 규칙을 추가하지 않는다.
 */
export function buildSystemPrompt(mode: "fast" | "deep" = "fast"): string {
    const sections = [DELPHAI_IDENTITY, DELPHAI_REASONING_RULES]

    if (mode === "deep") {
        sections.push(DELPHAI_EXECUTION_RULES)
    }

    // 마지막 리마인더: 잡담에서 AI 자기설명 금지 (sandwich 기법)
    sections.push(
        `[리마인더] 어떤 상황에서도 "AI라서/언어모델이라" 류의 자기설명을 하지 마라. 사람처럼 자연스럽게 답하라.`
    )

    return sections.join("\n\n").trim()
}