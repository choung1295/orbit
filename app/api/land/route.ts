import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const address = searchParams.get("address")?.trim()

    if (!address) {
        return NextResponse.json({ error: "address 파라미터가 필요합니다." }, { status: 400 })
    }

    const kakaoKey = process.env.KAKAO_REST_API_KEY
    if (!kakaoKey) {
        return NextResponse.json({ error: "KAKAO_REST_API_KEY 미설정" }, { status: 500 })
    }

    // 1. 지번 주소 → 좌표 변환
    let addrRes: Response
    try {
        addrRes = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}&analyze_type=similar`,
            { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
        )
    } catch {
        return NextResponse.json({ error: "주소 변환 요청 실패" }, { status: 502 })
    }

    if (!addrRes.ok) {
        return NextResponse.json({ error: "주소 변환 실패" }, { status: 502 })
    }

    const addrData = await addrRes.json()
    const doc = addrData.documents?.[0]

    if (!doc) {
        return NextResponse.json({ error: "위치 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    const lat = parseFloat(doc.y)
    const lng = parseFloat(doc.x)
    const resolvedAddress =
        doc.address?.address_name ?? doc.road_address?.address_name ?? address

    // 2. 위성 이미지 URL (서버 내부 프록시)
    const imageUrl = `/api/map-image?lat=${lat}&lng=${lng}`

    return NextResponse.json({
        address: resolvedAddress,
        lat,
        lng,
        imageUrl,
        // 토지 상세 정보: 추후 VWorld LandAPI 또는 국토부 API 연동 예정
        area: null,
        officialPrice: null,
        total: null,
        use: null,
    })
}
