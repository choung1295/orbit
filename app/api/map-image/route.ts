import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const lat = parseFloat(searchParams.get("lat") ?? "")
    const lng = parseFloat(searchParams.get("lng") ?? "")

    if (isNaN(lat) || isNaN(lng)) {
        return new Response(JSON.stringify({ error: "lat, lng 파라미터가 필요합니다." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "VWORLD API KEY 미설정" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }

    // BBOX 설정: 약 300m x 240m 범위 (토지 형태가 보이는 수준)
    const dLng = 0.0018
    const dLat = 0.0013
    const minX = (lng - dLng).toFixed(6)
    const minY = (lat - dLat).toFixed(6)
    const maxX = (lng + dLng).toFixed(6)
    const maxY = (lat + dLat).toFixed(6)

    const vworldUrl =
        `https://api.vworld.kr/req/image` +
        `?service=IMAGE&request=getmap&version=2.0` +
        `&crs=EPSG:4326&bbox=${minX},${minY},${maxX},${maxY}` +
        `&size=800*450&imagetype=jpeg&transparent=false` +
        `&layers=satellite&apiKey=${apiKey}`

    let imageRes: Response
    try {
        imageRes = await fetch(vworldUrl)
    } catch {
        return new Response(JSON.stringify({ error: "위성 이미지 요청 실패" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
        })
    }

    const contentType = imageRes.headers.get("Content-Type") ?? ""
    if (!imageRes.ok || !contentType.includes("image")) {
        return new Response(JSON.stringify({ error: "위성 이미지 불러오기 실패" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
        })
    }

    const imageBuffer = await imageRes.arrayBuffer()
    return new Response(imageBuffer, {
        headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400",
        },
    })
}
