"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Send, Bot, User, Plus, Paperclip, Image, X, Mic, Square, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    created_at: string
    fileName?: string
}

interface ChatWindowProps {
    conversationId: string | null
    onConversationCreated: (id: string) => void
}

/* ────────────────────────────────────────
   음성 파형 애니메이션 컴포넌트
   (녹음 중 초록 원 안에 파형 표시)
──────────────────────────────────────── */
function VoiceWaveIcon() {
    return (
        <div className="flex items-center justify-center gap-[3px] w-5 h-5">
            {[0, 1, 2, 3].map((i) => (
                <span
                    key={i}
                    className="inline-block w-[3px] rounded-full bg-white"
                    style={{
                        animation: `voiceWave 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                    }}
                />
            ))}
        </div>
    )
}

/* ────────────────────────────────────────
   메시지 버블
──────────────────────────────────────── */
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user"
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            console.error("클립보드 복사 실패")
        }
    }

    return (
        <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-[#232a35]">
                {isUser ? (
                    <User className="w-4 h-4 text-indigo-300" />
                ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                )}
            </div>

            <div className="max-w-[75%] flex flex-col gap-1">
                <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser
                        ? "bg-indigo-600/20 border border-indigo-500/20 text-[#f0f0f5]"
                        : "bg-[#1a1a1f] border border-[#2a2a35] text-[#c0c0c8]"
                        }`}
                >
                    {message.fileName && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-xs text-indigo-300">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{message.fileName}</span>
                        </div>
                    )}
                    {message.content}
                </div>

                {/* 복사 버튼: 데스크탑 hover 시 표시, 모바일 항상 표시 */}
                <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <button
                        onClick={handleCopy}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a]"
                        aria-label="메시지 복사"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ────────────────────────────────────────
   메인 ChatWindow
──────────────────────────────────────── */
export default function ChatWindow({
    conversationId,
    onConversationCreated,
}: ChatWindowProps) {
    const supabase = createClient()

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [streamingText, setStreamingText] = useState("")

    // + 메뉴
    const [plusMenuOpen, setPlusMenuOpen] = useState(false)
    const plusMenuRef = useRef<HTMLDivElement | null>(null)

    // 파일 첨부
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // 중지
    const abortControllerRef = useRef<AbortController | null>(null)

    // 마이크
    const [isRecording, setIsRecording] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null)

    const bottomRef = useRef<HTMLDivElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    // ── 바깥 클릭 시 + 메뉴 닫기 ──
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setPlusMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    // ── 메시지 로드 ──
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

    // ── 자동 스크롤 ──
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading, streamingText])

    // ── 중지 핸들러 ──
    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort()
    }, [])

    // ── 마이크 ──
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            recognitionRef.current?.stop()
            setIsRecording(false)
            return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (!SpeechRecognitionAPI) {
            alert("이 브라우저에서는 음성 인식이 지원되지 않습니다.")
            return
        }

        const recognition = new SpeechRecognitionAPI()
        recognition.lang = "ko-KR"
        recognition.interimResults = true
        recognition.continuous = true

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let finalTranscript = ""
            let interimTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                } else {
                    interimTranscript += transcript
                }
            }

            if (finalTranscript) {
                setInput((prev) => prev + finalTranscript)
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error("음성 인식 오류:", event.error)
            setIsRecording(false)
        }

        recognition.onend = () => {
            setIsRecording(false)
        }

        recognitionRef.current = recognition
        recognition.start()
        setIsRecording(true)
    }, [isRecording])

    // ── 메시지 전송 (스트리밍) ──
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

        const attachedFileName = selectedFile?.name ?? null

        setInput("")
        setSelectedFile(null)
        setLoading(true)
        setStreamingText("")

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
        // 녹음 중이면 중지
        if (isRecording) {
            recognitionRef.current?.stop()
            setIsRecording(false)
        }

        let currentConversationId = conversationId
        const controller = new AbortController()
        abortControllerRef.current = controller

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
                const enrichedMsg: Message = {
                    ...(userMsg as Message),
                    ...(attachedFileName ? { fileName: attachedFileName } : {}),
                }
                setMessages((prev) => [...prev, enrichedMsg])
            }

            // 3) OpenAI 스트리밍 호출
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: content }),
                signal: controller.signal,
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                const errorText = errData?.error || "AI 응답 중 오류가 발생했습니다."

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

            // 스트리밍 읽기
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let accumulated = ""

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })
                    accumulated += chunk
                    setStreamingText(accumulated)
                }
            }

            const aiContent = accumulated.trim() || "응답이 비어 있습니다."

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
            // AbortError = 사용자가 중지 버튼 클릭
            if (error instanceof DOMException && error.name === "AbortError") {
                const partial = streamingText.trim()
                if (partial && currentConversationId) {
                    const { data: partialMsg } = await supabase
                        .from("messages")
                        .insert({
                            conversation_id: currentConversationId,
                            user_id: user.id,
                            role: "assistant",
                            content: partial + "\n\n_(응답이 중지되었습니다)_",
                        })
                        .select()
                        .single()
                    if (partialMsg) {
                        setMessages((prev) => [...prev, partialMsg as Message])
                    }
                }
            } else {
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
            }
        } finally {
            setLoading(false)
            setStreamingText("")
            abortControllerRef.current = null
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* 음성 파형 애니메이션 keyframes */}
            <style jsx>{`
                @keyframes voiceWave {
                    0% { height: 4px; }
                    100% { height: 16px; }
                }
            `}</style>

            {/* ── 메시지 영역 ── */}
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

                    {/* 스트리밍 중인 AI 응답 */}
                    {loading && streamingText && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#232a35] flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-[#202028] border border-[#3a3a4a] text-sm leading-relaxed whitespace-pre-wrap break-words text-[#c0c0c8]">
                                {streamingText}
                            </div>
                        </div>
                    )}

                    {/* 로딩 점 (아직 텍스트 도착 전) */}
                    {loading && !streamingText && (
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

            {/* ── 입력 영역 ── */}
            <div className="py-6">
                <div className="max-w-3xl mx-auto px-6">
                    {/* 파일 선택 미리보기 */}
                    {selectedFile && (
                        <div className="flex items-center gap-2 mb-2 px-4 py-2 rounded-xl bg-[#1a1a1f] border border-[#2a2a35] text-sm text-[#a0a0b0] animate-fade-in">
                            <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="truncate flex-1">{selectedFile.name}</span>
                            <button
                                onClick={() => {
                                    setSelectedFile(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ""
                                }}
                                className="p-1 rounded-md hover:bg-[#2a2a35] transition-colors"
                                aria-label="파일 제거"
                            >
                                <X className="w-3.5 h-3.5 text-[#606070] hover:text-[#f0f0f5]" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#1a1a1f] border border-[#2a2a35]">
                        {/* ── "+" 메뉴 ── */}
                        <div className="relative" ref={plusMenuRef}>
                            <button
                                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-[#606070] hover:text-[#f0f0f5] hover:bg-[#22222a] transition-colors shrink-0"
                                aria-label="첨부 메뉴"
                            >
                                <Plus className={`w-5 h-5 transition-transform duration-200 ${plusMenuOpen ? "rotate-45" : ""}`} />
                            </button>

                            {/* 팝업 메뉴 */}
                            {plusMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-56 py-2 rounded-xl bg-[#1e1e24] border border-[#2a2a35] shadow-2xl shadow-black/40 animate-fade-in z-50">
                                    <button
                                        onClick={() => {
                                            fileInputRef.current?.click()
                                            setPlusMenuOpen(false)
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#c0c0c8] hover:bg-[#2a2a35] transition-colors"
                                    >
                                        <Image className="w-4 h-4 text-indigo-400" />
                                        사진 및 파일 추가
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 숨겨진 파일 입력 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                setSelectedFile(file)
                            }}
                        />

                        {/* ── 텍스트 입력 ── */}
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
                            className="flex-1 bg-transparent text-sm text-[#f0f0f5] placeholder:text-[#606070] resize-none outline-none max-h-40 pr-2"
                        />

                        {/* ── 마이크 버튼 ── */}
                        <button
                            onClick={toggleRecording}
                            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${isRecording
                                ? "bg-[#22c55e] shadow-[0_0_16px_rgba(34,197,94,0.4)] scale-105"
                                : "text-[#606070] hover:text-[#f0f0f5] hover:bg-[#22222a]"
                                }`}
                            aria-label={isRecording ? "녹음 중지" : "음성 입력"}
                        >
                            {isRecording ? (
                                <VoiceWaveIcon />
                            ) : (
                                <Mic className="w-4 h-4" />
                            )}
                        </button>

                        {/* ── Send / Stop 버튼 ── */}
                        {loading ? (
                            <button
                                onClick={handleStop}
                                className="h-9 w-9 rounded-xl bg-red-600/80 hover:bg-red-500 flex items-center justify-center transition-colors shrink-0"
                                aria-label="응답 중지"
                            >
                                <Square className="w-3.5 h-3.5 text-white fill-white" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() && !selectedFile}
                                className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                                aria-label="메시지 전송"
                            >
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        )}
                    </div>

                    <p className="text-center text-xs text-[#404450] mt-3">
                        Orbit AI는 실수를 할 수 있습니다. 중요한 내용은 직접 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    )
}