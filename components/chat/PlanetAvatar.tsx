"use client"

interface PlanetAvatarProps {
    size?: number
    isDark?: boolean
}

export default function PlanetAvatar({ size = 140, isDark = true }: PlanetAvatarProps) {
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

    // 다크/라이트 색상만 교체
    const orbitColor   = isDark ? "#4ade80" : "#6366f1"
    const asteroidFill = isDark ? "#ffffff"  : "#4338ca"
    const p0 = isDark ? "#1e293b" : "#6366f1"
    const p1 = isDark ? "#0f172a" : "#4338ca"
    const p2 = isDark ? "#020617" : "#312e81"

    return (
        <svg
            width={s}
            height={s}
            viewBox={`0 0 ${s} ${s}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
        >
            <defs>
                <radialGradient id="planetGradient" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
                    <stop offset="0%"   stopColor={p0} />
                    <stop offset="70%"  stopColor={p1} />
                    <stop offset="100%" stopColor={p2} />
                </radialGradient>

                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <path
                    id="orbitPath"
                    d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                />
            </defs>

            {/* 궤도 뒷부분 */}
            <path
                d={`M ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                stroke={orbitColor}
                strokeWidth={s * 0.02}
                strokeLinecap="round"
                opacity="0.25"
                filter="url(#neonGlow)"
            />

            {/* 행성 본체 */}
            <circle
                cx={planetCx}
                cy={planetCy}
                r={planetR}
                fill="url(#planetGradient)"
                stroke={orbitColor}
                strokeWidth={s * 0.035}
                filter="url(#neonGlow)"
            />

            {/* 궤도 앞부분 */}
            <path
                d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY}`}
                stroke={orbitColor}
                strokeWidth={s * 0.035}
                strokeLinecap="round"
                filter="url(#neonGlow)"
            />

            {/* 이중 궤도 장식 */}
            <path
                d={`M ${startX + (endX-startX)*0.1},${startY + (endY-startY)*0.1} A ${orbitRx * 0.9} ${orbitRy * 0.7} ${orbitRotation} 0 0 ${endX - (endX-startX)*0.1},${endY - (endY-startY)*0.1}`}
                stroke={orbitColor}
                strokeWidth={s * 0.01}
                strokeLinecap="round"
                opacity="0.4"
            />

            {/* 소행성 */}
            <circle r={s * 0.045} fill={asteroidFill} filter="url(#starGlow)">
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
                    values={`${s*0.045}; ${s*0.045}; ${s*0.035}; ${s*0.035}; ${s*0.03}; ${s*0.03}; ${s*0.035}; ${s*0.035}; ${s*0.045}`}
                    keyTimes="0; 0.45; 0.5; 0.64; 0.68; 0.82; 0.86; 0.95; 1"
                    dur="6s"
                    repeatCount="indefinite"
                />
            </circle>
        </svg>
    )
}
