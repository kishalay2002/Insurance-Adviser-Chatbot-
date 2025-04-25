import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    // This would call your Python script with the query
    // For a real implementation, you'd need to set up a proper Python backend
    // or use a solution like Vercel's Python runtime

    // Simulated response for now
    return NextResponse.json({
      response: "This is a simulated response. In a real implementation, this would come from your Python chatbot.",
      recommendations: [
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
      ],
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
