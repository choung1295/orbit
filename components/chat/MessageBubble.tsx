"use client"

import { useState } from "react"
import { Bot, Copy, Check, Pencil, RotateCcw, Paperclip } from "lucide-react"
import { Message } from "./useChat"

interface MessageBubbleProps {
    message: Message
    onRetry?: (content: string) => void
    onRegenerate?: () => void
}

export default function MessageBubble({ message, onRetry, onRegenerate }: MessageBubbleProps) {
    const isUser = message.role === "user"
    const [copied, setCopied] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(message.content)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            console.error("클립보드 복사 실패")
        }
    }

    if (isUser) {
        return (
            <div className="flex flex-col items-end gap-1 w-full">
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsEditing(!isEditing)} className="p-1 rounded-md text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors" aria-label="편집">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onRetry?.(message.content)} className="p-1 rounded-md text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors" aria-label="재시도">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleCopy} className="p-1 rounded-md text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors" aria-label="복사">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
                <div className="w-full px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-indigo-600/20 border border-indigo-500/20 text-[#f0f0f5] text-right">
                    {message.fileName && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-xs text-indigo-300 justify-end">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{message.fileName}</span>
                        </div>
                    )}
                    {isEditing ? (
                        <textarea className="w-full bg-transparent outline-none resize-none text-sm text-[#f0f0f5] text-right" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus rows={3} />
                    ) : message.content}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#232a35] shrink-0">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <button onClick={handleCopy} className="p-1 rounded-md text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors" aria-label="복사">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => onRegenerate?.()} className="p-1 rounded-md text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors" aria-label="재생성">
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="w-full px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-[#1e1e26] border border-[#32323f] text-[#d0d0d8]">
                {message.content}
            </div>
        </div>
    )
}