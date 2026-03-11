export type MemoryType =
    | "user_preference"
    | "project_principle"
    | "project_decision"
    | "task_continuity"
    | "constraint"
    | "episodic_note";

export type MemoryStatus =
    | "candidate"
    | "active"
    | "superseded"
    | "conflicted"
    | "archived";