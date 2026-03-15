"use client"

interface PlanetAvatarProps {
    size?: number
}

export default function PlanetAvatar({ size = 140 }: PlanetAvatarProps) {
    const s = size
    const cx = s / 2
    const cy = s / 2
    
    // 행성 및 궤도 비율
    const planetR = s * 0.28
    const orbitRx = s * 0.42
    const orbitRy = s * 0.14
    const orbitRotation = -15 // 기울기 (degrees)

    // 궤도 경로를 위한 정확한 좌표 계산 (기울기 반영)
    // 주요 축의 양 끝점 (startX, startY) -> (endX, endY)
    const rad = (orbitRotation * Math.PI) / 180
    const xOffset = orbitRx * Math.cos(rad)
    const yOffset = orbitRx * Math.sin(rad)
    
    const startX = cx - xOffset
    const startY = cy - yOffset
    const endX = cx + xOffset
    const endY = cy + yOffset

    // 별 데이터 (배경 장식)
    const stars = [
        { x: 0.15, y: 0.2, r: 1, delay: "0s" },
        { x: 0.85, y: 0.15, r: 1.2, delay: "0.5s" },
        { x: 0.1, y: 0.75, r: 0.8, delay: "1.2s" },
        { x: 0.9, y: 0.8, r: 1.1, delay: "0.8s" },
        { x: 0.4, y: 0.05, r: 0.7, delay: "2s" },
        { x: 0.6, y: 0.95, r: 0.9, delay: "1.5s" },
    ]

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
                
                {/* 전체 궤도 경로 (소행성 이동용) */}
                <path
                    id="orbitPath"
                    d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 1 0 ${endX},${endY} A ${orbitRx} ${orbitRy} ${orbitRotation} 1 0 ${startX},${startY}`}
                />
            </defs>

            {/* 배경 별 */}
            {stars.map((star, i) => (
                <circle
                    key={i}
                    cx={s * star.x}
                    cy={s * star.y}
                    r={star.r}
                    fill="#4ade80"
                    opacity="0.4"
                    filter="url(#starGlow)"
                >
                    <animate
                        attributeName="opacity"
                        values="0.2;0.8;0.2"
                        dur="3s"
                        begin={star.delay}
                        repeatCount="indefinite"
                    />
                </circle>
            ))}

            {/* 궤도 뒷부분 (행성 뒤로 숨음) */}
            <path
                d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 0 1 ${endX},${endY}`}
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
                fill="url(#planetGradient)"
                stroke="#4ade80"
                strokeWidth={s * 0.035}
                filter="url(#neonGlow)"
            />

            {/* 궤도 앞부분 (행성 앞으로 나옴) */}
            <path
                d={`M ${startX},${startY} A ${orbitRx} ${orbitRy} ${orbitRotation} 1 0 ${endX},${endY}`}
                stroke="#4ade80"
                strokeWidth={s * 0.035}
                strokeLinecap="round"
                filter="url(#neonGlow)"
            />
            
            {/* 이중 궤도 장식 */}
            <path
                d={`M ${startX + (endX-startX)*0.1},${startY + (endY-startY)*0.1} A ${orbitRx * 0.9} ${orbitRy * 0.7} ${orbitRotation} 1 0 ${endX - (endX-startX)*0.1},${endY - (endY-startY)*0.1}`}
                stroke="#4ade80"
                strokeWidth={s * 0.012}
                strokeLinecap="round"
                opacity="0.4"
            />

            {/* 소행성 */}
            <g filter="url(#starGlow)">
                <circle r={s * 0.045} fill="#ffffff">
                    <animateMotion
                        dur="5s"
                        repeatCount="indefinite"
                        rotate="auto"
                    >
                        <mpath href="#orbitPath" />
                    </animateMotion>
                </circle>
                {/* 소행성 잔상 */}
                <circle r={s * 0.035} fill="#4ade80" opacity="0.6">
                    <animateMotion
                        dur="5s"
                        begin="-0.1s"
                        repeatCount="indefinite"
                        rotate="auto"
                    >
                        <mpath href="#orbitPath" />
                    </animateMotion>
                </circle>
            </g>
        </svg>
    )
}
