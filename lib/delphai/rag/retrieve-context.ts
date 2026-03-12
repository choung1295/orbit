import { createClient } from "@/lib/supabase/client"

export interface RetrievedChunk {
    id: string
    content: string
    similarity: number
    source?: string
}

export async function retrieveContext(
    query: string,
    userId?: string,
    projectId?: string,
    topK: number = 5,
): Promise<string> {

    // pgvector 미설정 시 빈 문자열 반환 (에러 방지)
    if (!query || query.trim() === "") return ""

    try {
        const supabase = createClient()

        // 1. 쿼리 임베딩 생성
        const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: query,
            }),
        })

        if (!embeddingRes.ok) {
            console.error("[retrieveContext] 임베딩 생성 실패")
            return ""
        }

        const embeddingData = await embeddingRes.json()
        const embedding = embeddingData.data[0].embedding

        // 2. Supabase 벡터 유사도 검색
        const { data, error } = await supabase.rpc("match_documents", {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: topK,
            filter_user_id: userId ?? null,
            filter_project: projectId ?? null,
        })

        if (error) {
            console.error("[retrieveContext] 벡터 검색 오류:", error.message)
            return ""
        }

        if (!data || data.length === 0) return ""

        // 3. 결과를 텍스트 블록으로 변환
        const chunks = data as RetrievedChunk[]
        return chunks
            .map((c, i) => `[${i + 1}] ${c.content}`)
            .join("\n\n")

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("[retrieveContext] 오류:", error.message)
        }
        return ""
    }
}