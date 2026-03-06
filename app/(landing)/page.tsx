import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import CTASection from '@/components/landing/CTASection'

export const metadata = {
    title: 'Orbit — AI-Powered Chat Platform',
    description: 'The AI chat workspace built for deep work. Multi-model support, real-time sync, and powerful context — all in one place.',
}

export default function LandingPage() {
    return (
        <main>
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <CTASection />
        </main>
    )
}
