import { NextRequest, NextResponse } from "next/server"

function lngToTileX(lng: number, z: number) {
    return Math.floor((lng + 180) / 360 * Math.pow(2, z))
}

function latToTileY(lat: number, z: number) {
    const rad = (lat * Math.PI) / 180
    return Math.floor(
        (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, z)
    )
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const lat = parseFloat(searchParams.get("lat") ?? "")
    const lng = parseFloat(searchParams.get("lng") ?? "")

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: "lat, lng 파라미터가 필요합니다." }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "VWORLD API KEY 미설정" }, { status: 500 })
    }

    const zoom = 17
    const cx = lngToTileX(lng, zoom)
    const cy = latToTileY(lat, zoom)
    const base = `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Satellite`

    // 3×2 타일 그리드 (좌우 각 1칸, 상하 각 1칸) → 768×512px
    const tiles: { url: string; col: number; row: number }[] = []
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            tiles.push({
                url: `${base}/${zoom}/${cy - 1 + row}/${cx - 1 + col}.jpeg`,
                col,
                row,
            })
        }
    }

    return NextResponse.json({ tiles, zoom, cx, cy })
}
