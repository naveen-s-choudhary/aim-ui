'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axiosInstance from '@/lib/axios'

interface Prompt {
  _id: string
  title: string
  content: string
  prompt_type: 'SYSTEM_PROMPT' | 'SPECIALIZED_PROMPT'
  access_type: 'ADMIN_PROMPT' | 'USER_PROMPT'
}

export function PromptTable() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null)

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await axiosInstance.get('/prompts')
      const parsedRes = JSON.parse(response.data)
      if (parsedRes.data) {
        setPrompts(parsedRes.data)
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/prompts/${id}`)
      await fetchPrompts()
      setDeletePromptId(null)
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const handleSave = async (updatedPrompt: Prompt) => {
    try {
      const payload = {
        title: updatedPrompt.title,
        content: updatedPrompt.content,
        promptType: updatedPrompt.prompt_type,
        accessType: updatedPrompt.access_type
      }

      if (updatedPrompt._id) {
        await axiosInstance.post(`/prompts/${updatedPrompt._id}`, payload)
      } else {
        await axiosInstance.post('/prompts', payload)
      }

      await fetchPrompts()
      setIsModalOpen(false)
      setEditingPrompt(null)
    } catch (error) {
      console.error('Error saving prompt:', error)
    }
  }

  const handleNewPrompt = () => {
    setEditingPrompt({
      _id: '',
      title: '',
      content: '',
      prompt_type: 'SYSTEM_PROMPT',
      access_type: 'USER_PROMPT'
    })
    setIsModalOpen(true)
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(prompts)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setPrompts(items)

    // You might want to add an API call here to update the order in the backend
    try {
      await axiosInstance.put('/prompts/reorder', {
        prompts: items.map((item, index) => ({
          _id: item._id,
          order: index
        }))
      })
    } catch (error) {
      console.error('Error updating prompt order:', error)
    }
  }

  return (
    <div>
      <Button onClick={handleNewPrompt} className="mb-4">New Prompt</Button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="prompts">
          {(provided) => (
            <Table {...provided.droppableProps} ref={provided.innerRef}>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Prompt Type</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt, index) => (
                  <Draggable key={prompt._id} draggableId={prompt._id} index={index}>
                    {(provided) => (
                      <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <TableCell>{prompt.title}</TableCell>
                        <TableCell>{prompt.content.slice(0, 30)}...</TableCell>
                        <TableCell>{prompt.prompt_type}</TableCell>
                        <TableCell>{prompt.access_type}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(prompt)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeletePromptId(prompt._id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </TableBody>
            </Table>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPrompt?._id ? 'Edit Prompt' : 'New Prompt'}</DialogTitle>
          </DialogHeader>
          {editingPrompt && (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleSave(editingPrompt)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input
                    id="title"
                    value={editingPrompt.title}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content" className="text-right">Content</Label>
                  <Textarea
                    id="content"
                    value={editingPrompt.content}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="promptType" className="text-right">Prompt Type</Label>
                  <Select
                    value={editingPrompt.prompt_type}
                    onValueChange={(value: 'SYSTEM_PROMPT' | 'SPECIALIZED_PROMPT') =>
                      setEditingPrompt({ ...editingPrompt, prompt_type: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue>
                        {editingPrompt.prompt_type === 'SYSTEM_PROMPT' ? 'System' : 'Specialized'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SYSTEM_PROMPT">System</SelectItem>
                      <SelectItem value="SPECIALIZED_PROMPT">Specialized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="accessType" className="text-right">Access Type</Label>
                  <Select
                    value={editingPrompt.access_type}
                    onValueChange={(value: 'ADMIN_PROMPT' | 'USER_PROMPT') =>
                      setEditingPrompt({ ...editingPrompt, access_type: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue>
                        {editingPrompt.access_type === 'ADMIN_PROMPT' ? 'Admin' : 'User'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN_PROMPT">Admin</SelectItem>
                      <SelectItem value="USER_PROMPT">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">{editingPrompt._id ? 'Save changes' : 'Add prompt'}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deletePromptId !== null} onOpenChange={() => setDeletePromptId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this prompt? This action cannot be undone.</p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeletePromptId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletePromptId && handleDelete(deletePromptId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

