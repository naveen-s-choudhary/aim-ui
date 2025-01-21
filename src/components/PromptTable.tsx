'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axiosInstance from '@/lib/axios'
import { Edit2Icon } from 'lucide-react'

interface Prompt {
  _id: string
  title: string
  content: string
  prompt_type: 'SYSTEM_PROMPT' | 'SPECIALIZED_PROMPT'
  access_type: 'ADMIN_PROMPT' | 'USER_PROMPT'
  active_version: number
  history: VersionHistory[]
}

interface Version {
  _id: string
  history: VersionHistory[]
  title: string
  content: string
  active_version: number
}

interface VersionHistory {
  version: number
  content: string
  timestamp?: string
}

export function PromptTable() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [versionObj, setVersionObj] = useState<Version>({
    _id: "",
    history: [],
    title: '',
    content: '',
    active_version: 0,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState("")
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

  const handleEdit = async (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setIsModalOpen(true)
  }

  const handleVersionEdit = (prompt: Prompt) => {
    setVersionObj(prompt)
    setIsVersionModalOpen(true)
    setSelectedVersion(prompt?.active_version.toString())
  }
  const handleDelete = async (prompt: Prompt) => {
    try {
      await axiosInstance.delete(`/prompts/${prompt._id}`)
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
        await axiosInstance.put(`/prompts/${updatedPrompt._id}`, payload)
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
      access_type: 'USER_PROMPT',
      active_version: 0,
      history: []
    })
    setIsModalOpen(true)
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(prompts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPrompts(items);

    try {
      await axiosInstance.put('/prompts/reorder', {
        prompts: items.map((item, index) => ({
          _id: item._id,
          order: index
        }))
      });
    } catch (error) {
      console.error('Error updating prompt order:', error);
    }
  };

  const handleVersionChange = (value: string) => {
    setSelectedVersion(value);
    const findObj = versionObj.history.find((obj) => obj.version === Number(value));

    if (findObj) {
      setVersionObj({ ...versionObj, content: findObj.content });
    } else {
      console.error('Version not found');
      setVersionObj({ ...versionObj, content: '' });
    }
  };

  const handleVersionUpdate = async () => {
    const payload = {
      version: selectedVersion,
    }
    await axiosInstance.put(`/prompts/set-version/${versionObj._id}`, payload)
    await fetchPrompts()
    setIsVersionModalOpen(false)
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
                  <TableHead>Version</TableHead>
                  <TableHead>Prompt Type</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt, index) => {
                  const version = prompt.active_version
                  return <Draggable key={prompt._id} draggableId={prompt._id} index={index}>
                    {(provided) => (
                      <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <TableCell>{prompt.title}</TableCell>
                        <TableCell>{prompt.content.slice(0, 30)}...</TableCell>
                        <TableCell className='flex items-center gap-1' align='center'><p>{version}</p><Edit2Icon size={12} color='green'
                          onClick={() => handleVersionEdit(prompt)} /></TableCell>
                        <TableCell>{prompt.prompt_type}</TableCell>
                        <TableCell>{prompt.access_type}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(prompt)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeletePromptId(prompt._id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                })}
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

      <Dialog open={isVersionModalOpen} onOpenChange={setIsVersionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version Updating</DialogTitle>
          </DialogHeader>
          {versionObj && (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleVersionUpdate()
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={versionObj.title}
                    className="col-span-4 pointer-events-none"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content">Content</Label>
                  <div
                    id="content"
                    className="col-span-4 h-64 border rounded p-3 overflow-auto"
                  >
                    {versionObj.content}
                  </div>
                </div>
                <div className="grid gap-4 py-4">
                  {/* Version Selector */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="version">
                      Version
                    </Label>
                    <Select
                      value={selectedVersion}
                      onValueChange={(value) => handleVersionChange(value)}
                    >
                      <SelectTrigger className="col-span-4">
                        <SelectValue>{`Version ${selectedVersion}`}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {versionObj?.history?.map((item) => (
                          <SelectItem
                            key={item.version}
                            value={item.version.toString()}
                          >
                            Version {item.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
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
            <Button variant="destructive" onClick={() => deletePromptId && handleDelete(prompts.find(p => p._id === deletePromptId) as Prompt)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

