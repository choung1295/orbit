"use client"

import { useState, useRef } from "react"
import { Copy, Check, Pencil, RotateCcw, Paperclip } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Message } from "./useChat"
import { useTheme } from "@/components/chat/ThemeContext"

// ── 코드 블록 (복사 버튼 포함) ──────────────────────────────────────────────
function PreBlock({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
    const [copied, setCopied] = useState(false)
    const preRef = useRef<HTMLPreElement>(null)

    const handleCopy = async () => {
        const text = preRef.current?.textContent || ''
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { /* ignore */ }
    }

    return (
        <div className="relative my-3 group/code w-full">
            <pre
                ref={preRef}
                className="w-full max-w-full overflow-x-auto overflow-y-hidden whitespace-pre rounded-xl text-[13px] leading-relaxed"
                style={{
                    backgroundColor: isDark ? '#1a1a26' : '#ffffff',
                    border: `1px solid ${isDark ? '#2a2a3a' : '#d9dee5'}`,
                    padding: '14px 18px',
                    paddingRight: '48px',
                }}
            >
                {children}
            </pre>
            <button
                onClick={handleCopy}
                title="복사"
                className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark
                    ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08]'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-black/[0.06]'}`}
            >
                {copied
                    ? <Check className="w-4 h-4 text-emerald-400" />
                    : <Copy className="w-4 h-4" />}
            </button>
        </div>
    )
}

export default function MessageBubble({
    message,
    onRetry,
    onRegenerate,
}: {
    message: Message
    onRetry?: (content: string) => void
    onRegenerate?: () => void
}) {
    const { theme } = useTheme()
    const d = theme.isDark
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

    // 액션 버튼 공통 스타일 — 항상 표시, 크기 업
    const actionBtnClass = d
        ? "p-2 rounded-lg text-[#606070] hover:text-[#c0c0d0] hover:bg-[#1e1e28] transition-colors"
        : "p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.06] transition-colors"

    if (isUser) {
        return (
            <div className="flex flex-col items-end gap-1">
                <div
                    className="max-w-[65%] px-5 py-3.5 rounded-2xl rounded-tr-sm text-[15px] leading-[1.7] whitespace-pre-wrap break-words"
                    style={d
                        ? { backgroundColor: 'rgba(255,255,255,0.12)', color: theme.text }
                        : { backgroundColor: 'rgba(0,0,0,0.12)', color: theme.text }}
                >
                    {message.fileName && (
                        <div className="flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-indigo-200">
                            <Paperclip className="w-3 h-3 shrink-0" />
                            <span className="truncate">{message.fileName}</span>
                        </div>
                    )}

                    {isEditing ? (
                        <textarea
                            className="w-full bg-transparent outline-none resize-none text-[15px] leading-[1.7]"
                            style={{ color: theme.text }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            rows={3}
                        />
                    ) : (
                        message.content
                    )}
                </div>

                <div className="flex items-center gap-0.5">
                    <button onClick={() => setIsEditing(!isEditing)} className={actionBtnClass}>
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onRetry?.(message.content)} className={actionBtnClass}>
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={handleCopy} className={actionBtnClass}>
                        {copied
                            ? <Check className="w-4 h-4 text-emerald-400" />
                            : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-row items-start gap-2 w-full -mt-2">
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div
                    className={`text-[15px] leading-[1.7] max-w-none ${d ? 'prose prose-invert' : 'prose'}`}
                    style={{ color: theme.text }}
                >
                    <ReactMarkdown
                        components={{
                            a: ({ href, children }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: theme.link, textDecoration: "underline" }}
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
                            pre: ({ children }) => (
                                <PreBlock isDark={d}>{children}</PreBlock>
                            ),
                            code: ({ className, children }) => {
                                const isBlock = !!className
                                if (isBlock) {
                                    return (
                                        <code className={`${className} font-mono`} style={{ color: d ? '#a5b4fc' : '#4338ca' }}>
                                            {children}
                                        </code>
                                    )
                                }
                                return (
                                    <code
                                        className="px-1.5 py-0.5 rounded text-[13px] font-mono"
                                        style={{ backgroundColor: theme.codeBg, color: theme.codeText }}
                                    >
                                        {children}
                                    </code>
                                )
                            },
                            strong: ({ children }) => (
                                <strong className="font-semibold" style={{ color: theme.strong }}>
                                    {children}
                                </strong>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                {/* 액션 버튼 — 항상 표시 */}
                <div className="flex items-center gap-0.5 pl-1">
                    <button onClick={handleCopy} className={actionBtnClass}>
                        {copied
                            ? <Check className="w-4 h-4 text-emerald-400" />
                            : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onRegenerate?.()} className={actionBtnClass}>
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
