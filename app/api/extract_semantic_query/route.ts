import { JobFilterSchema } from "@/types/job_filter_schema";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Optional: Edge runtime for low latency
export const runtime = "edge";

type RequestBody = {
  prompt?: string;
};
type TokenUsage = {
  prompt_tokens?: number,
  completion_tokens?: number,
  total_tokens?: number
}
export interface AIResponse {
  status: number;
  error?: string;
  result?: string;
  token_usage?: TokenUsage;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const gptResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            `You are extracting structured job search intent.
            
            Return:
            1) semanticIntent: ONLY the role and skill intent.
              - Do NOT include location, compensation, years of experience,
                visa requirements, workplace type, or benefits.
            2) filters: Structured constraints for deterministic filtering.
            3) In the "searchSuggestiosn" field of filters, give a few suggestions to what the user could enter next to refine the search and add to the filters. Format it like "Try x" or "You can do x".

            If unsure whether something is a filter, put it in filters.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: JobFilterSchema.name,
          schema: JobFilterSchema.schema
        }
      }
    });

    return NextResponse.json({ status: 200, result: gptResponse.output_text, token_usage: gptResponse.usage } as AIResponse);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json({ status: 500, error: "OpenAI request failed" } as AIResponse);
  }
}