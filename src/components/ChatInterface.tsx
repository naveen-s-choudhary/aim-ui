'use client'

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Send } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import axiosInstance, { baseUrl } from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult[];
  [index: number]: SpeechRecognitionResult[];
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type Message = {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
};

interface ChatHistoryResponse {
  data: {
    _id: string;
    type: string;
    content: string;
  }[];
}

interface ChatMessage {
  _id: string;
  type: string;
  content: string;
}

const ChatInterface = () => {
  const { messages, setMessages } = useChat()
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/user/chats');
      const parsedData = JSON.parse(response.data) as ChatHistoryResponse;

      if (parsedData?.data && Array.isArray(parsedData.data)) {
        const chatHistory = parsedData.data.map((chat: ChatMessage) => ({
          id: chat._id,
          role: chat.type === 'ai' ? 'assistant' as const : 'user' as const,
          content: chat.content,
        }));
        setMessages(chatHistory);
      } else {
        console.error('Invalid response format:', parsedData);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setMessages([]);
    }
  };

  const memoizedFetchChatHistory = useCallback(fetchChatHistory, [setMessages]);

  useEffect(() => {
    memoizedFetchChatHistory();
  }, [memoizedFetchChatHistory]);

  useLayoutEffect(() => {
    if (scrollAreaRef.current) {
      const lastMessage = scrollAreaRef.current.lastElementChild;
      lastMessage?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete('/conversations', {
        data: {
          user_id: "65764b5fd51a1faf4f6772d2",
        },
      });
      setShowDeleteModal(false);
      fetchChatHistory(); // Refresh chat history
    } catch (error) {
      console.error('Error deleting conversations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input
    }
    setMessages([...messages, userMessage])

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: ''
    }
    setMessages(prev => [...prev, aiMessage])

    try {
      const response = await fetch(`${baseUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: "65764b5fd51a1faf4f6772d2",
          message: input,
          is_specific_user: true,
          current_date_time: new Date().toISOString(),
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = '';

      while (true) {
        const { done, value } = await reader?.read() || {};
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              if (jsonData.type === 'chunk') {
                aiResponseText += jsonData.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessage.id
                      ? { ...msg, content: aiResponseText }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setInput('');
  };

  const startRecording = () => {
    setIsRecording(true)

    const SpeechRecognitionConstructor =
      window?.SpeechRecognition ||
      window?.webkitSpeechRecognition;

    if (window !== undefined && SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.start();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Chat</h2>
        <Button onClick={() => setShowDeleteModal(true)}>Delete</Button>
      </div>
      <div
        ref={scrollAreaRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">Welcome! Let&apos;s get started.</div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role !== 'user' && (
                <Avatar className="mr-2">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] rounded-lg p-3 ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ children, className, ...rest }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <SyntaxHighlighter
                          language={match[1]}
                          style={darcula}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      );
                    },
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full divide-y divide-gray-200 border">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gray-50">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {children}
                      </td>
                    ),
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="mb-2">{children}</li>,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
              {m.role === 'user' && (
                <Avatar className="ml-2">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
      </div>
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
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button onClick={handleDelete} variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatInterface

