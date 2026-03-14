/**
 * lib/tools/traffic.ts
 * 국가교통정보센터(ITS) API — 실시간 돌발 상황 정보
 */

export async function getTrafficHotspots(): Promise<string> {
    const apiKey = process.env.MOLIT_API_KEY
    if (!apiKey) return ""

    try {
        const url = new URL("https://openapi.its.go.kr:9443/eventInfo")
        url.searchParams.set("apiKey", apiKey)
        url.searchParams.set("type", "all")
        url.searchParams.set("eventType", "all")
        url.searchParams.set("minX", "124.0")
        url.searchParams.set("maxX", "132.0")
        url.searchParams.set("minY", "33.0")
        url.searchParams.set("maxY", "43.0")
        url.searchParams.set("getType", "json")

        const res = await fetch(url.toString())
        const data = await res.json()
        const items = data?.body?.items || []

        if (items.length === 0) return "[교통 소식] 현재 전국 주요 도로에 특이한 돌발 상황은 없습니다."

        const summary = items
            .slice(0, 5)
            .map((i: any) => `• [${i.eventtype || "사고/공사"}] ${i.eventdetail || i.eventmsg} (${i.roadname || "도로명 미상"})`)
            .join("\n")

        return `[실시간 전국 교통 돌발 정보]\n${summary}`
    } catch (err) {
        console.error("[getTrafficHotspots] 오류:", err)
        return ""
    }
}
