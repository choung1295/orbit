import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function searchInputInMemory() {
    console.log("Searching memories for '입력'...")
    const { data, error } = await supabase
        .from("memories")
        .select("*")
        .ilike("content", "%입력%")
        .eq("status", "active")

    if (error) {
        console.error("Error:", error.message)
    } else {
        console.log(`Found ${data.length} memories containing '입력'.`)
        data.forEach((m, i) => {
            console.log(`\n--- Memory ${i + 1} (${m.type}) ---`)
            console.log(m.content)
        })
    }
}

searchInputInMemory()
