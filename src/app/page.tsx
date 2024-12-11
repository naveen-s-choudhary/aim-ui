import Layout from '@/components/Layout'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  )
}

