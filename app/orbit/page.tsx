import { Suspense } from 'react'
import OrbitChat from '@/components/chat/OrbitChat'

/**
 * /orbit 페이지
 * - OrbitChat은 useSearchParams를 사용하므로 Suspense로 감싸야 함
 * - conversationId는 ?chat=<id> query param에서 읽힘
 *   예: /orbit          → 새 대화
 *   예: /orbit?chat=xxx → 기존 대화 xxx 복원
 */
export default function OrbitPage() {
    return (
        <Suspense>
            <OrbitChat />
        </Suspense>
    )
}
