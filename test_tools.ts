import { runTools } from "./lib/delphai/tools/index"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function testTools() {
    console.log("--- Testing Tools ---")

    const queries = [
        "평택 날씨 알려줘",
        "현재 서울 교통 상황 어때?",
        "전국 실시간 날씨 지도 보여줘",
        "평택 고덕 아파트 실거래가 알려줘"
    ]

    for (const query of queries) {
        console.log(`\nQuery: "${query}"`)
        try {
            const result = await runTools({ message: query })
            console.log(`Result: ${result || "(No tools triggered)"}`)
        } catch (error) {
            console.error(`Error: ${error.message}`)
        }
    }
}

testTools()
