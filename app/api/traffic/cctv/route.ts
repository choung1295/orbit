import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const preferredRegion = 'icn1'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('cctv_cache')
    .select('id, name, lat, lng, url')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
