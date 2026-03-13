"use client"

import { useState } from "react"
import { Copy, Check, Pencil, RotateCcw, Paperclip } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Message } from "./useChat"
import DelphaiAvatar from "./DelphaiAvatar"

export default function MessageBubble({
    message,
    onRetry,
    onRegenerate,
}: {
    message: Message
    onRetry?: (content: string) => void
    onRegenerate?: () => void
}) {
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
            <div className="flex flex-col items-end gap-1 group">
                <div
                    className="max-w-[65%] px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm leading-[1.7] whitespace-pre-wrap break-words"
                    style={{ backgroundColor: "#4338a8", color: "#ededf8" }}
                >
                    {message.fileName && (
                        <div className="flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-indigo-200">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{message.fileName}</span>
                        </div>
                    )}

                    {isEditing ? (
                        <textarea
                            className="w-full bg-transparent outline-none resize-none text-sm leading-[1.7]"
                            style={{ color: "#ededf8" }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            rows={3}
                        />
                    ) : (
                        message.content
                    )}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1.5 rounded-lg text-[#404050] hover:text-[#a0a0b8] hover:bg-[#1e1e28] transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={() => onRetry?.(message.content)}
                        className="p-1.5 rounded-lg text-[#404050] hover:text-[#a0a0b8] hover:bg-[#1e1e28] transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg text-[#404050] hover:text-[#a0a0b8] hover:bg-[#1e1e28] transition-colors"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-row items-start gap-2 w-full group -mt-2">

            {/* AI Avatar 임시 숨김
            <div className="relative shrink-0 mt-1">
                <div className="transition-transform duration-300 group-hover:scale-105">
                    <DelphaiAvatar size={30} />
                </div>

                thinking orbit animation
                <div className="absolute inset-0 animate-spin-slow opacity-40">
                    <div className="absolute w-2 h-2 bg-violet-400 rounded-full top-0 left-1/2 -translate-x-1/2 blur-[1px]" />
                </div>
            </div>
            */}

            <div className="flex-1 flex flex-col gap-1.5">
                <div
                    className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-[1.7] prose prose-invert prose-sm max-w-none"
                    style={{
                        backgroundColor: "#16161e",
                        border: "1px solid #22222e",
                        color: "#ceceda",
                    }}
                >
                    <ReactMarkdown
                        components={{
                            a: ({ href, children }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "#818cf8", textDecoration: "underline" }}
                                >
                                    {children}
                                </a>
                            ),
                            p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                                <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
                            ),
                            code: ({ children }) => (
                                <code className="px-1.5 py-0.5 rounded bg-[#1e1e2e] text-indigo-300 text-xs font-mono">
                                    {children}
                                </code>
                            ),
                            strong: ({ children }) => (
                                <strong className="font-semibold text-[#e0e0ec]">{children}</strong>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                <div className="flex items-center gap-0.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg text-[#404050] hover:text-[#a0a0b8] hover:bg-[#1e1e28] transition-colors"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>

                    <button
                        onClick={() => onRegenerate?.()}
                        className="p-1.5 rounded-lg text-[#404050] hover:text-[#a0a0b8] hover:bg-[#1e1e28] transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}