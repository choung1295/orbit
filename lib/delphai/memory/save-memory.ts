import { MemoryType, MemoryStatus } from "./memory-types";

export type MemoryRecord = {
    type: MemoryType;
    status: MemoryStatus;
    content: string;
    createdAt: number;
};

export function createMemory(
    type: MemoryType,
    content: string
): MemoryRecord {
    return {
        type,
        status: "candidate",
        content,
        createdAt: Date.now(),
    };
}