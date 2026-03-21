"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashIntroProps {
    onlyOnce?: boolean;
    duration?: number;
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
                // backdrop-filter 제거 → GPU 합성 레이어 생성 차단
                background: "#0a1a12",
                opacity: fading ? 0 : 1,
                transition: "opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: "none",
                // will-change 제거 → GPU 레이어 잔상 방지
            }}
        >
            {/* 아이콘 */}
            <div
                style={{
                    animation: "splash-icon-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    opacity: 0,
                    // will-change 제거
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
                        // filter: drop-shadow 제거 → GPU 합성 레이어 차단
                    }}
                    onError={(e) => {
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
                    marginTop: "20px",
                    overflow: "hidden",
                    lineHeight: 1,
                }}
            >
                <span
                    style={{
                        display: "block",
                        fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, 'Apple SD Gothic Neo', sans-serif",
                        fontWeight: 600,
                        fontSize: "clamp(36px, 8vw, 47px)",
                        letterSpacing: "0.12em",
                        color: "#e2f0e8",
                        animation: "splash-text-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards",
                        opacity: 0,
                        transform: "translateX(-14px)",
                        // will-change 제거
                    }}
                >
                    Orbit AI
                </span>
            </div>

            {/* 하단 진행 라인 - will-change 제거 */}
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
          from { opacity: 0; transform: scale(0.82) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splash-text-in {
          from { opacity: 0; transform: translateX(-14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes splash-line {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
        </div>
    );
}
