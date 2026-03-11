import { MemoryRecord } from "./save-memory"

const memoryStore: MemoryRecord[] = []

export function addMemory(memory: MemoryRecord) {
    memoryStore.push(memory)
}

export function getMemories() {
    return memoryStore
}