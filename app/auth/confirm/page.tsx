"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ConfirmPage() {
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/orbit")
        }, 800)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                    인증을 완료하고 있습니다…
                </h1>
                <p className="text-gray-400">
                    잠시만 기다려 주세요
                </p>
            </div>
        </div>
    )
}