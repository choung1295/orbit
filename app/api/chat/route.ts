export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { runDelphai } from "@/lib/delphai/reasoning/delphai-core"
import { AIProvider } from "@/lib/ai/callAI"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const message = body?.message ?? ""
        const projectId = body?.project_id ?? undefined
        const isPlayground = body?.playground ?? false
        const provider = body?.provider as AIProvider | undefined

        if (!message || typeof message !== "string") {
            return Response.json(
                { error: "message가 없습니다." },
                { status: 400 }
            )
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return Response.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const { data: profile } = await supabase
            .from("users")
            .select("plan, user_level")
            .eq("id", user.id)
            .single()

        const plan = profile?.plan ?? "free"
        const userLevel = profile?.user_level ?? "default"

        const result = await runDelphai({
            userId: user.id,
            message,
            plan,
            userLevel,
            projectId,
            isPlayground,
            provider,
        })

        if (result.error) {
            return Response.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return Response.json({
            reply: result.response,
            provider: result.provider,
            mode: result.mode,
        })

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "server error"
        console.error("[route] 오류:", msg)
        return Response.json(
            { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
            { status: 500 }
        )
    }
}