'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
}

interface ChatWindowProps {
    conversationId: string | null
    onConversationCreated: (id: string) => void
}

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

export default function ChatWindow({ conversationId, onConversationCreated }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const supabase = createClient()

    // conversationId 바뀌면 메시지 다시 불러오기
    useEffect(() => {
        if (!conversationId) {
            setMessages([])
            return
        }

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
            if (data) setMessages(data)
        }

        fetchMessages()
    }, [conversationId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const content = input.trim()
        setInput('')
        setLoading(true)

        let currentConversationId = conversationId

        // 대화방 없으면 새로 생성
        if (!currentConversationId) {
            const { data: newConv } = await supabase
                .from('conversations')
                .insert({ user_id: user.id, title: content.slice(0, 30) })
                .select()
                .single()
            if (newConv) {
                currentConversationId = newConv.id
                onConversationCreated(newConv.id)
            }
        }

        // 사용자 메시지 저장
        const { data: userMsg } = await supabase
            .from('messages')
            .insert({ conversation_id: currentConversationId, user_id: user.id, role: 'user', content })
            .select()
            .single()

        if (userMsg) setMessages((prev) => [...prev, userMsg])

        // AI 응답 (mock)
        setTimeout(async () => {
            const aiContent = '현재 AI API가 연결되지 않았습니다. Supabase와 AI API를 연결하면 실제 응답을 받을 수 있어요.'

            const { data: aiMsg } = await supabase
                .from('messages')
                .insert({ conversation_id: currentConversationId, user_id: user.id, role: 'assistant', content: aiContent })
                .select()
                .single()

            if (aiMsg) setMessages((prev) => [...prev, aiMsg])
            setLoading(false)
        }, 1000)
    }

    return (
        <div className="flex flex-col h-full">
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