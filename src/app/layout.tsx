import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenClaw Dashboard',
  description: 'Visual monitoring for OpenClaw agents and processes',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gradient-to-br from-openclaw-primary to-openclaw-secondary`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}