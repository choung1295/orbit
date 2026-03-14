import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minX = searchParams.get("minX") || "124.0";
  const maxX = searchParams.get("maxX") || "132.0";
  const minY = searchParams.get("minY") || "33.0";
  const maxY = searchParams.get("maxY") || "43.0";

  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  const url = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${apiKey}&type=all&cctvType=1&minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}&getType=json`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch CCTV data" }, { status: 500 });
  }
}