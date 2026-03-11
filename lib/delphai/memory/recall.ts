import { searchMemory } from "./search-memory"
import { getMemories } from "./memory-store"

export async function recallMemory(userId: string, message: string) {
    const memories = getMemories()
    return searchMemory(memories, message)
}