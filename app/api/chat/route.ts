export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { default: OpenAI } = await import("openai")
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const body = await req.json()
        const message = body?.message

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "message가 없습니다." },
                { status: 400 }
            )
        }

        const response = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "당신의 이름은 Delphai이며, Orbit 플랫폼의 AI 어시스턴트입니다. " +
                        "사용자가 당신의 정체나 이름을 물으면 '저는 Orbit 플랫폼의 AI Delphai입니다.'라고 답하세요. " +
                        "그 외 질문에는 친절하고 정확하게 답변하세요.",
                },
                { role: "user", content: message },
            ],
        })

        return NextResponse.json({
            answer: response.choices[0]?.message?.content || "응답이 비어 있습니다.",
        })
    } catch (error) {
        console.error("OpenAI API error:", error)
        return NextResponse.json(
            { error: "AI 응답 중 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}