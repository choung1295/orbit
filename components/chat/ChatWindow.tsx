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
        content:
            'Next.js 13+의 App Router에서는 두 가지 렌더링 방식이 있습니다:\n\n**서버 컴포넌트 (Server Components)**\n- 서버에서만 실행되며, 번들 크기에 포함되지 않습니다\n- 데이터베이스, 파일 시스템에 직접 접근 가능\n- `useState`, `useEffect` 등 React 훅 사용 불가\n\n**클라이언트 컴포넌트 (Client Components)**\n- `"use client"` 디렉티브로 선언\n- 브라우저에서 실행되며 상호작용 가능\n- React 훅, 브라우저 API 사용 가능',
        createdAt: new Date(),
    },
]

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user'
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-[#22222a] border border-[#35353f]'
                    }`}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                )}
            </div>
            <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? 'bg-indigo-600/20 border border-indigo-500/20 text-[#f0f0f5]'
                        : 'bg-[#1a1a1f] border border-[#2a2a35] text-[#e0e0ea]'
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
    const bottomRef = useRef<HTMLDivElement>(null)

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

        // 시뮬레이션 응답 (AI API 연동 전 더미)
        setTimeout(() => {
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '현재 AI API가 연결되지 않았습니다. Supabase와 AI API를 연결하면 실제 응답을 받을 수 있습니다.',
                createdAt: new Date(),
            }
            setMessages((prev) => [...prev, assistantMsg])
            setLoading(false)
        }, 1000)
    }

    return (
        <div className="flex flex-col h-full">
            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#22222a] border border-[#35353f] flex items-center justify-center shrink-0">
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

            {/* 입력창 */}
            <div className="px-4 pb-4">
                <div className="flex items-end gap-3 p-3 bg-[#1a1a1f] border border-[#35353f] rounded-2xl focus-within:border-indigo-500/50 transition-colors">
                    <textarea
                        className="flex-1 bg-transparent text-[#f0f0f5] text-sm resize-none outline-none placeholder:text-[#606070] max-h-32 py-1"
                        placeholder="메시지를 입력하세요... (Shift+Enter로 줄 바꿈)"
                        rows={1}
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
                        className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                        aria-label="메시지 전송"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
                <p className="text-center text-xs text-[#606070] mt-2">
                    Orbit AI는 실수를 할 수 있습니다. 중요한 내용은 직접 확인하세요.
                </p>
            </div>
        </div>
    )
}
