'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Prompt {
  id: number
  version: string
  promptType: 'system' | 'specialized'
  description: string
  accessType: 'admin' | 'user'
}

const initialPrompts: Prompt[] = [
  { id: 1, version: '1.0', promptType: 'system', description: 'Initial system prompt for general...', accessType: 'admin' },
  { id: 2, version: '1.1', promptType: 'specialized', description: 'Specialized prompt for technica...', accessType: 'user' },
]

export function PromptTable() {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletePromptId, setDeletePromptId] = useState<number | null>(null)

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    setDeletePromptId(id)
  }

  const confirmDelete = () => {
    if (deletePromptId) {
      setPrompts(prompts.filter(prompt => prompt.id !== deletePromptId))
      setDeletePromptId(null)
    }
  }

  const handleSave = (updatedPrompt: Prompt) => {
    if (updatedPrompt.id) {
      setPrompts(prompts.map(prompt => prompt.id === updatedPrompt.id ? updatedPrompt : prompt))
    } else {
      const newPrompt = { ...updatedPrompt, id: Date.now() }
      setPrompts([...prompts, newPrompt])
    }
    setIsModalOpen(false)
  }

  const handleNewPrompt = () => {
    setEditingPrompt({
      id: 0,
      version: '',
      promptType: 'system',
      description: '',
      accessType: 'user'
    })
    setIsModalOpen(true)
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(prompts)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setPrompts(items)
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
                  <TableHead>Version</TableHead>
                  <TableHead>Prompt Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt, index) => (
                  <Draggable key={prompt.id} draggableId={prompt.id.toString()} index={index}>
                    {(provided) => (
                      <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <TableCell>{prompt.version}</TableCell>
                        <TableCell>{prompt.promptType}</TableCell>
                        <TableCell>{prompt.description.slice(0, 30)}...</TableCell>
                        <TableCell>{prompt.accessType}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(prompt)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(prompt.id)}>Delete</Button>
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
            <DialogTitle>{editingPrompt && editingPrompt.id ? 'Edit Prompt' : 'New Prompt'}</DialogTitle>
          </DialogHeader>
          {editingPrompt && (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleSave(editingPrompt)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="version" className="text-right">
                    Version
                  </Label>
                  <Input
                    id="version"
                    value={editingPrompt.version}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, version: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="promptType" className="text-right">
                    Prompt Type
                  </Label>
                  <Select
                    value={editingPrompt.promptType}
                    onValueChange={(value: 'system' | 'specialized') => setEditingPrompt({ ...editingPrompt, promptType: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select prompt type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="specialized">Specialized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editingPrompt.description}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="accessType" className="text-right">
                    Access Type
                  </Label>
                  <Select
                    value={editingPrompt.accessType}
                    onValueChange={(value: 'admin' | 'user') => setEditingPrompt({ ...editingPrompt, accessType: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select access type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">{editingPrompt.id ? 'Save changes' : 'Add prompt'}</Button>
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
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

