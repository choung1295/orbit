"use client"

import { Clock, Archive, FolderOpen } from "lucide-react"
import type { SearchResult, StorageType } from "@/lib/supabase/queries/searchConversations"

interface SearchResultsProps {
    results: SearchResult[]
    isSearching: boolean
    keyword: string
    onSelect: (conversationId: string) => void
    activeId?: string
}

const STORAGE_LABEL: Record<StorageType, { label: string; icon: React.ReactNode; color: string }> = {
    project: { label: "Project", icon: <FolderOpen className="w-3 h-3" />, color: "text-indigo-400" },
    recent: { label: "Recent", icon: <Clock className="w-3 h-3" />, color: "text-emerald-400" },
    archive: { label: "Archive", icon: <Archive className="w-3 h-3" />, color: "text-[#606070]" },
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
    if (!keyword.trim()) return <>{text}</>
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-indigo-500/30 text-indigo-200 rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    )
}

export default function SearchResults({
    results, isSearching, keyword, onSelect, activeId,
}: SearchResultsProps) {
    if (isSearching) {
        return (
            <div className="px-3 py-4">
                <p className="text-xs text-[#404050] animate-pulse italic text-center">Searching...</p>
            </div>
        )
    }

    if (!keyword.trim() || keyword.trim().length < 2) return null

    if (results.length === 0) {
        return (
            <div className="px-3 py-4">
                <p className="text-xs text-[#404050] text-center">No conversations found</p>
            </div>
        )
    }

    return (
        <div className="px-2 pb-2">
            <p className="px-2 py-1.5 text-[10px] font-semibold text-[#404050] uppercase tracking-widest">
                Results · {results.length}
            </p>
            <div className="space-y-0.5">
                {results.map((result) => {
                    const tag = STORAGE_LABEL[result.storage_type]
                    const isActive = activeId === result.conversation_id
                    return (
                        <button
                            key={result.conversation_id}
                            onClick={() => onSelect(result.conversation_id)}
                            className={`w-full text-left px-2 py-2 rounded-lg transition-colors group ${isActive ? "bg-[#1e1e2e]" : "hover:bg-[#18181f]"
                                }`}
                        >
                            <p className={`text-xs font-medium truncate mb-0.5 ${isActive ? "text-[#f0f0f5]" : "text-[#b0b0c0] group-hover:text-[#e0e0e8]"
                                }`}>
                                <HighlightText text={result.title} keyword={keyword} />
                            </p>
                            {result.snippet && (
                                <p className="text-[11px] text-[#505060] line-clamp-1 mb-1">
                                    <HighlightText text={result.snippet} keyword={keyword} />
                                </p>
                            )}
                            <div className={`flex items-center gap-1 text-[10px] ${tag.color}`}>
                                {tag.icon}
                                <span>{result.project_name ? `Project · ${result.project_name}` : tag.label}</span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}