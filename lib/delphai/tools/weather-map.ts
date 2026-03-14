/**
 * lib/tools/weather-map.ts
 * 전국 주요 도시 날씨 요약 (날씨 지도 대용)
 */
import { getWeather } from "./weather"

export async function getWeatherMap(): Promise<string> {
    const cities = ["서울", "인천", "대전", "대구", "부산", "광주", "제주"]
    
    try {
        const results = await Promise.all(cities.map(city => getWeather(city)))
        const validResults = results.filter(Boolean)
        
        if (validResults.length === 0) return ""
        
        // 간단한 텍스트 기반 지도 느낌의 요약
        return `[전국 실시간 날씨 요약]\n${validResults.join("\n")}`
    } catch (err) {
        console.error("[getWeatherMap] 오류:", err)
        return ""
    }
}
