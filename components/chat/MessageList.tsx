"use client"

import { useRef, useEffect } from "react"
import { Message } from "./useChat"
import MessageBubble from "./MessageBubble"
import PlanetAvatar from "./PlanetAvatar"

interface MessageListProps {
    messages: Message[]
    loading: boolean
    streamingText: string
    onRetry: (content: string) => void
    onRegenerate: (index: number) => void
}

export default function MessageList({ messages, loading, streamingText, onRetry, onRegenerate }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading, streamingText])

    return (
        <div className="max-w-3xl mx-auto w-full px-4 py-4">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8 text-center px-6">
                    <div className="transform hover:scale-110 transition-transform duration-700 ease-in-out">
                        <PlanetAvatar size={160} />
                    </div>
                    <div className="transition-all duration-700 delay-100 ease-out">
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" 
                            style={{ 
                                background: 'linear-gradient(to bottom, #ffffff, #a0a0b0)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                            무엇을 도와드릴까요?
                        </h1>
                        <p className="text-[#606070] text-sm md:text-lg font-medium max-w-sm mx-auto">
                            메시지를 입력해 대화를 시작하세요. <br className="hidden md:block" />
                            Orbit AI가 항상 곁에 있겠습니다.
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

                    {loading && streamingText && (
                        <div className="flex flex-row items-start gap-2 w-full">
                            {/* <div className="relative shrink-0 mt-1">
                                <DelphaiAvatar size={30} />
                            </div> */}
                            <div
                                className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-[1.7] whitespace-pre-wrap break-words"
                                style={{ backgroundColor: '#16161e', border: '1px solid #22222e', color: '#ceceda' }}
                            >
                                {streamingText}
                            </div>
                        </div>
                    )}

                    {loading && !streamingText && (
                        <div className="flex flex-row items-start gap-2 w-full">
                            {/* <div className="relative shrink-0 mt-1">
                                <DelphaiAvatar size={30} />
                            </div> */}
                            <div
                                className="px-4 py-3 rounded-2xl rounded-tl-sm"
                                style={{ backgroundColor: '#16161e', border: '1px solid #22222e' }}
                            >
                                <div className="flex gap-1.5 items-center">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    )
}