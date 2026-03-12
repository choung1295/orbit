import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Orbit AI Platform',
    short_name: 'Orbit AI',
    description: 'Orbit AI - Your Strategic AI Companion',
    start_url: '/orbit',
    display: 'standalone',
    background_color: '#0f0f11',
    theme_color: '#0f0f11',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
