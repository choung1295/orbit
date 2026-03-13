/**
 * lib/tools/weather.ts
 * 기상청 단기예보 API — 현재 날씨 조회
 */

export async function getWeather(location: string = "평택"): Promise<string> {
    const apiKey = process.env.KMA_API_KEY
    if (!apiKey) return ""

    // 주요 도시 격자 좌표 (기상청 기준)
    const GRID_MAP: Record<string, { nx: number; ny: number }> = {
        서울: { nx: 60, ny: 127 },
        평택: { nx: 63, ny: 111 },
        수원: { nx: 60, ny: 121 },
        인천: { nx: 55, ny: 124 },
        부산: { nx: 98, ny: 76 },
        대구: { nx: 89, ny: 90 },
        대전: { nx: 67, ny: 100 },
        광주: { nx: 58, ny: 74 },
        제주: { nx: 52, ny: 38 },
    }

    const grid = GRID_MAP[location] ?? GRID_MAP["서울"]

    // 현재 날짜/시간
    const now = new Date()
    const baseDate = now.toISOString().slice(0, 10).replace(/-/g, "")
    const hour = now.getHours()
    const baseTime = `${String(hour - (hour % 3)).padStart(2, "0")}00`

    try {
        const url = new URL("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst")
        url.searchParams.set("serviceKey", apiKey)
        url.searchParams.set("numOfRows", "20")
        url.searchParams.set("pageNo", "1")
        url.searchParams.set("dataType", "JSON")
        url.searchParams.set("base_date", baseDate)
        url.searchParams.set("base_time", baseTime)
        url.searchParams.set("nx", String(grid.nx))
        url.searchParams.set("ny", String(grid.ny))

        const res = await fetch(url.toString())
        const data = await res.json()
        const items = data?.response?.body?.items?.item ?? []

        const T1H = items.find((i: { category: string }) => i.category === "T1H")?.fcstValue
        const SKY = items.find((i: { category: string }) => i.category === "SKY")?.fcstValue
        const PTY = items.find((i: { category: string }) => i.category === "PTY")?.fcstValue

        const skyMap: Record<string, string> = { "1": "맑음", "3": "구름많음", "4": "흐림" }
        const ptyMap: Record<string, string> = { "0": "", "1": "비", "2": "비/눈", "3": "눈", "4": "소나기" }

        const weather = PTY !== "0" ? ptyMap[PTY] : skyMap[SKY] ?? "알 수 없음"
        return `[날씨 - ${location}]\n현재 기온: ${T1H}°C, 날씨: ${weather}`
    } catch (err) {
        console.error("[getWeather] 오류:", err)
        return ""
    }
}