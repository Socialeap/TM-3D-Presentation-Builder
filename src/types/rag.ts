// ── Web Worker Message Protocol ──────────────────────────────────────────────

export interface EmbeddingRequest {
  type: "embed";
  id: string;
  texts: string[];
}

export interface EmbeddingResponse {
  type: "embed-result";
  id: string;
  embeddings: number[][];
}

export interface WorkerReadyMessage {
  type: "ready";
}

export interface WorkerProgressMessage {
  type: "progress";
  status: string;
  /** 0-100 progress percentage, if available */
  progress?: number;
}

export interface WorkerErrorMessage {
  type: "error";
  id?: string;
  message: string;
}

/** Messages sent FROM the worker TO the main thread */
export type WorkerOutboundMessage =
  | EmbeddingResponse
  | WorkerReadyMessage
  | WorkerProgressMessage
  | WorkerErrorMessage;

/** Messages sent FROM the main thread TO the worker */
export type WorkerInboundMessage = EmbeddingRequest;

// ── Orama Document Schema ────────────────────────────────────────────────────

export interface PropertyChunk {
  id: string;
  section: string;
  content: string;
  embedding: number[];
}

// ── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RetrievedChunk {
  section: string;
  content: string;
  score: number;
}

// ── Synthesis API ────────────────────────────────────────────────────────────

export interface SynthesisRequest {
  query: string;
  chatHistory: ChatMessage[];
  context: RetrievedChunk[];
}

export interface SynthesisResponse {
  answer: string;
}

// ── RAG Pipeline Status ──────────────────────────────────────────────────────

export type RAGStatus =
  | "idle"
  | "loading-model"
  | "indexing"
  | "ready"
  | "searching"
  | "synthesizing"
  | "error";
