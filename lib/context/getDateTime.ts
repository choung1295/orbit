/**
 * getDateTime.ts
 * 서버 사이드에서 현재 한국 시간(Asia/Seoul)을 반환하는 함수.
 */
export function getDateTime(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true, // 오후 3시 형태
    });

    return formatter.format(now);
}
