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

// ?lat=&lng= → 타일 좌표 목록 (프록시 URL 반환)
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const lat = parseFloat(searchParams.get("lat") ?? "")
    const lng = parseFloat(searchParams.get("lng") ?? "")

    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: "lat, lng 파라미터가 필요합니다." }, { status: 400 })
    }

    const zoom = 17
    const cx = lngToTileX(lng, zoom)
    const cy = latToTileY(lat, zoom)

    // 3×2 그리드 — URL은 서버 프록시 경로로 반환
    const tiles = []
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            const tx = cx - 1 + col
            const ty = cy - 1 + row
            tiles.push({
                url: `/api/tile?z=${zoom}&x=${tx}&y=${ty}`,
                col,
                row,
            })
        }
    }

    return NextResponse.json({ tiles })
}
