import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log("Checking for other tables...")
    // We can't easily list tables via supabase-js without specific permissions or RPC
    // But we can try to query some common names
    const tables = ["tools", "api_configs", "external_apis", "documents"]
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").limit(1)
        if (error) {
            console.log(`Table '${table}' not found or error: ${error.message}`)
        } else {
            console.log(`Table '${table}' exists!`)
        }
    }
}

checkTables()
