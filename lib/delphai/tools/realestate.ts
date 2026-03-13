/**
 * lib/tools/realestate.ts
 * 국토교통부 아파트 매매 실거래가 API
 */

export async function getRealEstate(regionCode: string, yearMonth: string): Promise<string> {
    const apiKey = process.env.MOLIT_API_KEY
    if (!apiKey) return ""

    // regionCode 예: "41220" (평택시)
    // yearMonth 예: "202502"

    try {
        const url = new URL("https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev")
        url.searchParams.set("serviceKey", apiKey)
        url.searchParams.set("LAWD_CD", regionCode)
        url.searchParams.set("DEAL_YMD", yearMonth)
        url.searchParams.set("numOfRows", "10")
        url.searchParams.set("pageNo", "1")

        const res = await fetch(url.toString())
        const text = await res.text()

        // XML 파싱 (간단하게 정규식 사용)
        const matches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
        const results = []

        for (const match of matches) {
            const item = match[1]
            const get = (tag: string) => item.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1]?.trim() ?? ""

            results.push(
                `• ${get("아파트")} ${get("전용면적")}㎡ — ${get("거래금액")}만원 (${get("년")}년 ${get("월")}월, ${get("법정동")})`
            )
        }

        if (results.length === 0) return ""
        return `[아파트 실거래가]\n${results.slice(0, 5).join("\n")}`
    } catch (err) {
        console.error("[getRealEstate] 오류:", err)
        return ""
    }
}