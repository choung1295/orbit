"use client"

import { useId } from "react"

interface PlanetAvatarProps {
    size?: number
    isDark?: boolean
}

export default function PlanetAvatar({ size = 140, isDark = true }: PlanetAvatarProps) {
    const uid = useId().replace(/:/g, "")
    const s = size
    const cx = s / 2
    const cy = s / 2

    const planetR = size * 0.233
    const planetCx = cx + size * 0.02
    const planetCy = cy + size * 0.04
    const orbitRx = size * 0.42
    const orbitRy = size * 0.14
    const orbitRotation = -15

    const rad = (orbitRotation * Math.PI) / 180
    const xOffset = orbitRx * Math.cos(rad)
    const yOffset = orbitRx * Math.sin(rad)

    const startX = cx - xOffset
    const startY = cy - yOffset
    const endX = cx + xOffset
    const endY = cy + yOffset

    const orbitColor   = "#4ade80"
    const asteroidFill = isDark ? "#ffffff" : "#a855f7"
    const p0 = "#1e293b"
    const p1 = "#0f172a"
    const p2 = "#020617"

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
                <radialGradient id={`planetGradient-${uid}`} cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
                    <stop offset="0%"   stopColor={p0} />
                    <stop offset="70%"  stopColor={p1} />
                    <stop offset="100%" stopColor={p2} />
                </radialGradient>

                <filter id={`neonGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                <filter id={`starGlow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <path
                    id={`orbitPath-${uid}`}
                    d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                />
            </defs>

            {/* 궤도 뒷부분 */}
            <path
                d={`M ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                stroke={orbitColor}
                strokeWidth={size * 0.02}
                strokeLinecap="round"
                opacity="0.35"
            />

            {/* 행성 본체 */}
            <circle
                cx={planetCx}
                cy={planetCy}
                r={planetR}
                fill={`url(#planetGradient-${uid})`}
                stroke={orbitColor}
                strokeWidth={size * 0.035}
                filter={`url(#neonGlow-${uid})`}
            />

            {/* 궤도 앞부분 */}
            <path
                d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY}`}
                stroke={orbitColor}
                strokeWidth={size * 0.035}
                strokeLinecap="round"
                filter={`url(#neonGlow-${uid})`}
            />

            {/* 이중 궤도 장식 */}
            <path
                d={`M ${startX + (endX-startX)*0.1},${startY + (endY-startY)*0.1} A ${orbitRx * 0.9} ${orbitRy * 0.7} ${orbitRotation} 0 0 ${endX - (endX-startX)*0.1},${endY - (endY-startY)*0.1}`}
                stroke={orbitColor}
                strokeWidth={size * 0.01}
                strokeLinecap="round"
                opacity="0.4"
            />

            {/* 소행성 */}
            <circle r={size * 0.045} fill={asteroidFill} filter={`url(#starGlow-${uid})`}>
                <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                    <mpath href={`#orbitPath-${uid}`} />
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
                    values={`${size*0.045}; ${size*0.045}; ${size*0.035}; ${size*0.035}; ${size*0.03}; ${size*0.03}; ${size*0.035}; ${size*0.035}; ${size*0.045}`}
                    keyTimes="0; 0.45; 0.5; 0.64; 0.68; 0.82; 0.86; 0.95; 1"
                    dur="6s"
                    repeatCount="indefinite"
                />
            </circle>
        </svg>
    )
}