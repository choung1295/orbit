"use client"

interface DelphiAvatarProps {
    size?: number
}

export default function DelphiAvatar({ size = 32 }: DelphiAvatarProps) {
    const s = size
    const cx = s / 2
    const cy = s / 2
    const headR = s * 0.28
    const orbitRx = s * 0.44
    const orbitRy = s * 0.13
    const orbitY = cy + headR * 0.35

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
                <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="satGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <path
                    id={`orbitPath-${s}`}
                    d={`M ${cx - orbitRx} ${orbitY} A ${orbitRx} ${orbitRy} 0 1 1 ${cx + orbitRx} ${orbitY} A ${orbitRx} ${orbitRy} 0 1 1 ${cx - orbitRx} ${orbitY}`}
                />
            </defs>

            {/* 안테나 */}
            <line x1={cx} y1={cy - headR - s * 0.01} x2={cx} y2={cy - headR - s * 0.13} stroke="#7C3AED" strokeWidth={s * 0.04} strokeLinecap="round" />
            <circle cx={cx} cy={cy - headR - s * 0.16} r={s * 0.055} fill="#8B5CF6">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
            </circle>

            {/* 궤도 뒷부분 */}
            <path
                d={`M ${cx - orbitRx} ${orbitY} A ${orbitRx} ${orbitRy} 0 0 0 ${cx + orbitRx} ${orbitY}`}
                stroke="#6D28D9" strokeWidth={s * 0.035} strokeLinecap="round" fill="none" opacity="0.5"
            />

            {/* 로봇 머리 */}
            <circle cx={cx} cy={cy} r={headR} fill="#1e1a2e" stroke="#5B21B6" strokeWidth={s * 0.035} />

            {/* 눈 왼쪽 */}
            <circle cx={cx - headR * 0.35} cy={cy - headR * 0.05} r={headR * 0.22} fill="#a78bfa" filter="url(#eyeGlow)">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
            </circle>

            {/* 눈 오른쪽 */}
            <circle cx={cx + headR * 0.35} cy={cy - headR * 0.05} r={headR * 0.22} fill="#a78bfa" filter="url(#eyeGlow)">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" begin="0.3s" repeatCount="indefinite" />
            </circle>

            {/* 궤도 앞부분 */}
            <path
                d={`M ${cx - orbitRx} ${orbitY} A ${orbitRx} ${orbitRy} 0 0 1 ${cx + orbitRx} ${orbitY}`}
                stroke="#8B5CF6" strokeWidth={s * 0.04} strokeLinecap="round" fill="none"
            />

            {/* 위성 */}
            <circle r={s * 0.065} fill="#c4b5fd" filter="url(#satGlow)">
                <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
                    <mpath href={`#orbitPath-${s}`} />
                </animateMotion>
                <animate 
                    attributeName="opacity" 
                    values="1;0;1" 
                    keyTimes="0;0.5;1" 
                    calcMode="discrete" 
                    dur="3s" 
                    repeatCount="indefinite" 
                />
            </circle>
        </svg>
    )
}