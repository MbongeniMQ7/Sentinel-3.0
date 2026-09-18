import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PwaRegistration } from '@/components/pwa-registration'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sentinel-30.vercel.app'),
  applicationName: 'SentinelAI Workforce',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'SentinelAI', statusBarStyle: 'default' },
  title: 'SentinelAI Workforce — See your workforce clearly',
  description: 'SentinelAI Workforce combines workforce management, attendance intelligence and fatigue indicators into one operational platform. Smart wristbands, biometric signals and activity patterns — unified.',
  keywords: ['workforce management', 'fatigue monitoring', 'attendance', 'workforce intelligence', 'biometric wristband'],
  authors: [{ name: 'SentinelAI Workforce' }],
  openGraph: {
    title: 'SentinelAI Workforce — See your workforce clearly',
    description: 'Workforce management, attendance intelligence and fatigue indicators in one operational platform.',
    type: 'website',
    url: 'https://sentinel-30.vercel.app',
    siteName: 'SentinelAI Workforce',
    images: [
      {
        url: '/images/logo.png',
        width: 1900,
        height: 1900,
        alt: 'Sentinel-AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SentinelAI Workforce — See your workforce clearly',
    description: 'Workforce management, attendance intelligence and fatigue indicators in one operational platform.',
    images: ['/images/logo.png'],
  },
  icons: {
    icon: [
      {
        url: '/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: '/pwa-apple-180.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f2a4a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <PwaRegistration />
        <Analytics />
      </body>
    </html>
  )
}
