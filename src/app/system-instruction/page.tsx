import Layout from '@/components/Layout'
import { PromptTable } from '@/components/PromptTable'
import '@/styles/drag-drop.css'

export default function SystemInstruction() {
  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">System Instruction</h2>
        <p className="mb-4">Manage your system and specialized prompts here.</p>
        <PromptTable />
      </div>
    </Layout>
  )
}

