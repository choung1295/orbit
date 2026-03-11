"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Plus, Paperclip, Image, X, Mic, Square } from "lucide-react"
import { useChat } from "./useChat"
import MessageList from "./MessageList"

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
        loading, streamingText,
        selectedFile, setSelectedFile,
        isRecording,
        loadMessages, handleSend, handleStop, toggleRecording
    } = useChat(conversationId, onConversationCreated)

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
            <style jsx>{`
        @keyframes voiceWave { 0% { height: 4px; } 100% { height: 16px; } }
      `}</style>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto">
                <MessageList
                    messages={messages}
                    loading={loading}
                    streamingText={streamingText}
                    onRetry={(content) => handleSend(content)}
                    onRegenerate={handleRegenerate}
                />
            </div>

            {/* 입력 영역 */}
            <div className="shrink-0">
                <div className="max-w-4xl mx-auto w-full px-6 pb-6 pt-4">
                    {selectedFile && (
                        <div className="flex items-center gap-2 mb-2 px-4 py-2 rounded-xl bg-[#1a1a1f] border border-[#2a2a35] text-sm text-[#a0a0b0]">
                            <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="truncate flex-1">{selectedFile.name}</span>
                            <button
                                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                                className="p-1 rounded-md hover:bg-[#2a2a35] transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-[#606070] hover:text-[#f0f0f5]" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-end gap-3 px-4 py-3 rounded-2xl bg-[#18181f] border border-[#2e2e3a] focus-within:border-indigo-500/50 transition-colors">
                        <div className="relative" ref={plusMenuRef}>
                            <button
                                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-[#606070] hover:text-[#f0f0f5] hover:bg-[#2a2a35] transition-colors shrink-0"
                            >
                                <Plus className={`w-5 h-5 transition-transform duration-200 ${plusMenuOpen ? "rotate-45" : ""}`} />
                            </button>
                            {plusMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-52 py-2 rounded-xl bg-[#1e1e26] border border-[#2a2a35] shadow-2xl shadow-black/50 z-50">
                                    <button
                                        onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false) }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#c0c0c8] hover:bg-[#2a2a35] transition-colors"
                                    >
                                        <Image className="w-4 h-4 text-indigo-400" />
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
                            className="flex-1 bg-transparent text-sm text-[#f0f0f5] placeholder:text-[#50505e] resize-none outline-none max-h-48 py-1.5 leading-relaxed"
                        />

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={toggleRecording}
                                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? "bg-emerald-500 shadow-[0_0_16px_rgba(34,197,94,0.4)] scale-105" : "text-[#606070] hover:text-[#f0f0f5] hover:bg-[#2a2a35]"}`}
                            >
                                {isRecording ? <VoiceWaveIcon /> : <Mic className="w-4 h-4" />}
                            </button>

                            {loading ? (
                                <button
                                    onClick={handleStop}
                                    className="h-9 w-9 rounded-xl bg-red-600/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                                >
                                    <Square className="w-3.5 h-3.5 text-white fill-white" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() && !selectedFile}
                                    className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                >
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-xs text-[#404050] mt-3">
                        Orbit AI는 실수를 할 수 있습니다. 중요한 내용은 직접 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    )
}