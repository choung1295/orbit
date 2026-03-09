export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    try {
        const { default: OpenAI } = await import("openai")
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const body = await req.json()
        const message = body?.message

        if (!message || typeof message !== "string") {
            return new Response(
                JSON.stringify({ error: "message가 없습니다." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            )
        }

        const stream = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            stream: true,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful AI assistant. " +
                        "IMPORTANT RULE: Only when a user explicitly asks about your identity, name, or who you are " +
                        "(e.g. '너 누구야?', '너 누구니?', '정체가 뭐야?', 'Who are you?', 'What is your name?'), " +
                        "reply with exactly: '저는 Orbit 플랫폼의 AI Delphai 입니다.' " +
                        "For ALL other questions and conversations, respond naturally and helpfully WITHOUT mentioning your name or identity at all. " +
                        "Do NOT introduce yourself or state your name unless the user specifically asks.",
                },
                { role: "user", content: message },
            ],
        })

        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const text = chunk.choices[0]?.delta?.content || ""
                        if (text) {
                            controller.enqueue(encoder.encode(text))
                        }
                    }
                } catch (err) {
                    // Client disconnected (AbortError) — silently stop
                    if (!(err instanceof Error && err.name === "AbortError")) {
                        console.error("Stream error:", err)
                    }
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    } catch (error) {
        console.error("OpenAI API error:", error)
        return new Response(
            JSON.stringify({ error: "AI 응답 중 오류가 발생했습니다." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}