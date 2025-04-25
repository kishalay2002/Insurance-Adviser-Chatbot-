import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

// This simulates the functionality from your Python code
async function processInsuranceQuery(query: string) {
  // In a real implementation, this would call your Python backend
  // For now, we'll simulate the response using OpenAI directly
  return streamText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content:
          "You are an insurance assistant helping users make informed decisions about insurance policies. Provide helpful, accurate information about insurance products, coverage options, and recommendations based on user needs.",
      },
      { role: "user", content: query },
    ],
  })
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1].content

  const result = await processInsuranceQuery(lastMessage)
  return result.toDataStreamResponse()
}
