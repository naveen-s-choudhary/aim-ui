'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
  type SpeechRecognitionEvent = {
    results: {
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  };
  type SpeechRecognitionErrorEvent = {
    error: string;
  };
}

const ChatInterface = () => {
  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat()
  const [isRecording, setIsRecording] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const startRecording = () => {
    setIsRecording(true)
    // Web Speech API
    if (window !== undefined && (window?.SpeechRecognition || window?.webkitSpeechRecognition)) {
      const SpeechRecognition = window?.SpeechRecognition || window?.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsRecording(false)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error)
        setIsRecording(false)
      }

      recognition.start()
    }

  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.map(m => (
          <div key={m.id} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <Avatar className="mr-2">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[70%] rounded-lg p-3 ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <Avatar className="ml-2">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={startRecording}
            disabled={isRecording}
          >
            <Mic className={isRecording ? "animate-pulse text-red-500" : ""} />
          </Button>
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ChatInterface

