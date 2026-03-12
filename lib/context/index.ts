import { getDateTime } from './getDateTime';

/**
 * buildContext.ts
 * 향후 날씨, 교통 등 외부 API context가 추가될 것을 고려해 확장 가능한 구조.
 * 결과는 시스템 프롬프트 상단에 삽입할 수 있는 문자열 형태로 반환.
 */
export function buildContext(): string {
    const timeContext = getDateTime();
    
    // 추후 다른 컨텍스트(날씨 등)가 추가되면 여기에 취합
    
    return `[SYSTEM CONTEXT]\n현재 시간: ${timeContext}\n[END SYSTEM CONTEXT]`;
}
