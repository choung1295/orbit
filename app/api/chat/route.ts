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