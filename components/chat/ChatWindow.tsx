'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: Date
}

const DUMMY_MESSAGES: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: '안녕하세요! Orbit AI입니다. 무엇을 도와드릴까요?',
        createdAt: new Date(),
    },
    {
        id: '2',
        role: 'user',
        content: 'Next.js에서 서버 컴포넌트와 클라이언트 컴포넌트의 차이를 설명해줘.',
        createdAt: new Date(),
    },
    {
        id: '3',
        role: 'assistant',
        content: 'Next.js App Router에서는 두 가지 렌더링 방식이 있습니다:\n\n**서버 컴포넌트**\n- 기본값으로 서버에서 렌더링됩니다.\n- 데이터베이스, 파일 시스템 등에 직접 접근 가능\n\n**클라이언트 컴포넌트**\n- `"use client"` 지시어가 필요합니다.\n- useState, useEffect 등 훅 사용 가능',
        createdAt: new Date(),
    },
]

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user'
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-indigo-500/20' : 'bg-[#2a2a3a]'
                    }`}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-indigo-300" />
                ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                )}
            </div>
            <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? 'bg-indigo-600/20 border border-indigo-500/20 text-[#f0f0f5]'
                        : 'bg-[#1a1a1f] border border-[#2a2a35] text-[#e0e0e8]'
                    }`}
            >
                {message.content}
            </div>
        </div>
    )
}

export default function ChatWindow() {
    const [messages, setMessages] = useState<Message[]>(DUMMY_MESSAGES)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            createdAt: new Date(),
        }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        setTimeout(() => {
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '현재 AI API가 연결되지 않았습니다. Supabase와 AI API를 연결하면 실제 응답을 받을 수 있어요.',
                createdAt: new Date(),
            }
            setMessages((prev) => [...prev, assistantMsg])
            setLoading(false)
        }, 1000)
    }

    return (
        <div className="flex flex-col h-full">

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto py-8">
                <div className="max-w-3xl mx-auto px-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-32">
                            <Bot className="w-10 h-10 text-indigo-400/40" />
                            <p className="text-[#606070] text-sm">무엇이든 물어보세요.</p>
                        </div>
                    ) : (
                        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                    )}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2a2a3a] flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-[#1a1a1f] border border-[#2a2a35]">
                                <div className="flex gap-1.5 items-center h-5">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* 입력창 */}
            <div className="py-6">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-end gap-3 px-5 py-4 bg-[#1a1a1f] border border-[#3a3a45] hover:border-[#5a5a65] rounded-2xl transition-colors shadow-lg">
                        <textarea
                            className="flex-1 bg-transparent text-[#f0f0f5] text-sm resize-none outline-none placeholder-[#505060] min-h-[48px] max-h-[160px] py-1"
                            placeholder="메시지를 입력하세요... (Shift+Enter로 줄 바꿈)"
                            rows={2}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value)
                                e.target.style.height = 'auto'
                                e.target.style.height = `${e.target.scrollHeight}px`
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                            aria-label="메시지 전송"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-[#404050] mt-3">
                        Orbit AI는 실수를 할 수 있습니다. 중요한 내용은 직접 확인하세요.
                    </p>
                </div>
            </div>

        </div>
    )
}