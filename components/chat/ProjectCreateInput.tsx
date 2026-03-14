"use client"

import { useState, useEffect, useRef } from "react"

interface ProjectCreateInputProps {
    onSave: (name: string) => void
    onCancel: () => void
}

export default function ProjectCreateInput({ onSave, onCancel }: ProjectCreateInputProps) {
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
                className="w-full bg-[#22222e] border border-indigo-500/60 rounded-md px-2 py-1 text-xs text-[#f0f0f5] outline-none focus:border-indigo-400 transition-colors placeholder:text-[#505060]"
            />
        </div>
    )
}