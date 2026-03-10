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
        <div className="flex-1 overflow-y-auto px-2 py-4">
            <div className="w-full space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                        <Bot className="w-10 h-10 text-indigo-400/40" />
                        <p className="text-[#606070] text-sm">무엇을 도와드릴까요? 메시지를 입력해보세요.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            onRetry={onRetry}
                            onRegenerate={() => onRegenerate(idx)}
                        />
                    ))
                )}

                {loading && streamingText && (
                    <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#232a35] flex items-center justify-center shrink-0">
                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                        </div>
                        <div className="w-full px-4 py-3 rounded-2xl bg-[#1e1e26] border border-[#32323f] text-sm leading-relaxed whitespace-pre-wrap break-words text-[#d0d0d8]">
                            {streamingText}
                        </div>
                    </div>
                )}

                {loading && !streamingText && (
                    <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#232a35] flex items-center justify-center shrink-0">
                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-[#1e1e26] border border-[#32323f]">
                            <div className="flex gap-1.5 items-center">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    )
}