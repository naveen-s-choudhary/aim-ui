'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { Button } from './ui/button'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if the user is authenticated
    // This is a placeholder and should be replaced with your actual auth check
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router])

  if (!isAuthenticated) {
    return null // or a loading spinner
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Chat</h2>
        </div>
        {children}
      </main>
    </div>
  )
}

export default Layout

