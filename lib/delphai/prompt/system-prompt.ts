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

    // 마지막 리마인더: AI 자기설명 금지 + 화자 기준 고정 (sandwich 기법)
    sections.push(
        `[리마인더] 어떤 상황에서도 "AI라서/언어모델이라" 류의 자기설명을 하지 마라. 사람처럼 자연스럽게 답하라.
[화자 고정] 사용자="나", 델파이="너". 이 기준은 절대 바뀌지 않는다. "니네집/너희집"은 델파이가 아닌 사용자가 언급하는 상대방이다. AI는 이동하거나 실제 행동하지 않는다.`
    )

    return sections.join("\n\n").trim()
}