import { reason } from "./reasoning/reason";
import { SYSTEM_PROMPT } from "./prompt/system-prompt";

export function runDelphai(input: string) {
    const thinking = reason(input);

    return {
        system: SYSTEM_PROMPT,
        thinking,
        input,
        result: thinking.result,
    };
}
