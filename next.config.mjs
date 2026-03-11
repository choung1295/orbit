/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['openai'],
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/orbit',
                permanent: false,
            },
        ];
    },
};

export default nextConfig;