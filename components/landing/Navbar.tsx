'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Orbit } from 'lucide-react'

export default function Navbar() {
    const [open, setOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass">
            <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* 로고 */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                        <Orbit className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#f0f0f5] font-bold text-lg tracking-tight">Orbit</span>
                </Link>

                {/* 데스크톱 메뉴 */}
                <div className="hidden md:flex items-center gap-1">
                    <Link
                        href="/pricing"
                        className="px-4 py-2 text-sm text-[#a0a0b0] hover:text-[#f0f0f5] rounded-lg hover:bg-[#22222a] transition-all"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/auth/login"
                        className="px-4 py-2 text-sm text-[#a0a0b0] hover:text-[#f0f0f5] rounded-lg hover:bg-[#22222a] transition-all"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="ml-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Get started free
                    </Link>
                </div>

                {/* 모바일 햄버거 */}
                <button
                    className="md:hidden p-2 text-[#a0a0b0] hover:text-[#f0f0f5]"
                    onClick={() => setOpen(!open)}
                    aria-label="메뉴 열기"
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </nav>

            {/* 모바일 드로어 */}
            {open && (
                <div className="md:hidden glass border-t border-[#2a2a35] py-4 px-4 space-y-2 animate-fade-in">
                    <Link href="/pricing" className="block px-4 py-2.5 rounded-lg text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-[#22222a] transition-all">Pricing</Link>
                    <Link href="/auth/login" className="block px-4 py-2.5 rounded-lg text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-[#22222a] transition-all">Log in</Link>
                    <Link href="/auth/signup" className="block px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-center font-medium hover:bg-indigo-500 transition-all">Get started free</Link>
                </div>
            )}
        </header>
    )
}
