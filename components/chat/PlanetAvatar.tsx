"use client"

interface PlanetAvatarProps {
    size?: number
}

export default function PlanetAvatar({ size = 64 }: PlanetAvatarProps) {
    const s = size
    const cx = s / 2
    const cy = s / 2
    
    // 행성 크기
    const planetR = s * 0.3
    
    // 궤도(링) 크기
    const orbitRx = s * 0.45
    const orbitRy = s * 0.15
    const orbitRotation = -20 // 약간 기울어짐

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
                {/* 형광색 글로우 효과 */}
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* 궤도 경로 정의 */}
                <path
                    id="orbitPath"
                    d={`M ${cx - orbitRx},${cy} a ${orbitRx},${orbitRy} ${orbitRotation} 1,0 ${orbitRx * 2},0 a ${orbitRx},${orbitRy} ${orbitRotation} 1,0 -${orbitRx * 2},0`}
                />
            </defs>

            {/* 궤도 뒷부분 (행성 뒤로 숨는 느낌을 위해 행성보다 먼저 그림) */}
            <path
                d={`M ${cx - orbitRx},${cy} a ${orbitRx},${orbitRy} ${orbitRotation} 0,1 ${orbitRx * 2},0`}
                stroke="#4ade80"
                strokeWidth={s * 0.02}
                strokeLinecap="round"
                opacity="0.3"
                filter="url(#neonGlow)"
            />

            {/* 행성 본체 */}
            <circle
                cx={cx}
                cy={cy}
                r={planetR}
                stroke="#4ade80"
                strokeWidth={s * 0.04}
                fill="#0f172a"
                filter="url(#neonGlow)"
            />

            {/* 궤도 앞부분 */}
            <path
                d={`M ${cx - orbitRx},${cy} a ${orbitRx},${orbitRy} ${orbitRotation} 1,1 ${orbitRx * 2},0`}
                stroke="#4ade80"
                strokeWidth={s * 0.03}
                strokeLinecap="round"
                filter="url(#neonGlow)"
            />

            {/* 소행성 (흰색 원) */}
            <circle r={s * 0.04} fill="#ffffff" filter="url(#neonGlow)">
                <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    rotate="auto"
                >
                    <mpath href="#orbitPath" />
                </animateMotion>
            </circle>
        </svg>
    )
}
