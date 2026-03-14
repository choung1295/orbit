import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function searchMessages() {
    console.log("Searching messages for API keywords...")
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or("content.ilike.%교통%,content.ilike.%ITS%,content.ilike.%날씨 지도%")
        .limit(10)

    if (error) {
        console.error("Error:", error.message)
    } else {
        console.log(`Found ${data.length} relevant messages.`)
        data.forEach((m, i) => {
            console.log(`\n--- Message ${i + 1} (${m.role}) ---`)
            console.log(m.content)
        })
    }
}

searchMessages()
