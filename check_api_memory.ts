import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkApiMemory() {
    console.log("Searching memories for API keywords...")
    const { data, error } = await supabase
        .from("memories")
        .select("*")
        .or("content.ilike.%교통%,content.ilike.%ITS%,content.ilike.%날씨%,content.ilike.%지도%,content.ilike.%api%")
        .eq("status", "active")

    if (error) {
        console.error("Error:", error.message)
    } else {
        console.log(`Found ${data.length} relevant memories.`)
        data.forEach((m, i) => {
            console.log(`\n--- Memory ${i + 1} (${m.type}) ---`)
            console.log(m.content)
        })
    }
}

checkApiMemory()
