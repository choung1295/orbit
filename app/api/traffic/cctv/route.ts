import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

function httpsGetJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0",
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk: Buffer | string) => {
          data += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
        });

        res.on("end", () => {
          try {
            const text = data.trim().replace(/^\uFEFF/, "");

            if (!text) {
              resolve({
                error: "ITS API returned empty body",
                items: [],
              });
              return;
            }

            if (!text.startsWith("{") && !text.startsWith("[")) {
              resolve({
                error: "ITS API did not return JSON",
                preview: text.slice(0, 500),
                items: [],
              });
              return;
            }

            resolve(JSON.parse(text));
          } catch {
            resolve({
              error: "ITS API JSON parse failed",
              preview: data.slice(0, 500),
              items: [],
            });
          }
        });
      }
    );

    req.on("error", reject);

    req.setTimeout(10000, () => {
      req.destroy(new Error("ITS API request timeout"));
    });
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
    return NextResponse.json(
      { error: "Missing MOLIT_API_KEY", items: [] },
      { status: 500 }
    );
  }

  const url =
    `https://openapi.its.go.kr:9443/cctvInfo` +
    `?apiKey=${encodeURIComponent(apiKey)}` +
    `&type=all` +
    `&cctvType=1` +
    `&minX=${encodeURIComponent(minX)}` +
    `&maxX=${encodeURIComponent(maxX)}` +
    `&minY=${encodeURIComponent(minY)}` +
    `&maxY=${encodeURIComponent(maxY)}` +
    `&getType=json`;

  try {
    const data = await httpsGetJson(url);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch CCTV data",
        detail: error instanceof Error ? error.message : String(error),
        items: [],
      },
      { status: 500 }
    );
  }
}