"use client"

interface PlanetAvatarProps {
    size?: number
    isDark?: boolean
}

export default function PlanetAvatar({ size = 140, isDark = true }: PlanetAvatarProps) {
    // 라이트 모드: SVG 없이 순수 CSS 원만 렌더링 (orbit 선 유출 방지)
    if (!isDark) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #6366f1 0%, #4338ca 60%, #312e81 100%)',
                    border: `${Math.round(size * 0.035)}px solid #818cf8`,
                    flexShrink: 0,
                }}
            />
        )
    }
    const s = size
    const cx = s / 2
    const cy = s / 2

    const planetR = s * 0.233
    const planetCx = cx + s * 0.02
    const planetCy = cy + s * 0.04
    const orbitRx = s * 0.42
    const orbitRy = s * 0.14
    const orbitRotation = -15

    const rad = (orbitRotation * Math.PI) / 180
    const xOffset = orbitRx * Math.cos(rad)
    const yOffset = orbitRx * Math.sin(rad)

    const startX = cx - xOffset
    const startY = cy - yOffset
    const endX = cx + xOffset
    const endY = cy + yOffset

    return (
        <svg
            width={s}
            height={s}
            viewBox={`0 0 ${s} ${s}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: isDark ? "visible" : "hidden" }}
        >
            <defs>
                {/* 다크 모드 전용: 행성 입체감 그라데이션 */}
                {isDark ? (
                    <radialGradient id="planetGradient" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="70%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#020617" />
                    </radialGradient>
                ) : (
                    /* 라이트 모드: 인디고 계열 행성 */
                    <radialGradient id="planetGradient" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="60%" stopColor="#4338ca" />
                        <stop offset="100%" stopColor="#312e81" />
                    </radialGradient>
                )}

                {/* 다크 모드 전용: 형광 글로우 필터 */}
                {isDark && (
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                )}

                {/* 다크 모드 전용: 별 반짝임 필터 */}
                {isDark && (
                    <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}

                {/* 다크 모드 전용: 궤도 경로 */}
                {isDark && (
                    <path
                        id="orbitPath"
                        d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                    />
                )}
            </defs>

            {/* ─── 다크 모드 전용: 궤도 + 소행성 ──────────────────────────── */}
            {isDark && (
                <>
                    {/* 궤도 뒷부분 */}
                    <path
                        d={`M ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                        stroke="#4ade80"
                        strokeWidth={s * 0.02}
                        strokeLinecap="round"
                        opacity="0.25"
                        filter="url(#neonGlow)"
                    />
                </>
            )}

            {/* ─── 행성 본체 (다크/라이트 공통) ─────────────────────────── */}
            <circle
                cx={planetCx}
                cy={planetCy}
                r={planetR}
                fill="url(#planetGradient)"
                stroke={isDark ? "#4ade80" : "#818cf8"}
                strokeWidth={s * 0.035}
                filter={isDark ? "url(#neonGlow)" : undefined}
            />

            {/* ─── 다크 모드 전용: 궤도 앞부분 + 장식 + 소행성 ──────────── */}
            {isDark && (
                <>
                    {/* 궤도 앞부분 */}
                    <path
                        d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY}`}
                        stroke="#4ade80"
                        strokeWidth={s * 0.035}
                        strokeLinecap="round"
                        filter="url(#neonGlow)"
                    />

                    {/* 이중 궤도 장식 */}
                    <path
                        d={`M ${startX + (endX-startX)*0.1},${startY + (endY-startY)*0.1} A ${orbitRx * 0.9} ${orbitRy * 0.7} ${orbitRotation} 0 0 ${endX - (endX-startX)*0.1},${endY - (endY-startY)*0.1}`}
                        stroke="#4ade80"
                        strokeWidth={s * 0.01}
                        strokeLinecap="round"
                        opacity="0.4"
                    />

                    {/* 소행성 */}
                    <g>
                        <circle r={s * 0.045} fill="#ffffff" filter="url(#starGlow)">
                            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                                <mpath href="#orbitPath" />
                            </animateMotion>
                            <animate
                                attributeName="opacity"
                                values="1; 1; 0.4; 0.4; 0; 0; 0.4; 0.4; 1"
                                keyTimes="0; 0.45; 0.5; 0.64; 0.68; 0.82; 0.86; 0.95; 1"
                                dur="6s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="r"
                                values={`${s * 0.045}; ${s * 0.045}; ${s * 0.035}; ${s * 0.035}; ${s * 0.03}; ${s * 0.03}; ${s * 0.035}; ${s * 0.035}; ${s * 0.045}`}
                                keyTimes="0; 0.45; 0.5; 0.64; 0.68; 0.82; 0.86; 0.95; 1"
                                dur="6s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </g>
                </>
            )}
        </svg>
    )
}
