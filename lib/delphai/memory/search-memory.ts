import { MemoryRecord } from "./save-memory";

export function searchMemory(
    memories: MemoryRecord[],
    keyword: string
) {
    return memories.filter((m) =>
        m.content.toLowerCase().includes(keyword.toLowerCase())
    );
}