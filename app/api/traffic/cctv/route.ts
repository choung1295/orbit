import { NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs";

function httpsGetText(url: string): Promise<{
  statusCode: number;
  contentType: string;
  body: string;
}> {
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
        const statusCode = res.statusCode ?? 0;
        const contentType = String(res.headers["content-type"] ?? "");
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8").trim();
          resolve({ statusCode, contentType, body });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error("ITS API request timeout"));
    });
  });
}

function safeJsonParse(text: string) {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  return JSON.parse(cleaned);
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
      { error: "Missing MOLIT_API_KEY" },
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
    const result = await httpsGetText(url);

    if (result.statusCode < 200 || result.statusCode >= 300) {
      return NextResponse.json(
        {
          error: "ITS API responded with non-2xx status",
          statusCode: result.statusCode,
          contentType: result.contentType,
          preview: result.body.slice(0, 300),
        },
        { status: 502 }
      );
    }

    if (!result.body) {
      return NextResponse.json(
        {
          error: "ITS API returned empty body",
        },
        { status: 502 }
      );
    }

    try {
      const parsed = safeJsonParse(result.body);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        {
          error: "ITS API did not return valid JSON",
          contentType: result.contentType,
          preview: result.body.slice(0, 500),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch CCTV data",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}