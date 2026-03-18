"use client"

import { useRef, useEffect, useState } from "react"
import { Message } from "./useChat"
import { ThinkingStatus } from "./useChat"
import MessageBubble from "./MessageBubble"
import PlanetAvatar from "./PlanetAvatar"

interface MessageListProps {
    messages: Message[]
    loading: boolean
    streamingText: string
    thinkingStatus: ThinkingStatus
    onRetry: (content: string) => void
    onRegenerate: (index: number) => void
}

const ANALYZING_LABELS = [
    "데이터 분석 중...",
    "답변 정리 중...",
    "최적의 답변 생성 중...",
]

function ThinkingIndicator({ thinkingStatus }: { thinkingStatus: ThinkingStatus }) {
    const [analyzingIdx, setAnalyzingIdx] = useState(0)
    const [visible, setVisible] = useState(true)

    // "analyzing" 상태에서 텍스트 순환 (fade 효과)
    useEffect(() => {
        if (thinkingStatus !== "analyzing") return
        const interval = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setAnalyzingIdx((prev) => (prev + 1) % ANALYZING_LABELS.length)
                setVisible(true)
            }, 300)
        }, 2200)
        return () => clearInterval(interval)
    }, [thinkingStatus])

    // 상태 변경 시 인덱스 리셋
    useEffect(() => {
        if (thinkingStatus === "analyzing") {
            setAnalyzingIdx(0)
            setVisible(true)
        }
    }, [thinkingStatus])

    return (
        <div
            className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5"
            style={{ backgroundColor: '#16161e', border: '1px solid #22222e' }}
        >
            {/* 점 3개 - 항상 표시 */}
            <div className="flex gap-1.5 items-center shrink-0">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>

            {/* 텍스트 레이블 - thinking 이상에서만 표시 */}
            {thinkingStatus !== "idle" && (
                <span
                    className="text-xs font-medium transition-opacity duration-300"
                    style={{
                        color: thinkingStatus === "analyzing" ? '#a78bfa' : '#6366f1',
                        opacity: visible ? 1 : 0,
                    }}
                >
                    {thinkingStatus === "thinking"
                        ? "Thinking..."
                        : ANALYZING_LABELS[analyzingIdx]}
                </span>
            )}
        </div>
    )
}

export default function MessageList({ messages, loading, streamingText, thinkingStatus, onRetry, onRegenerate }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading, streamingText])

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-4">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-start min-h-[65vh] pt-52 gap-3 text-center px-6">
                    <div className="transform hover:scale-110 transition-transform duration-700 ease-in-out">
                        <PlanetAvatar size={72} />
                    </div>
                    <div className="transition-all duration-700 delay-100 ease-out">
                        <h1 className="text-xl md:text-2xl font-bold mb-3 tracking-tight"
                            style={{
                                background: 'linear-gradient(to bottom, #ffffff, #a0a0b0)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                            어떤 도움이 필요하신가요?
                        </h1>
                        <p className="text-[#606070] text-xs md:text-sm font-medium">
                            Orbit 비서가 항상 대기하고 있습니다
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {messages.map((msg, idx) => (
                        <div key={msg.id}>
                            <MessageBubble
                                message={msg}
                                onRetry={onRetry}
                                onRegenerate={() => onRegenerate(idx)}
                            />
                        </div>
                    ))}

                    {/* 스트리밍 중 텍스트 표시 */}
                    {loading && streamingText && (
                        <div className="flex flex-row items-start gap-2 w-full">
                            <div
                                className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-[1.7] whitespace-pre-wrap break-words"
                                style={{ backgroundColor: '#16161e', border: '1px solid #22222e', color: '#ceceda' }}
                            >
                                {streamingText}
                            </div>
                        </div>
                    )}

                    {/* 응답 대기 중 단계별 상태 표시 */}
                    {loading && !streamingText && (
                        <div className="flex flex-row items-start gap-2 w-full">
                            <ThinkingIndicator thinkingStatus={thinkingStatus} />
                        </div>
                    )}
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    )
}
