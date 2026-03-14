import { getWeather } from "./lib/delphai/tools/weather"
import { getRealEstate } from "./lib/delphai/tools/realestate"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function testApis() {
    console.log("--- Testing Real APIs ---")

    console.log("\nTesting Weather (Seoul)...")
    const weather = await getWeather("서울")
    console.log(weather || "Weather failed")

    console.log("\nTesting Real Estate (Pyeongtaek - 41220, 202401)...")
    // Use a slightly older date to ensure data exists if recent data is not yet available
    const realestate = await getRealEstate("41220", "202401")
    console.log(realestate || "Real Estate failed")
}

testApis()
