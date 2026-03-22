import LandReport from "@/components/land/LandReport"

export default function LandPage() {
    return (
        <main className="min-h-screen bg-gray-50 pt-10 pb-20">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">토지조서</h1>
                    <p className="text-sm text-gray-500 mt-1">지번 또는 주소를 입력하면 위성 이미지와 위치 정보를 확인할 수 있습니다.</p>
                </div>
                <LandReport />
            </div>
        </main>
    )
}
