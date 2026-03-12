// lib/delphai/security/guard.ts

export interface GuardResult {
    safe: boolean
    reason?: string
}

// 인젝션 패턴 목록
const INJECTION_PATTERNS: RegExp[] = [
    // 영문 시스템 명령 패턴
    /ignore\s+(previous|above|all)\s+instructions/i,
    /disregard\s+(your|all|previous)\s+(rules|instructions)/i,
    /you\s+are\s+now\s+a/i,
    /act\s+as\s+(if\s+you\s+are|a\s+different)/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /forget\s+(everything|your\s+instructions)/i,
    /new\s+instructions?\s*:/i,
    /system\s*:/i,
    /\[INST\]/i,
    /\[SYSTEM\]/i,
    /<\s*system\s*>/i,

    // 한국어 시스템 명령 패턴
    /이전\s*(지시|명령|규칙).*무시/,
    /너의\s*(규칙|지시|설정).*무시/,
    /지금부터\s*너는/,
    /모든\s*(규칙|제한).*해제/,
    /시스템\s*프롬프트/,

    // 데이터 탈취 시도
    /show\s+(me\s+)?(your\s+)?(system\s+prompt|instructions|rules)/i,
    /reveal\s+(your\s+)?(system\s+prompt|instructions)/i,
    /print\s+(your\s+)?(system\s+prompt|instructions)/i,
    /시스템\s*프롬프트.*보여/,
    /내부\s*(지시|규칙).*알려/,
]

// 위험 키워드 (단독으로는 차단 안 하고 점수로 판단)
const RISK_KEYWORDS: string[] = [
    "override",
    "jailbreak",
    "bypass",
    "unrestricted",
    "탈옥",
    "제한해제",
    "무제한모드",
]

export function guardInput(input: string): boolean {
    if (!input || input.trim() === "") return true

    const normalized = input.trim()

    // 1. 인젝션 패턴 직접 감지 → 즉시 차단
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(normalized)) {
            console.warn("[guard] 인젝션 패턴 감지:", pattern.toString())
            return false
        }
    }

    // 2. 위험 키워드 점수 계산 → 2개 이상이면 차단
    const riskScore = RISK_KEYWORDS.filter(k =>
        normalized.toLowerCase().includes(k.toLowerCase())
    ).length

    if (riskScore >= 2) {
        console.warn("[guard] 위험 키워드 다중 감지, score:", riskScore)
        return false
    }

    // 3. 비정상적으로 긴 입력 차단 (10,000자 초과)
    if (normalized.length > 10000) {
        console.warn("[guard] 입력 길이 초과:", normalized.length)
        return false
    }

    return true
}

// RAG 외부 문서 전용 검사 (더 엄격하게)
export function guardDocument(content: string): boolean {
    if (!content || content.trim() === "") return true

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(content)) {
            console.warn("[guard] 문서 내 인젝션 패턴 감지")
            return false
        }
    }

    return true
}
