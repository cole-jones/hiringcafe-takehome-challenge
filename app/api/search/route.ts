import { JobFilterTokens } from "@/types/job_filters";
import { NextRequest, NextResponse } from "next/server";

// Optional: Edge runtime for low latency
export const runtime = "edge";

export interface AIResponse {
  status: number;
  error?: string;
  result?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JobFilterTokens = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const faiss_response = await fetch("http://localhost:8000/search_faiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const faiss_data = await faiss_response.json();

    return NextResponse.json({ status: 200, result: JSON.stringify(faiss_data.results, null, 2), token_usage: faiss_data.tokens_used });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json({ status: 500, error: "OpenAI request failed" } as AIResponse);
  }
}