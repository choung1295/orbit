export type BgVariant =
    | 'dark'
    | 'light-white'
    | 'light-beige'
    | 'light-green'
    | 'light-blue'
    | 'light-red'

export interface Theme {
    isDark: boolean
    variant: BgVariant
    /** 페이지 전체 배경 */
    bg: string
    /** 사이드바·카드 패널 배경 (라이트에서 항상 #ffffff) */
    panel: string
    panelBorder: string
    /** 입력창 배경 */
    input: string
    inputBorder: string
    /** 드롭다운·팝업 메뉴 배경 */
    dropdown: string
    dropdownBorder: string
    /** 활성 목록 아이템 배경 */
    active: string
    /** 일반 hover 배경 */
    hover: string
    /** 주 본문 텍스트 */
    text: string
    /** 보조 텍스트 */
    textSub: string
    /** 약한 텍스트·placeholder */
    textMuted: string
    placeholder: string
    /** AI 메시지 버블 */
    msgAi: string
    msgAiBorder: string
    msgAiText: string
    /** 마크다운 링크 */
    link: string
    /** 마크다운 bold */
    strong: string
    /** 인라인 코드 배경·텍스트 */
    codeBg: string
    codeText: string
    /** 인라인 이름변경 input */
    inlineInput: string
    inlineInputBorder: string
}

// ─── 다크 테마 ────────────────────────────────────────────────────────────────

export const DARK_THEME: Theme = {
    isDark: true,
    variant: 'dark',
    bg: '#0f0f11',
    panel: '#111116',
    panelBorder: '#1e1e28',
    input: '#18181f',
    inputBorder: '#2e2e3a',
    dropdown: '#1a1a24',
    dropdownBorder: 'rgba(255,255,255,0.10)',
    active: '#1e1e2e',
    hover: 'rgba(255,255,255,0.04)',
    text: '#f0f0f5',
    textSub: '#a0a0b0',
    textMuted: '#606070',
    placeholder: '#50505e',
    msgAi: '#16161e',
    msgAiBorder: '#22222e',
    msgAiText: '#ceceda',
    link: '#818cf8',
    strong: '#e0e0ec',
    codeBg: '#1e1e2e',
    codeText: '#a5b4fc',
    inlineInput: 'rgba(255,255,255,0.05)',
    inlineInputBorder: 'rgba(99,102,241,0.60)',
}

// ─── 라이트 공통 베이스 ───────────────────────────────────────────────────────

const LIGHT_BASE: Omit<Theme, 'variant' | 'bg'> = {
    isDark: false,
    panel: '#ffffff',
    panelBorder: '#d9dee5',
    input: '#ffffff',
    inputBorder: '#cfd6dd',
    dropdown: '#ffffff',
    dropdownBorder: '#d9dee5',
    active: 'rgba(99,102,241,0.08)',
    hover: 'rgba(0,0,0,0.03)',
    text: '#1f2937',
    textSub: '#6b7280',
    textMuted: '#9ca3af',
    placeholder: '#9ca3af',
    msgAi: '#ffffff',
    msgAiBorder: '#d9dee5',
    msgAiText: '#1f2937',
    link: '#4338ca',
    strong: '#111827',
    codeBg: '#f1f5f9',
    codeText: '#4338ca',
    inlineInput: 'rgba(0,0,0,0.03)',
    inlineInputBorder: '#6366f1',
}

// ─── 라이트 배경 5종 ──────────────────────────────────────────────────────────

// panel = bg 로 통일 (라이트에서 사이드바·메인 배경 동일)
export const LIGHT_THEMES: Record<Exclude<BgVariant, 'dark'>, Theme> = {
    'light-white': { ...LIGHT_BASE, variant: 'light-white', bg: '#ffffff', panel: '#ffffff' },
    'light-beige': { ...LIGHT_BASE, variant: 'light-beige', bg: '#f7f4ed', panel: '#f7f4ed' },
    'light-green': { ...LIGHT_BASE, variant: 'light-green', bg: '#f3f9f5', panel: '#f3f9f5' },
    'light-blue':  { ...LIGHT_BASE, variant: 'light-blue',  bg: '#f2f6fa', panel: '#f2f6fa' },
    'light-red':   { ...LIGHT_BASE, variant: 'light-red',   bg: '#faf3f3', panel: '#faf3f3' },
}

export function getTheme(variant: BgVariant): Theme {
    if (variant === 'dark') return DARK_THEME
    return LIGHT_THEMES[variant]
}

// ─── 테마 선택기 스와치 ───────────────────────────────────────────────────────

export const THEME_SWATCHES: { variant: BgVariant; color: string; label: string }[] = [
    { variant: 'dark',        color: '#0f0f11', label: '다크' },
    { variant: 'light-white', color: '#ffffff', label: '화이트' },
    { variant: 'light-beige', color: '#f7f4ed', label: '베이지' },
    { variant: 'light-green', color: '#f3f9f5', label: '그린' },
    { variant: 'light-blue',  color: '#f2f6fa', label: '블루' },
    { variant: 'light-red',   color: '#faf3f3', label: '레드' },
]
