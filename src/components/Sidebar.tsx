import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Settings, LogOut } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from './ui/button'

const Sidebar = () => {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <div className="flex h-screen w-16 flex-col bg-black text-white">
      <div className="p-4">
        <h1 className="text-xl font-bold">CB</h1>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 p-2">
          <li>
            <Link href="/" className={cn(
              "flex items-center justify-center rounded-lg p-2 hover:bg-gray-700",
              "text-gray-300 hover:text-white"
            )}>
              <MessageSquare className="h-6 w-6" />
            </Link>
          </li>
          <li>
            <Link href="/system-instruction" className={cn(
              "flex items-center justify-center rounded-lg p-2 hover:bg-gray-700",
              "text-gray-300 hover:text-white"
            )}>
              <Settings className="h-6 w-6" />
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-2 mt-auto mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="w-full flex items-center justify-center rounded-lg p-2 hover:bg-gray-700 text-gray-300 hover:text-white"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

export default Sidebar

