"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/components/chat/ThemeContext"

interface ProjectCreateInputProps {
    onSave: (name: string) => void
    onCancel: () => void
}

export default function ProjectCreateInput({ onSave, onCancel }: ProjectCreateInputProps) {
    const { theme } = useTheme()
    const d = theme.isDark
    const [value, setValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const save = () => {
        const trimmed = value.trim()
        if (trimmed) {
            onSave(trimmed)
        } else {
            onCancel()
        }
    }

    return (
        <div className="px-2 py-1">
            <input
                ref={inputRef}
                type="text"
                placeholder="프로젝트 이름..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); save() }
                    if (e.key === "Escape") { e.preventDefault(); onCancel() }
                }}
                onBlur={save}
                className={`w-full rounded-md px-2 py-1 text-xs outline-none transition-colors ${d
                    ? 'bg-[#22222e] border border-indigo-500/60 text-[#f0f0f5] focus:border-indigo-400 placeholder:text-[#505060]'
                    : 'border border-indigo-500 text-gray-800 focus:border-indigo-600'}`}
                style={d ? {} : { backgroundColor: theme.inlineInput, color: theme.text }}
            />
        </div>
    )
}
