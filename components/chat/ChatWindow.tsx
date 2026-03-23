"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Plus, Paperclip, ImageIcon, X, Mic, Square } from "lucide-react"
import { useChat } from "./useChat"
import MessageList from "./MessageList"
import { useTheme } from "@/components/chat/ThemeContext"

interface ChatWindowProps {
    conversationId: string | null
    onConversationCreated: (id: string) => void
}

function VoiceWaveIcon() {
    return (
        <div className="flex items-center justify-center gap-[3px] w-5 h-5">
            {[0, 1, 2, 3].map((i) => (
                <span
                    key={i}
                    className="inline-block w-[3px] rounded-full bg-white"
                    style={{ animation: `voiceWave 0.8s ease-in-out ${i * 0.15}s infinite alternate` }}
                />
            ))}
        </div>
    )
}

export default function ChatWindow({ conversationId, onConversationCreated }: ChatWindowProps) {
    const {
        messages,
        input, setInput,
        loading, streamingText, thinkingStatus,
        selectedFile, setSelectedFile,
        isRecording,
        loadMessages, handleSend, handleStop, toggleRecording
    } = useChat(conversationId, onConversationCreated)

    const { theme } = useTheme()
    const d = theme.isDark

    const [plusMenuOpen, setPlusMenuOpen] = useState(false)
    const plusMenuRef = useRef<HTMLDivElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        loadMessages()
    }, [loadMessages])

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) setPlusMenuOpen(false)
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    const handleRegenerate = (idx: number) => {
        const prevUser = messages.slice(0, idx).reverse().find((m) => m.role === "user")
        if (prevUser) handleSend(prevUser.content)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <MessageList
                    messages={messages}
                    loading={loading}
                    streamingText={streamingText}
                    thinkingStatus={thinkingStatus}
                    onRetry={(content) => handleSend(content)}
                    onRegenerate={handleRegenerate}
                />
            </div>

            <div className="shrink-0">
                <div className="max-w-[800px] mx-auto w-full px-3 md:px-6 pb-3 md:pb-6 pt-2 md:pt-4">
                    {/* 첨부 파일 칩 */}
                    {selectedFile && (
                        <div
                            className="flex items-center gap-2 mb-2 px-4 py-2 rounded-xl text-sm"
                            style={{
                                backgroundColor: theme.input,
                                border: `1px solid ${theme.inputBorder}`,
                                color: theme.textSub,
                            }}
                        >
                            <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="truncate flex-1">{selectedFile.name}</span>
                            <button
                                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                                className="p-1 rounded-md transition-colors"
                                style={{ color: theme.textMuted }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.hover)}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* 입력 컨테이너 */}
                    <div
                        className="flex items-end gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-[24px]"
                        style={{
                            backgroundColor: theme.input,
                            border: `1px solid ${theme.inputBorder}`,
                        }}
                    >
                        {/* Plus 버튼 */}
                        <div className="relative" ref={plusMenuRef}>
                            <button
                                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                                className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${d
                                    ? 'text-[#606070] hover:text-[#f0f0f5] hover:bg-[#2a2a35]'
                                    : 'text-gray-400 hover:text-gray-700 hover:bg-black/[0.06]'}`}
                            >
                                <Plus className={`w-5 h-5 transition-transform duration-200 ${plusMenuOpen ? "rotate-45" : ""}`} />
                            </button>
                            {plusMenuOpen && (
                                <div
                                    className="absolute bottom-full left-0 mb-2 w-52 py-2 rounded-xl shadow-2xl z-50"
                                    style={{
                                        backgroundColor: theme.dropdown,
                                        border: `1px solid ${theme.dropdownBorder}`,
                                        boxShadow: d ? '0 8px 40px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.12)',
                                    }}
                                >
                                    <button
                                        onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false) }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${d
                                            ? 'text-[#c0c0c8] hover:bg-[#2a2a35]'
                                            : 'text-gray-600 hover:bg-black/[0.04]'}`}
                                    >
                                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                                        사진 및 파일 추가
                                    </button>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                            className="hidden"
                            onChange={(e) => { const file = e.target.files?.[0] ?? null; setSelectedFile(file) }}
                        />

                        {/* 텍스트 입력 */}
                        <textarea
                            ref={textareaRef}
                            placeholder="메시지를 입력하세요..."
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value)
                                e.target.style.height = "auto"
                                e.target.style.height = `${e.target.scrollHeight}px`
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                            rows={1}
                            className="flex-1 min-w-0 bg-transparent text-[15px] resize-none outline-none max-h-48 py-2 md:py-1.5 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            style={{
                                color: theme.text,
                            }}
                            // placeholder 색상은 CSS global에서 처리하거나 inline style 직접 지정 불가 → tailwind 조건부
                        />

                        {/* 우측 버튼 그룹 */}
                        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                            <button
                                onClick={toggleRecording}
                                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                                    ? "bg-emerald-500 shadow-[0_0_16px_rgba(34,197,94,0.4)] scale-105"
                                    : d
                                        ? "text-[#606070] hover:text-[#f0f0f5] hover:bg-[#2a2a35]"
                                        : "text-gray-400 hover:text-gray-700 hover:bg-black/[0.06]"}`}
                            >
                                {isRecording ? <VoiceWaveIcon /> : <Mic className="w-4 h-4" />}
                            </button>

                            {loading ? (
                                <button
                                    onClick={handleStop}
                                    className="h-9 w-9 rounded bg-[#60A5FA] hover:bg-blue-400 active:bg-blue-600 flex items-center justify-center transition-colors"
                                >
                                    <Square className="w-3.5 h-3.5 text-white fill-white" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() && !selectedFile}
                                    className="h-9 w-9 rounded-full bg-[#20C6B2] hover:bg-[#14b8a6] active:bg-[#0d9488] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                >
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 하단 안내 문구 */}
                    <p
                        className="hidden md:block text-center text-xs mt-3"
                        style={{ color: d ? '#404050' : theme.textMuted }}
                    >
                        Orbit AI는 실수를 할 수 있습니다. 중요한 내용은 직접 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    )
}
