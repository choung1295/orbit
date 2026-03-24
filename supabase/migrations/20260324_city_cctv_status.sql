-- 시내 CCTV 점검중 상태 캐시 테이블
-- 크론(/api/cron/check-city-cctv)이 주기적으로 UTIC 데이터를 점검하고 결과를 저장합니다.
-- is_maintenance = true 인 CCTV만 지도에 "점검중" 표시됩니다.
-- 프론트가 직접 접근하지 않으므로 RLS 정책은 서비스 롤 전용으로 제한합니다.

CREATE TABLE IF NOT EXISTS city_cctv_status (
  cctvid       TEXT        PRIMARY KEY,
  is_maintenance BOOLEAN   NOT NULL DEFAULT false,
  checked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE city_cctv_status ENABLE ROW LEVEL SECURITY;
-- 서비스 롤은 RLS를 자동 우회하므로 별도 정책 없이 서버 전용으로 동작합니다.
