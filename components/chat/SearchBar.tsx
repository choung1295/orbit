"use client"

import { useEffect, useRef } from "react"
import { Search, X } from "lucide-react"

interface SearchBarProps {
    value: string
    onChange: (val: string) => void
    onClear: () => void
}

export default function SearchBar({ value, onChange, onClear }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    // Ctrl+K / Cmd+K 단축키
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC")
            const trigger = isMac ? e.metaKey : e.ctrlKey

            if (trigger && e.key.toLowerCase() === "k") {
                e.preventDefault()
                e.stopPropagation()
                inputRef.current?.focus()
                inputRef.current?.select()
            }
        }

        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])

    // Esc: 검색어 초기화 또는 blur
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            if (value) {
                onClear()
            } else {
                inputRef.current?.blur()
            }
        }
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18181f] border border-[#2a2a35] focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-3.5 h-3.5 text-[#505060] shrink-0" />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search conversations…"
                className="flex-1 bg-transparent text-xs text-[#f0f0f5] placeholder:text-[#505060] outline-none min-w-0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            {/* 단축키 힌트 or 클리어 버튼 */}
            {value ? (
                <button
                    onClick={onClear}
                    className="text-[#404050] hover:text-[#a0a0b0] transition-colors"
                    aria-label="검색어 지우기"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            ) : (
                <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] text-[#404050] bg-[#22222e] border border-[#2a2a38] rounded px-1 py-0.5 font-mono select-none">
                    ⌘K
                </kbd>
            )}
        </div>
    )
}