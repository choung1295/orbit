"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { type BgVariant, type Theme, getTheme } from "@/lib/theme"

interface ThemeContextValue {
    theme: Theme
    variant: BgVariant
    setVariant: (v: BgVariant) => void
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: getTheme('dark'),
    variant: 'dark',
    setVariant: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [variant, setVariantState] = useState<BgVariant>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('orbit-theme') as BgVariant | null
            if (saved) return saved
        }
        return 'dark'
    })

    const setVariant = (v: BgVariant) => {
        setVariantState(v)
        localStorage.setItem('orbit-theme', v)
    }

    return (
        <ThemeContext.Provider value={{ theme: getTheme(variant), variant, setVariant }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
