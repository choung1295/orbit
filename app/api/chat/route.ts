export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { runDelphai } from "@/lib/delphai";

export async function POST(req: Request) {
    try {
        const { default: OpenAI } = await import("openai");

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const body = await req.json();

        const message = body?.message || "";
        const session_id = body?.session_id || uuidv4();

        if (!message || typeof message !== "string") {
            return new Response(
                JSON.stringify({ error: "message가 없습니다." }),
                { status: 400 }
            );
        }

        const delphai = runDelphai(message);
        const result = delphai.thinking.result;

        console.log(result);

        const reply = result;

        return Response.json({ reply, session_id });

    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "server error" }),
            { status: 500 }
        );
    }
}