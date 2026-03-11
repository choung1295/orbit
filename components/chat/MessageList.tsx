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
        <div className="max-w-4xl mx-auto w-full px-6 py-8">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[#e0e0e8] text-base font-medium mb-1">무엇을 도와드릴까요?</p>
                        <p className="text-[#505060] text-sm">메시지를 입력해 대화를 시작하세요.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.map((msg, idx) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            onRetry={onRetry}
                            onRegenerate={() => onRegenerate(idx)}
                        />
                    ))}

                    {loading && streamingText && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 text-sm leading-7 text-[#d0d0dc] whitespace-pre-wrap break-words pt-1">
                                {streamingText}
                            </div>
                        </div>
                    )}

                    {loading && !streamingText && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex gap-1.5 items-center pt-3">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    )
}