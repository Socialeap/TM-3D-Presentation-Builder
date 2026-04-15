/**
 * Supabase Edge Function: chat-synthesis
 *
 * Accepts a user query, recent chat history, and the top retrieved property
 * specification chunks from the client-side Orama search. Constructs a
 * constrained system prompt and calls OpenAI to synthesize a natural
 * language answer grounded in the provided context.
 *
 * Environment variables required:
 *   - OPENAI_API_KEY: OpenAI API key for GPT-4o-mini / GPT-4o
 *
 * Request body:
 *   { query: string, chatHistory: ChatMessage[], context: RetrievedChunk[] }
 *
 * Response:
 *   { answer: string }
 */

// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RetrievedChunk {
  section: string;
  content: string;
  score: number;
}

interface SynthesisRequest {
  query: string;
  chatHistory: ChatMessage[];
  context: RetrievedChunk[];
}

const SYSTEM_PROMPT = `You are a knowledgeable and helpful real estate assistant for a property presentation tool. Your job is to answer the user's questions about a specific property using ONLY the provided property specification context.

Rules:
1. Answer ONLY based on the provided context. Do not make up information.
2. If the answer is not found in the context, politely say: "I don't have that specific information in the property specifications. You may want to contact the listing agent for more details."
3. Be concise but thorough. Use bullet points for lists.
4. When quoting numbers (prices, areas, fees), be precise — use exact figures from the context.
5. Be conversational and professional in tone.
6. If the user asks a follow-up, reference the conversation history for continuity.`;

function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "No relevant property context was found.";

  return chunks
    .map(
      (chunk, i) =>
        `--- Context Chunk ${i + 1} (Section: ${chunk.section}, Relevance: ${(chunk.score * 100).toFixed(0)}%) ---\n${chunk.content}`,
    )
    .join("\n\n");
}

function buildMessages(
  request: SynthesisRequest,
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add conversation history (last 3 messages for context)
  for (const msg of request.chatHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the current query with retrieved context
  const contextBlock = buildContextBlock(request.context);
  const userPrompt = `Property Specification Context:\n${contextBlock}\n\nUser Question: ${request.query}`;

  messages.push({ role: "user", content: userPrompt });

  return messages;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as SynthesisRequest;

    // Validate request
    if (!body.query || typeof body.query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'query' field" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!Array.isArray(body.context)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'context' field" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const messages = buildMessages(body);

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.3,
          max_tokens: 800,
        }),
      },
    );

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", errText);
      return new Response(
        JSON.stringify({
          error: `OpenAI API returned ${openaiResponse.status}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const openaiData = (await openaiResponse.json()) as any;
    const answer =
      openaiData.choices?.[0]?.message?.content ??
      "I was unable to generate an answer. Please try again.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
