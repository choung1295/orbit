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
            <div className="flex flex-col items-end gap-1.5 group">
                <div className="max-w-[70%] px-5 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-sm leading-7 whitespace-pre-wrap break-words">
                    {message.fileName && (
                        <div className="flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-indigo-200">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{message.fileName}</span>
                        </div>
                    )}
                    {isEditing ? (
                        <textarea
                            className="w-full bg-transparent outline-none resize-none text-sm text-white leading-7"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            rows={3}
                        />
                    ) : message.content}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 rounded-lg text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onRetry?.(message.content)} className="p-1.5 rounded-lg text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleCopy} className="p-1.5 rounded-lg text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex gap-4 group">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 flex flex-col gap-2 pt-0.5 min-w-0">
                <div className="text-sm leading-7 text-[#d0d0dc] whitespace-pre-wrap break-words">
                    {message.content}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleCopy} className="p-1.5 rounded-lg text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => onRegenerate?.()} className="p-1.5 rounded-lg text-[#505060] hover:text-[#c0c0c8] hover:bg-[#22222a] transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}