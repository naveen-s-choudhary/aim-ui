'use client'

import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <body className={inter.className}>
        {pathname === '/login' ? children : <div className="bg-gray-100 min-h-screen">{children}</div>}
      </body>
    </html>
  )
}

