"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useTheme } from "@/components/chat/ThemeContext"

interface SearchBarProps {
    onSearch: (keyword: string) => void
    onClear: () => void
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
    const { theme } = useTheme()
    const d = theme.isDark
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors focus-within:border-indigo-500/50"
            style={{
                backgroundColor: theme.input,
                border: `1px solid ${theme.inputBorder}`,
            }}
        >
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: theme.textMuted }} />
            <input
                ref={inputRef}
                type="text"
                placeholder="Search conversations…"
                className="flex-1 bg-transparent text-xs outline-none min-w-0"
                style={{ color: theme.text }}
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            {inputValue ? (
                <button
                    onClick={handleClear}
                    className="transition-colors"
                    style={{ color: theme.textMuted }}
                    aria-label="검색어 지우기"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            ) : (
                <kbd
                    className="hidden sm:flex items-center gap-0.5 text-[9px] rounded px-1 py-0.5 font-mono select-none"
                    style={d
                        ? { color: '#404050', backgroundColor: '#22222e', border: '1px solid #2a2a38' }
                        : { color: theme.textMuted, backgroundColor: theme.hover, border: `1px solid ${theme.inputBorder}` }}
                >
                    ⌘K
                </kbd>
            )}
            {inputValue.length === 1 && (
                <span className="absolute left-0 top-full mt-1 text-[10px] px-3" style={{ color: theme.textMuted }}>
                    Type at least 2 characters
                </span>
            )}
        </div>
    )
}
