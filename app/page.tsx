import Navbar from "@/components/landing/Navbar"
import HeroSection from "@/components/landing/HeroSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import CTASection from "@/components/landing/CTASection"

export default function Page() {
    return (
        <main>
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <CTASection />
        </main>
    )
}