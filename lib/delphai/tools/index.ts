/**
 * lib/tools/index.ts
 * 메시지 의도 파악 → 필요한 tool 병렬 호출 → 결과 합산 반환
 */

import { searchWeb } from "./search"
import { getWeather } from "./weather"
import { getRealEstate } from "./realestate"
import { getTrafficHotspots } from "./traffic"
import { getWeatherMap } from "./weather-map"

interface ToolContext {
    message: string
    location?: string
}

export async function runTools(ctx: ToolContext): Promise<string> {
    const { message, location = "평택" } = ctx
    const tasks: Promise<string>[] = []

    // 날씨 지도 감지
    if (/날씨\s*지도|전국\s*날씨|기상\s*지도/.test(message)) {
        tasks.push(getWeatherMap())
    } else if (/날씨|기온|비|눈|맑|흐|바람|우산/.test(message)) {
        // 일반 날씨 감지 (지도가 아닐 때만)
        const loc = extractLocation(message) ?? location
        tasks.push(getWeather(loc))
    }

    // 교통 정보 감지
    if (/교통|ITS|차\s*밀려|사고|정체|도로\s*상황/.test(message)) {
        tasks.push(getTrafficHotspots())
    }

    // 부동산 감지
    if (/실거래|거래가|매매가|시세|아파트 가격|분양가/.test(message)) {
        const yearMonth = getCurrentYearMonth()
        tasks.push(getRealEstate("41220", yearMonth))
    }

    // 검색 감지 — 날씨/교통/부동산이 아닌 실시간 정보 질문
    const isWeatherOrTrafficOrRE = /날씨|기온|비|눈|맑|흐|바람|우산|교통|차\s*밀려|사고|정체|실거래|거래가|매매가|시세/.test(message)
    if (!isWeatherOrTrafficOrRE && /최신|뉴스|검색|알려줘|찾아|찾아봐|요즘|최근|지금|어때|어떤|궁금|정보|오늘|언제|몇\s*시|어디|뭐야|뭔지|어디서|어떻게|누가|공연|행사|이벤트|개봉|출시|경기|결과|가격/.test(message)) {
        tasks.push(searchWeb(message))
    }

    if (tasks.length === 0) return ""

    const results = await Promise.all(tasks)
    return results.filter(Boolean).join("\n\n")
}

function extractLocation(message: string): string | null {
    const locations = ["서울", "평택", "수원", "인천", "부산", "대구", "대전", "광주", "제주"]
    return locations.find((loc) => message.includes(loc)) ?? null
}

function getCurrentYearMonth(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${year}${month}`
}