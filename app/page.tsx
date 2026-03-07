import Navbar from "@/components/landing/Navbar"
import HeroSection from "@/components/landing/HeroSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import CTASection from "@/components/landing/CTASection"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
    const supabase = await createClient()
    const { data, error } = await supabase.from("orbit_test").select("*")

    return (
        <main>
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <CTASection />

            {/* orbit_test data */}
            <section style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
                    orbit_test 데이터
                </h2>

                {error && (
                    <p style={{ color: "red" }}>
                        오류: {error.message}
                    </p>
                )}

                {!error && (!data || data.length === 0) && (
                    <p style={{ color: "#888" }}>데이터가 없습니다.</p>
                )}

                {data && data.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {data.map((row, index) => (
                            <li
                                key={row.id ?? index}
                                style={{
                                    padding: "1rem",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                    background: "#1a1a1a",
                                }}
                            >
                                <p style={{ margin: 0 }}>
                                    <strong>Message:</strong> {row.message ?? JSON.stringify(row)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}
