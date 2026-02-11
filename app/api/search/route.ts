import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  const response = await fetch("http://localhost:8000/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, k: 10 }),
  });

  const data = await response.json();

  return NextResponse.json(data);
}