/**
 * Web Worker for generating text embeddings using @xenova/transformers.
 *
 * This worker downloads and runs the all-MiniLM-L6-v2 ONNX model entirely
 * off the main thread, preventing UI freezes during the ~30 MB model download
 * and the intensive matrix math required for embedding generation.
 *
 * Protocol:
 *   Main → Worker:  { type: "embed", id, texts }
 *   Worker → Main:  { type: "embed-result", id, embeddings }
 *                   { type: "ready" }
 *                   { type: "progress", status, progress? }
 *                   { type: "error", id?, message }
 */
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from "../types/rag";

// Use dynamic import so Vite correctly bundles transformers.js for the worker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipeline: any = null;
let extractor: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

function post(msg: WorkerOutboundMessage) {
  self.postMessage(msg);
}

async function initializePipeline() {
  try {
    post({ type: "progress", status: "Downloading embedding model..." });

    // Dynamic import of transformers.js
    const { pipeline: pipelineFn, env } = await import("@xenova/transformers");
    pipeline = pipelineFn;

    // Disable local model check — always fetch from Hugging Face CDN
    env.allowLocalModels = false;

    post({ type: "progress", status: "Loading model into memory...", progress: 50 });

    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (event: { status: string; progress?: number }) => {
        if (event.progress !== undefined) {
          post({
            type: "progress",
            status: `Loading model: ${event.status}`,
            progress: Math.round(event.progress),
          });
        }
      },
    });

    post({ type: "ready" });
  } catch (err) {
    post({
      type: "error",
      message: `Failed to load embedding model: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

async function generateEmbeddings(id: string, texts: string[]) {
  if (!extractor) {
    post({ type: "error", id, message: "Model not loaded yet" });
    return;
  }

  try {
    const results: number[][] = [];

    for (const text of texts) {
      const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      // output.data is a Float32Array; convert to plain number[]
      results.push(Array.from(output.data as Float32Array));
    }

    post({ type: "embed-result", id, embeddings: results });
  } catch (err) {
    post({
      type: "error",
      id,
      message: `Embedding failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ── Message Handler ──────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case "embed":
      generateEmbeddings(msg.id, msg.texts);
      break;
    default:
      post({
        type: "error",
        message: `Unknown message type: ${(msg as { type: string }).type}`,
      });
  }
};

// ── Auto-initialize on worker start ──────────────────────────────────────────

initializePipeline();
