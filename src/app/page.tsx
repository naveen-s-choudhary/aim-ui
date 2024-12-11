import Layout from '@/components/Layout'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Chat</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  )
}

