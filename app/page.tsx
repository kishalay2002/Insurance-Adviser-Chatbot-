"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { marked } from "marked"  // ✅ Markdown parser

interface Message {
  role: "user" | "assistant"
  content: string
}

interface PolicyRecommendation {
  name: string
  summary: string
}

export default function InsuranceChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<PolicyRecommendation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, recommendations])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/history")
        const data = await response.json()

        if (data.history?.length > 0) {
          const formattedMessages = data.history
            .filter((item: any) => item.user || item.bot)
            .flatMap((item: any) => [
              { role: "user", content: item.user },
              ...(item.bot ? [{ role: "assistant", content: item.bot }] : []),
            ])
          setMessages(formattedMessages)
        }

        if (data.recommendations) {
          setRecommendations(data.recommendations)
        }
      } catch (error) {
        console.error("Failed to load history:", error)
      }
    }

    loadHistory()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      })

      const data = await response.json()

      if (data.type === "answer" || data.type === "recommendations") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error processing your request." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const selectPolicy = (policyName: string) => {
    if (isLoading) return
    const userMessage = `Tell me more about ${policyName}`
    setInput(userMessage)
    handleSubmit(new Event("submit") as any)
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <header className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Insurance Assistant</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 my-8">
              <p>Welcome to the Insurance Assistant</p>
              <p className="text-sm mt-2">Ask me about insurance policies and coverage options</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-800 text-white rounded-bl-none"
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-800 text-white rounded-bl-none">
                <span className="animate-pulse">thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about insurance policies..."
            className="flex-1 bg-gray-900 border-gray-700 text-white"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="w-80 border-l border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">Recommended Policies</h2>
          </div>
          <div className="p-4 space-y-3">
            {recommendations.map((policy, index) => (
              <Card key={index} className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="font-medium text-blue-400">{policy.name}</h3>
                  <p className="text-sm text-gray-300 mt-1">{policy.summary}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-blue-600 text-blue-400 hover:bg-blue-900"
                    onClick={() => selectPolicy(policy.name)}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ Format message using markdown
function formatMessageContent(content: string): string {
  return marked.parse(content)
}
