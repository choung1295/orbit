"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Bot, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    created_at: string
}

interface ChatWindowProps {
    conversationId: string | null
    onConversationCreated: (id: string) => void
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user"

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-[#232a35]">
                {isUser ? (
                    <User className="w-4 h-4 text-indigo-300" />
                ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                )}
            </div>

            <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser
                    ? "bg-indigo-600/20 border border-indigo-500/20 text-[#f0f0f5]"
                    : "bg-[#1a1a1f] border border-[#2a2a35] text-[#c0c0c8]"
                    }`}
            >
                {message.content}
            </div>
        </div>
    )
}

export default function ChatWindow({
    conversationId,
    onConversationCreated,
}: ChatWindowProps) {
    const supabase = createClient()

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const bottomRef = useRef<HTMLDivElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        if (!conversationId) {
            setMessages([])
            return
        }

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true })

            if (error) {
                console.error("메시지 불러오기 실패:", error)
                return
            }

            if (data) {
                setMessages(data as Message[])
            }
        }

        fetchMessages()
    }, [conversationId, supabase])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading])
    const handleSend = async () => {
        if (loading) return

        const cleaned = input.trim()

        if (cleaned.length < 2) {
            alert("메시지는 2글자 이상 입력해 주세요.")
            return
        }

        const repeatedCharPattern = /(.)\1{7,}/
        if (repeatedCharPattern.test(cleaned)) {
            alert("반복 입력이 감지되어 전송을 막았습니다.")
            return
        }

        const content = cleaned

        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.error("사용자 확인 실패:", authError)
            return
        }

        const user = authData.user
        if (!user) return

        setInput("")
        setLoading(true)

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
        }

        let currentConversationId = conversationId

        try {
            // 1) 새 대화가 없으면 먼저 생성
            if (!currentConversationId) {
                const { data: newConv, error: convError } = await supabase
                    .from("conversations")
                    .insert({
                        user_id: user.id,
                        title: content.slice(0, 30),
                    })
                    .select()
                    .single()

                if (convError) {
                    console.error("대화 생성 실패:", convError)
                    setLoading(false)
                    return
                }

                currentConversationId = newConv.id
                onConversationCreated(newConv.id)
            }

            // 2) 사용자 메시지 저장
            const { data: userMsg, error: userMsgError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: currentConversationId,
                    user_id: user.id,
                    role: "user",
                    content,
                })
                .select()
                .single()

            if (userMsgError) {
                console.error("사용자 메시지 저장 실패:", userMsgError)
                setLoading(false)
                return
            }

            if (userMsg) {
                setMessages((prev) => [...prev, userMsg as Message])
            }

            // 3) OpenAI 호출
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: content,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                console.error("AI 호출 실패:", data)
                const errorText =
                    data?.error || "AI 응답 중 오류가 발생했습니다."

                const { data: aiErrorMsg, error: aiErrorInsertError } = await supabase
                    .from("messages")
                    .insert({
                        conversation_id: currentConversationId,
                        user_id: user.id,
                        role: "assistant",
                        content: errorText,
                    })
                    .select()
                    .single()

                if (!aiErrorInsertError && aiErrorMsg) {
                    setMessages((prev) => [...prev, aiErrorMsg as Message])
                }

                setLoading(false)
                return
            }

            const aiContent =
                typeof data?.answer === "string" && data.answer.trim()
                    ? data.answer
                    : "응답이 비어 있습니다."

            // 4) AI 메시지 저장
            const { data: aiMsg, error: aiMsgError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: currentConversationId,
                    user_id: user.id,
                    role: "assistant",
                    content: aiContent,
                })
                .select()
                .single()

            if (aiMsgError) {
                console.error("AI 메시지 저장 실패:", aiMsgError)
                setLoading(false)
                return
            }

            if (aiMsg) {
                setMessages((prev) => [...prev, aiMsg as Message])
            }
        } catch (error) {
            console.error("handleSend 오류:", error)

            if (currentConversationId) {
                const { data: aiErrorMsg } = await supabase
                    .from("messages")
                    .insert({
                        conversation_id: currentConversationId,
                        user_id: user.id,
                        role: "assistant",
                        content: "AI 응답 중 예기치 않은 오류가 발생했습니다.",
                    })
                    .select()
                    .single()

                if (aiErrorMsg) {
                    setMessages((prev) => [...prev, aiErrorMsg as Message])
                }
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
                            <Bot className="w-10 h-10 text-indigo-400/40" />
                            <p className="text-[#606070] text-sm">
                                무엇을 도와드릴까요? 메시지를 입력해보세요.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))
                    )}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#232a35] flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>

                            <div className="px-4 py-3 rounded-2xl bg-[#1a1a1f] border border-[#2a2a35]">
                                <div className="flex gap-1.5 items-center">
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
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1a1a1f] border border-[#2a2a35]">
                        <textarea
                            ref={textareaRef}
                            placeholder="메시지를 입력하세요... (Shift+Enter로 줄 바꿈)"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value)
                                e.target.style.height = "auto"
                                e.target.style.height = `${e.target.scrollHeight}px`
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            rows={1}
                            className="flex-1 bg-transparent text-sm text-[#f0f0f5] placeholder:text-[#606070] resize-none outline-none max-h-40"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    <p className="text-center text-xs text-[#404450] mt-3">
                        Orbit AI는 실수를 할 수 있습니다. 중요한 내용은 직접 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    )
}