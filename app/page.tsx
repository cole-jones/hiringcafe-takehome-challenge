"use client";

import { FormEvent, useState } from "react";
import { AIResponse } from "./api/openai/route";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as AIResponse;
      setResult(data.result ?? data.error ?? "No response");
    } catch (err) {
      setResult("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Next.js + OpenAI (TypeScript)</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask something…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: "300px", marginRight: "0.5rem" }}
        />
        <button type="submit" disabled={loading || !prompt.trim()}>
          {loading ? "Thinking…" : "Submit"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "1.5rem", whiteSpace: "pre-wrap" }}>
          <strong>Response:</strong>
          <p>{result}</p>
        </div>
      )}
    </main>
  );
}