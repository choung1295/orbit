"use client"

interface PlanetAvatarProps {
    size?: number
}

export default function PlanetAvatar({ size = 140 }: PlanetAvatarProps) {
    const s = size
    const cx = s / 2
    const cy = s / 2
    
    // 행성 및 궤도 비율
    const planetR = s * 0.24
    const orbitRx = s * 0.42
    const orbitRy = s * 0.14
    const orbitRotation = -15 // 기울기 (degrees)

    // 궤도 경로를 위한 정확한 좌표 계산 (기울기 반영)
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
            style={{ overflow: "visible" }}
        >
            <defs>
                {/* 행성 입체감을 위한 그라데이션 */}
                <radialGradient id="planetGradient" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="70%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                </radialGradient>

                {/* 형광색 글로우 필터 */}
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* 별 반짝임 필터 */}
                <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                
                {/* 전체 궤도 경로 (소행성 이동용) - Front then Back */}
                <path
                    id="orbitPath"
                    d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                />
            </defs>


            {/* 궤도 뒷부분 (행성 뒤) */}
            <path
                d={`M ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${startX},${startY}`}
                stroke="#4ade80"
                strokeWidth={s * 0.02}
                strokeLinecap="round"
                opacity="0.25"
                filter="url(#neonGlow)"
            />

            {/* 행성 본체 */}
            <circle
                cx={cx}
                cy={cy}
                r={planetR}
                fill="url(#planetGradient)"
                stroke="#4ade80"
                strokeWidth={s * 0.035}
                filter="url(#neonGlow)"
            />

            {/* 궤도 앞부분 (행성 앞) */}
            <path
                d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 0 ${endX},${endY}`}
                stroke="#4ade80"
                strokeWidth={s * 0.035}
                strokeLinecap="round"
                filter="url(#neonGlow)"
            />
            
            {/* 이중 궤도 장식 (앞부분만) */}
            <path
                d={`M ${startX + (endX-startX)*0.1},${startY + (endY-startY)*0.1} A ${orbitRx * 0.9} ${orbitRy * 0.7} ${orbitRotation} 0 0 ${endX - (endX-startX)*0.1},${endY - (endY-startY)*0.1}`}
                stroke="#4ade80"
                strokeWidth={s * 0.01}
                strokeLinecap="round"
                opacity="0.4"
            />

            {/* 소행성 (깨끗한 흰색 구체, 행성 뒤에서 가려짐) */}
            <g>
                <circle r={s * 0.045} fill="#ffffff" filter="url(#starGlow)">
                    <animateMotion
                        dur="6s"
                        repeatCount="indefinite"
                        rotate="auto"
                    >
                        <mpath href="#orbitPath" />
                    </animateMotion>
                    {/* 행성 뒤로 갈 때 투명도 조절로 숨김 효과 (0.5~1.0 구간이 뒷부분) */}
                    <animate
                        attributeName="opacity"
                        values="1; 1; 0; 0; 1"
                        keyTimes="0; 0.48; 0.52; 0.98; 1"
                        dur="6s"
                        repeatCount="indefinite"
                    />
                </circle>
            </g>
        </svg>
    )
}
