"use client"

import { useRef, useEffect } from "react"
import { Bot } from "lucide-react"
import { Message } from "./useChat"
import MessageBubble from "./MessageBubble"

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
        <div className="max-w-3xl mx-auto w-full px-4 py-8">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: '#16161e', border: '1px solid #22222e' }}>
                        <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[#d0d0dc] text-sm font-medium mb-1">무엇을 도와드릴까요?</p>
                        <p className="text-[#404050] text-xs">메시지를 입력해 대화를 시작하세요.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    {messages.map((msg, idx) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            onRetry={onRetry}
                            onRegenerate={() => onRegenerate(idx)}
                        />
                    ))}

                    {loading && streamingText && (
                        <div className="flex gap-3.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div
                                className="flex-1 px-5 py-4 rounded-2xl rounded-tl-sm text-sm leading-[1.8] whitespace-pre-wrap break-words"
                                style={{ backgroundColor: '#16161e', border: '1px solid #22222e', color: '#ceceda' }}
                            >
                                {streamingText}
                            </div>
                        </div>
                    )}

                    {loading && !streamingText && (
                        <div className="flex gap-3.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div
                                className="px-5 py-4 rounded-2xl rounded-tl-sm"
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