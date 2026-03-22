import { NextRequest } from "next/server"

// VWorld WMTS 위성 타일 서버 프록시
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const z = searchParams.get("z")
    const x = searchParams.get("x")
    const y = searchParams.get("y")

    if (!z || !x || !y) {
        return new Response("z, x, y 파라미터가 필요합니다.", { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
    if (!apiKey) {
        return new Response("VWORLD API KEY 미설정", { status: 500 })
    }

    const url = `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Satellite/${z}/${y}/${x}.jpeg`

    let res: Response
    try {
        res = await fetch(url)
    } catch {
        return new Response("타일 요청 실패", { status: 502 })
    }

    if (!res.ok) {
        return new Response("타일 불러오기 실패", { status: 502 })
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("image")) {
        return new Response("타일 형식 오류", { status: 502 })
    }

    const buffer = await res.arrayBuffer()
    return new Response(buffer, {
        headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400",
        },
    })
}
