import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/orbit"

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)

        // 닉네임 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data } = await supabase
                .from("users")
                .select("nickname")
                .eq("id", user.id)
                .single()

            // 닉네임 없으면 닉네임 설정 페이지로
            if (!data?.nickname) {
                return NextResponse.redirect(`${origin}/auth/nickname`)
            }
        }
    }

    return NextResponse.redirect(`${origin}${next}`)
}