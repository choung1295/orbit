"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"

interface SearchBarProps {
    onSearch: (keyword: string) => void
    onClear: () => void
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
    // input 상태는 SearchBar 내부에서 관리 → 1글자 버그 방지
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Ctrl+K / Cmd+K
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

    const handleChange = (val: string) => {
        setInputValue(val)

        // debounce는 검색 요청에만, input 표시는 즉시
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (val.trim().length < 2) {
            onClear()
            return
        }

        debounceRef.current = setTimeout(() => {
            onSearch(val.trim())
        }, 300)
    }

    const handleClear = () => {
        setInputValue("")
        onClear()
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            e.preventDefault()
            handleClear()
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
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            {inputValue ? (
                <button
                    onClick={handleClear}
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
            {/* 1글자 안내 */}
            {inputValue.length === 1 && (
                <span className="absolute left-0 top-full mt-1 text-[10px] text-[#505060] px-3">
                    Type at least 2 characters
                </span>
            )}
        </div>
    )
}