import { useCallback, useEffect, useRef, useState } from "react";
import { useEmbeddingWorker } from "./useEmbeddingWorker";
import { initSearchEngine, indexChunks, hybridSearch, resetSearchEngine } from "../lib/search-engine";
import { synthesizeAnswer } from "../lib/synthesis-client";
import { chunkPropertySpec, SAMPLE_PROPERTY_SPEC } from "../data/sample-property";
import type { ChatMessage, PropertyChunk, RAGStatus, RetrievedChunk } from "../types/rag";

interface RAGPipelineState {
  status: RAGStatus;
  statusMessage: string;
  messages: ChatMessage[];
  lastRetrievedChunks: RetrievedChunk[];
}

/**
 * Orchestrates the full RAG pipeline:
 *   1. Embedding worker initialization (Phase 1)
 *   2. Document chunking + indexing into Orama (Phase 2)
 *   3. Query embedding → hybrid search → synthesis (Phases 3+4)
 */
export function useRAGPipeline() {
  const { embed, ready: workerReady, loading: workerLoading, progress: workerProgress, error: workerError } =
    useEmbeddingWorker();

  const indexedRef = useRef(false);

  const [state, setState] = useState<RAGPipelineState>({
    status: "loading-model",
    statusMessage: "Initializing embedding model...",
    messages: [],
    lastRetrievedChunks: [],
  });

  // ── Step 1+2: Once worker is ready, chunk & index the property spec ──────
  useEffect(() => {
    if (!workerReady || indexedRef.current) return;
    indexedRef.current = true;

    (async () => {
      try {
        setState((prev) => ({
          ...prev,
          status: "indexing",
          statusMessage: "Indexing property specifications...",
        }));

        // Initialize Orama
        await initSearchEngine();

        // Chunk the sample property spec
        const rawChunks = chunkPropertySpec(SAMPLE_PROPERTY_SPEC);

        // Generate embeddings for all chunks in a single batch
        const texts = rawChunks.map((c) => c.content);
        const embeddings = await embed(texts);

        // Build PropertyChunk objects with embeddings
        const propertyChunks: PropertyChunk[] = rawChunks.map((chunk, i) => ({
          id: `chunk-${i}`,
          section: chunk.section,
          content: chunk.content,
          embedding: embeddings[i],
        }));

        // Insert into Orama
        await indexChunks(propertyChunks);

        setState((prev) => ({
          ...prev,
          status: "ready",
          statusMessage: `Indexed ${propertyChunks.length} property sections. Ask me anything!`,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "error",
          statusMessage: `Indexing failed: ${err instanceof Error ? err.message : String(err)}`,
        }));
      }
    })();
  }, [workerReady, embed]);

  // ── Reflect worker loading state ──────────────────────────────────────────
  useEffect(() => {
    if (workerLoading) {
      setState((prev) => ({
        ...prev,
        status: "loading-model",
        statusMessage: workerProgress,
      }));
    }
  }, [workerLoading, workerProgress]);

  // ── Reflect worker errors ─────────────────────────────────────────────────
  useEffect(() => {
    if (workerError) {
      setState((prev) => ({
        ...prev,
        status: "error",
        statusMessage: workerError,
      }));
    }
  }, [workerError]);

  // ── Step 3+4: Handle user query ──────────────────────────────────────────
  const sendMessage = useCallback(
    async (query: string) => {
      if (state.status !== "ready" && state.status !== "searching" && state.status !== "synthesizing") {
        return;
      }

      const userMessage: ChatMessage = { role: "user", content: query };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        status: "searching",
        statusMessage: "Searching property specs...",
      }));

      try {
        // Generate query embedding
        const [queryEmbedding] = await embed([query]);

        // Hybrid search: BM25 + vector
        const retrievedChunks = await hybridSearch(query, queryEmbedding, 3);

        setState((prev) => ({
          ...prev,
          status: "synthesizing",
          statusMessage: "Generating answer...",
          lastRetrievedChunks: retrievedChunks,
        }));

        // Get current messages for context (including the new user message)
        const currentMessages = [...state.messages, userMessage];

        // Synthesize answer
        const answer = await synthesizeAnswer(query, currentMessages, retrievedChunks);

        const assistantMessage: ChatMessage = { role: "assistant", content: answer };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          status: "ready",
          statusMessage: "Ready",
        }));
      } catch (err) {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : String(err)}. Please try again.`,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          status: "ready",
          statusMessage: "Ready (last query had an error)",
        }));
      }
    },
    [embed, state.messages, state.status],
  );

  // ── Reset chat ────────────────────────────────────────────────────────────
  const resetChat = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      messages: [],
      lastRetrievedChunks: [],
      status: "ready",
      statusMessage: "Chat cleared. Ask me anything!",
    }));
  }, []);

  // ── Re-index with new property data ───────────────────────────────────────
  const reindex = useCallback(
    async (markdown: string) => {
      setState((prev) => ({
        ...prev,
        status: "indexing",
        statusMessage: "Re-indexing property specifications...",
        messages: [],
        lastRetrievedChunks: [],
      }));

      try {
        await resetSearchEngine();

        const rawChunks = chunkPropertySpec(markdown);
        const texts = rawChunks.map((c) => c.content);
        const embeddings = await embed(texts);

        const propertyChunks: PropertyChunk[] = rawChunks.map((chunk, i) => ({
          id: `chunk-${i}`,
          section: chunk.section,
          content: chunk.content,
          embedding: embeddings[i],
        }));

        await indexChunks(propertyChunks);

        setState((prev) => ({
          ...prev,
          status: "ready",
          statusMessage: `Re-indexed ${propertyChunks.length} sections. Ask me anything!`,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "error",
          statusMessage: `Re-indexing failed: ${err instanceof Error ? err.message : String(err)}`,
        }));
      }
    },
    [embed],
  );

  return {
    ...state,
    sendMessage,
    resetChat,
    reindex,
    isReady: state.status === "ready",
    isBusy: state.status === "searching" || state.status === "synthesizing",
  };
}
