"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashIntroProps {
    onlyOnce?: boolean;
    duration?: number;
}

export default function SplashIntro({
    onlyOnce = false,
    duration = 1900,
}: SplashIntroProps) {
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        if (onlyOnce) {
            const seen = localStorage.getItem("orbit_splash_seen");
            if (seen) return;
            localStorage.setItem("orbit_splash_seen", "1");
        }

        setVisible(true);

        const fadeTimer = setTimeout(() => {
            setFading(true);
        }, duration - 300);

        const removeTimer = setTimeout(() => {
            setVisible(false);
        }, duration + 100);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [onlyOnce, duration]);

    if (!visible) return null;

    return (
        <div
            className="orbit-splash"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#0a1a12",
                opacity: fading ? 0 : 1,
                transition: "opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: "none",
            }}
        >
            {/* 아이콘 */}
            <div
                style={{
                    animation: "splash-icon-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    opacity: 0,
                }}
            >
                <Image
                    src="/icon-512x512.png"
                    alt="Orbit AI"
                    width={72}
                    height={72}
                    priority
                    style={{
                        borderRadius: "18px",
                        display: "block",
                    }}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes("512")) {
                            target.src = "/icon-192x192.png";
                        }
                    }}
                />
            </div>

            {/* 텍스트 — O 중앙에서 클로즈업 */}
            <div style={{ marginTop: "20px", lineHeight: 1 }}>
                <span
                    style={{
                        display: "block",
                        fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, 'Apple SD Gothic Neo', sans-serif",
                        fontWeight: 600,
                        fontSize: "clamp(36px, 8vw, 47px)",
                        letterSpacing: "0.12em",
                        color: "#e2f0e8",
                        // 시작: O 중앙 좌표(위쪽)에서 아주 작게, 끝: 정상 위치 & 크기
                        animation: "splash-text-zoom 0.78s cubic-bezier(0.22, 1, 0.36, 1) 0.28s forwards",
                        opacity: 0,
                        transform: "translateY(-65px) scale(0.05)",
                    }}
                >
                    Orbit AI
                </span>
            </div>

            {/* 하단 진행 라인 */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #4ade80 40%, #86efac, transparent)",
                    animation: `splash-line ${duration}ms linear forwards`,
                }}
            />

            <style>{`
        @keyframes splash-icon-in {
          from { opacity: 0; transform: scale(0.72); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splash-text-zoom {
          0%   { opacity: 0;   transform: translateY(-65px) scale(0.05); }
          30%  { opacity: 1; }
          70%  { transform: translateY(3px) scale(1.04); }
          100% { opacity: 1;   transform: translateY(0) scale(1); }
        }
        @keyframes splash-line {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
        </div>
    );
}
