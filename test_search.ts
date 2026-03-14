import { searchWeb } from "./lib/delphai/tools/search"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function testSearch() {
    console.log("--- Testing Search for Traffic/Weather Map ---")

    const queries = [
        "실시간 전국 교통 상황 국가교통정보센터",
        "현재 전국 기상 지도 날씨 지도"
    ]

    for (const query of queries) {
        console.log(`\nQuery: "${query}"`)
        try {
            const result = await searchWeb(query)
            console.log(`Result: ${result}`)
        } catch (error) {
            console.error(`Error: ${error.message}`)
        }
    }
}

testSearch()
