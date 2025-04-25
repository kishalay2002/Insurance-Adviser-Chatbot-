"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useChat } from "ai/react"

interface PolicyRecommendation {
  name: string
  summary: string
}

export default function AdvancedInsuranceChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [recommendations, setRecommendations] = useState<PolicyRecommendation[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, recommendations])

  // Simulate getting recommendations when user sends a message
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Call the regular chat handler
    handleSubmit(e)

    // Simulate getting recommendations after a delay
    setTimeout(() => {
      setRecommendations([
        {
          name: "Health Insurance Plus",
          summary: "Comprehensive health coverage with low deductibles and wide network access.",
        },
        {
          name: "Term Life Secure",
          summary: "Affordable term life insurance with flexible coverage periods and optional riders.",
        },
        {
          name: "Home Shield Premium",
          summary: "Complete home insurance with natural disaster coverage and personal property protection.",
        },
      ])
    }, 2000)
  }

  const selectPolicy = (policyName: string) => {
    setSelectedPolicy(policyName)
    // Add a user message about the selected policy
    const userMessage = `Tell me more about ${policyName}`
    const formData = new FormData()
    formData.append("message", userMessage)
    handleSubmit(new SubmitEvent("submit", { cancelable: true }), { formData })
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Insurance Assistant</h1>
        </header>

        {/* Chat Messages */}
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
                {message.content}
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

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="border-t border-gray-800 p-4 flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about insurance policies..."
            className="flex-1 bg-gray-900 border-gray-700 text-white"
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
