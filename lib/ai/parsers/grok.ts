const FALLBACK = "응답을 가져올 수 없습니다."

export async function parseGrokResponse(response: Response): Promise<string> {
    if (!response.ok) {
        throw new Error(`Grok API 오류: ${response.status} ${response.statusText}`)
    }

    let data: unknown
    try {
        data = await response.json()
    } catch {
        return FALLBACK
    }

    const content =
        (data as { choices?: { message?: { content?: string } }[] })
            ?.choices?.[0]?.message?.content

    // reasoning 모델의 <thinking>...</thinking> 태그 제거
    const cleaned = (content ?? FALLBACK).replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim()
    return cleaned || FALLBACK
}
