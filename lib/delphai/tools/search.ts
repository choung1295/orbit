/**
 * lib/tools/search.ts
 * Tavily 검색 API — 실시간 웹 검색
 */

export interface SearchResult {
    title: string
    url: string
    content: string
}

export async function searchWeb(query: string): Promise<string> {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) return ""

    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: "basic",
                max_results: 5,
                include_answer: true,
            }),
        })

        const data = await res.json()

        if (data.answer) return `[검색 결과]\n${data.answer}`

        const results: SearchResult[] = data.results ?? []
        return results
            .slice(0, 3)
            .map((r) => `• ${r.title}\n  ${r.content}`)
            .join("\n\n")
    } catch (err) {
        console.error("[searchWeb] 오류:", err)
        return ""
    }
}