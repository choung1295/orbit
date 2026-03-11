import { createMemory } from "./save-memory"
import { addMemory } from "./memory-store"

export async function saveMemory(userId: string, message: string, response: string) {
    const record = createMemory("episodic_note", `user: ${message}\nassistant: ${response}`)
    addMemory(record)
}