"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/landing/Navbar"), {
    ssr: false,
});
const HeroSection = dynamic(() => import("@/components/landing/HeroSection"), {
    ssr: false,
});
const FeaturesSection = dynamic(
    () => import("@/components/landing/FeaturesSection"),
    { ssr: false }
);
const CTASection = dynamic(() => import("@/components/landing/CTASection"), {
    ssr: false,
});

export default function LandingPage() {
    return (
        <main>
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <CTASection />
        </main>
    );
}