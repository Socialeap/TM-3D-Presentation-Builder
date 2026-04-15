/**
 * Client for the Supabase Edge Function that synthesizes answers
 * from retrieved property context + chat history using an LLM.
 */
import type { SynthesisRequest, SynthesisResponse, ChatMessage, RetrievedChunk } from "../types/rag";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Call the chat-synthesis edge function.
 * Falls back to a local stub response if the edge function is not configured.
 */
export async function synthesizeAnswer(
  query: string,
  chatHistory: ChatMessage[],
  context: RetrievedChunk[],
): Promise<string> {
  // If Supabase is not configured, fall back to returning the raw context
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return buildFallbackAnswer(query, context);
  }

  const url = `${SUPABASE_URL}/functions/v1/chat-synthesis`;

  const body: SynthesisRequest = {
    query,
    chatHistory: chatHistory.slice(-3), // last 3 messages for conversational context
    context,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Synthesis failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as SynthesisResponse;
  return data.answer;
}

/**
 * Fallback: format retrieved chunks as a readable answer when no LLM is available.
 * This allows the RAG pipeline to be useful even without the Supabase edge function.
 */
function buildFallbackAnswer(query: string, context: RetrievedChunk[]): string {
  if (context.length === 0) {
    return "I couldn't find any relevant information about that in the property specifications. Could you try rephrasing your question?";
  }

  const header = `Based on the property specifications, here's what I found relevant to "${query}":\n\n`;
  const sections = context
    .map((chunk, i) => `**${i + 1}. ${chunk.section}** (relevance: ${(chunk.score * 100).toFixed(0)}%)\n${chunk.content}`)
    .join("\n\n---\n\n");

  return header + sections;
}
