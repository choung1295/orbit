import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDocuments() {
    console.log("Checking 'documents' table...")
    const { data, error } = await supabase.from("documents").select("*").limit(10)
    if (error) {
        console.error("Error:", error.message)
    } else {
        console.log(`Found ${data.length} documents.`)
        data.forEach((d, i) => {
            console.log(`\n--- Document ${i + 1} ---`)
            console.log(`Title: ${d.title || 'No Title'}`)
            console.log(`Content: ${d.content?.substring(0, 500)}...`)
        })
    }
}

checkDocuments()
