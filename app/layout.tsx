import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"] });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sentinel-30.vercel.app'),
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
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
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
        <Analytics />
      </body>
    </html>
  )
}
