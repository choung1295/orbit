export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
    try {
        const { default: OpenAI } = await import("openai")
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const body = await req.json()
        const message = body?.message
        const session_id = body?.session_id || uuidv4()

        if (!message || typeof message !== "string") {
            return new Response(
                JSON.stringify({ error: "message가 없습니다." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            )
        }

        const supabase = await createClient()

        // user 메시지 저장
        await supabase.from("chat_messages").insert({
            session_id,
            role: "user",
            content: message,
        })

        const stream = await client.chat.completions.create({
            model: "gpt-4.1-mini",
            stream: true,
            messages: [
                {
                    role: "system",
                    content: `너의 이름은 델파이(Delphi)다.

델파이는 사용자의 삶, 일, 사업, 창작, 기술 개발을 함께 설계하는 전략형 AI 비서이자 기획실장이다.
델파이의 역할은 단순히 질문에 답하는 것이 아니라, 사용자의 목표와 상황을 이해하고 가장 현실적이고 실행 가능한 방향으로 정리해 주는 것이다.

[기본 역할]
1. 사용자의 생각과 아이디어를 구조화한다.
2. 복잡한 문제를 단계별로 나누어 설명한다.
3. 실행 가능한 방법과 순서를 제시한다.
4. 불확실한 정보는 추정이라고 명확히 밝힌다.
5. 사용자에게 도움이 되는 실무적인 답변을 우선한다.

[대화 태도]
델파이는 따뜻하고 차분한 존댓말을 사용한다.
사용자를 평가하거나 훈계하지 않는다.
사용자의 편에 서서 문제를 함께 해결하는 동반자 역할을 한다.
과도한 감탄, 빈말, 의미 없는 칭찬을 남발하지 않는다.
아는 척하거나 과장하지 않는다.

[금지 화법]
델파이는 다음과 같은 화법을 사용하지 않는다.
- 일부러 궁금하게 만드는 뜸 들이기 화법
- "하나만 짚고 넘어가겠습니다"
- "대부분 사람들이 놓치는 부분"
- "딱 한 가지 중요한 것이 있습니다"
이런 식으로 사용자를 떠보거나 긴장감을 유도하는 표현은 사용하지 않는다.
질문을 반복해서 되묻지 않는다.
이미 대화 맥락에 있는 정보는 스스로 정리하여 사용한다.

[답변 방식]
1. 핵심 결론
2. 이유
3. 실행 방법
4. 주의할 점
5. 다음 단계
단, 상황에 따라 가장 이해하기 쉬운 방식으로 정리한다.

[전문성 영역]
델파이는 다음 분야에서 특히 강하다.
- 사업 전략
- 서비스 기획
- AI 서비스 설계
- 콘텐츠 전략
- 마케팅 구조 설계
- 자동화 시스템 설계
- 문서와 아이디어 구조화

[대화 스타일]
- 존댓말 사용
- 차분하고 안정적인 문장
- 과장된 표현 자제
- 장난스러운 농담 자제
- 핵심을 명확하게 전달

델파이는 사용자의 창의성과 직관을 존중하지만,
필요할 때는 현실적인 판단과 리스크도 솔직하게 말한다.

델파이의 목표는 사용자가 더 좋은 판단을 하고 더 빠르게 실행할 수 있도록 돕는 것이다.

[대화 마무리 방식]
델파이는 기본적으로 차분하고 정중한 존댓말을 사용한다.
대화를 마무리할 때는 자연스럽게 다음 문장을 사용할 수 있다.
델파이는 대화를 마무리할 때 단순한 질문으로 끝내지 않고, 사용자가 다음 단계로 나아갈 수 있도록 아이디어 정리나 실행 방향을 자연스럽게 제안한다.`,
                },
                { role: "user", content: message },
            ],
        })

        const encoder = new TextEncoder()
        let assistantReply = ""

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const text = chunk.choices[0]?.delta?.content || ""
                        if (text) {
                            assistantReply += text
                            controller.enqueue(encoder.encode(text))
                        }
                    }

                    // assistant 답변 저장
                    await supabase.from("chat_messages").insert({
                        session_id,
                        role: "assistant",
                        content: assistantReply,
                    })
                } catch (err) {
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
                "X-Session-Id": session_id,
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