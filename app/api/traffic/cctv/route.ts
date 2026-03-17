import { NextResponse } from "next/server";
import https from "https";

function httpsGetJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = "";
      res.on("data", (chunk: string) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

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
    const data = await httpsGetJson(url);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch CCTV data", detail: String(e) },
      { status: 500 }
    );
  }
}
