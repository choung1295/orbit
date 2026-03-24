'use client'

/**
 * [임시] 시내 CCTV 점검중 표시 — 세션 내 클릭 실패 이력 기반
 *
 * ⚠️  이 훅은 임시 사용자 불편 완화 장치입니다. 정식 상태판단 기능이 아닙니다.
 *
 * 동작:
 *   - 사용자가 시내 CCTV 팝업을 THRESHOLD 이내에 닫으면 해당 CCTV를 임시 마킹
 *   - 이후 같은 세션에서 그 마커 옆에 "점검중" 텍스트를 표시
 *   - 페이지 새로고침 또는 세션 종료 시 초기화 (localStorage 미사용)
 *
 * 한계:
 *   - 첫 클릭 전에는 표시되지 않음 (사전 예방 아님, 사후 보조 기능)
 *   - 빠른 닫기가 반드시 실패를 의미하지 않음 (오탐 가능)
 *
 * 교체 방법:
 *   이 파일 전체를 삭제하고, 서버에서 점검중 CCTV ID 목록을 받는 훅으로 교체하세요.
 *   CctvMap.tsx 에서 `useCityMaintenanceCctv` 임포트 2곳만 변경하면 됩니다.
 */

import { useState, useCallback, useRef } from 'react'

/** 이 시간(ms) 이내에 팝업을 닫으면 실패로 간주 */
export const MAINTENANCE_CLOSE_THRESHOLD_MS = 4000

export function useCityMaintenanceCctv() {
  const [maintenanceCctvIds, setMaintenanceCctvIds] = useState<Set<string>>(new Set())

  /** 열린 시각 기록 (컴포넌트 외부 ref 없이 이 훅 안에서 관리) */
  const openTimeRef = useRef<number>(0)

  /** 시내 CCTV 팝업이 열릴 때 호출 */
  const onCityPopupOpen = useCallback(() => {
    openTimeRef.current = Date.now()
  }, [])

  /**
   * 시내 CCTV 팝업이 닫힐 때 호출
   * THRESHOLD 이내 닫히면 해당 ID를 점검중으로 임시 마킹
   */
  const onCityPopupClose = useCallback((cctvId: string | undefined) => {
    if (
      cctvId &&
      openTimeRef.current > 0 &&
      Date.now() - openTimeRef.current < MAINTENANCE_CLOSE_THRESHOLD_MS
    ) {
      setMaintenanceCctvIds(prev => prev.has(cctvId) ? prev : new Set(prev).add(cctvId))
    }
    openTimeRef.current = 0
  }, [])

  return { maintenanceCctvIds, onCityPopupOpen, onCityPopupClose }
}
