"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashIntroProps {
    onlyOnce?: boolean; // true이면 localStorage 기반으로 첫 실행에만 표시
    duration?: number;  // 전체 표시 시간 (ms), 기본 1100
}

export default function SplashIntro({
    onlyOnce = false,
    duration = 1100,
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

        // fade-out 시작 타이밍 (duration - 300ms 지점)
        const fadeTimer = setTimeout(() => {
            setFading(true);
        }, duration - 300);

        // 완전 제거
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
                background: "rgba(10, 26, 18, 0.96)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                opacity: fading ? 0 : 1,
                transition: "opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: "none",
                willChange: "opacity",
            }}
        >
            {/* 아이콘 */}
            <div
                style={{
                    animation: "splash-icon-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    opacity: 0,
                    willChange: "transform, opacity",
                }}
            >
                <Image
                    src="/icon-512x512.png"
                    alt="Orbit AI"
                    width={64}
                    height={64}
                    priority
                    style={{
                        borderRadius: "16px",
                        display: "block",
                        filter: "drop-shadow(0 0 18px rgba(74, 222, 128, 0.22))",
                    }}
                    onError={(e) => {
                        // 512 없으면 192로 폴백
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes("512")) {
                            target.src = "/icon-192x192.png";
                        }
                    }}
                />
            </div>

            {/* 텍스트 */}
            <div
                style={{
                    marginTop: "18px",
                    overflow: "hidden",
                    lineHeight: 1,
                }}
            >
                <span
                    style={{
                        display: "block",
                        fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, 'Apple SD Gothic Neo', sans-serif",
                        fontWeight: 600,
                        fontSize: "clamp(20px, 5vw, 26px)",
                        letterSpacing: "0.12em",
                        color: "#e2f0e8",
                        animation: "splash-text-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards",
                        opacity: 0,
                        transform: "translateX(-14px)",
                        willChange: "transform, opacity",
                    }}
                >
                    Orbit AI
                </span>
            </div>

            {/* 하단 가느다란 진행 라인 */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #4ade80 40%, #86efac, transparent)",
                    animation: `splash-line ${duration}ms linear forwards`,
                    willChange: "width",
                }}
            />

            <style>{`
        @keyframes splash-icon-in {
          from {
            opacity: 0;
            transform: scale(0.82) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes splash-text-in {
          from {
            opacity: 0;
            transform: translateX(-14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes splash-line {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
        </div>
    );
}