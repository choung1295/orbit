const FALLBACK = "응답을 가져올 수 없습니다."

export async function parseOpenAIResponse(response: Response): Promise<string> {
    if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`)
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

    return content ?? FALLBACK
}
