import Link from 'next/link'
import { MessageSquare, Settings } from 'lucide-react'
import { cn } from "@/lib/utils"

const Sidebar = () => {
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
    </div>
  )
}

export default Sidebar

