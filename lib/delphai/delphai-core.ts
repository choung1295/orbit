import { recallMemory } from "./memory/recall"
import { saveMemory } from "./memory/save"
import { buildPrompt } from "./prompt/build"
import { callAI } from "../ai/callAI"

export async function runDelphai(userId: string, message: string) {

    const memories = await recallMemory(userId, message)

    const prompt = buildPrompt(message, memories)

    const aiResponse = await callAI(prompt)

    await saveMemory(userId, message, aiResponse)

    return aiResponse
}
