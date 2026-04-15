import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkerOutboundMessage, WorkerInboundMessage } from "../types/rag";

interface PendingRequest {
  resolve: (embeddings: number[][]) => void;
  reject: (error: Error) => void;
}

interface EmbeddingWorkerState {
  ready: boolean;
  loading: boolean;
  progress: string;
  error: string | null;
}

/**
 * React hook that manages the lifecycle of the embedding Web Worker.
 * Returns a function to request embeddings and the current worker status.
 */
export function useEmbeddingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const idCounterRef = useRef(0);

  const [state, setState] = useState<EmbeddingWorkerState>({
    ready: false,
    loading: true,
    progress: "Initializing embedding worker...",
    error: null,
  });

  useEffect(() => {
    // Vite worker import — produces a dedicated Worker from the TS source
    const worker = new Worker(
      new URL("../workers/embedding.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case "ready":
          setState({ ready: true, loading: false, progress: "Model loaded", error: null });
          break;

        case "progress":
          setState((prev) => ({
            ...prev,
            loading: true,
            progress: msg.status,
          }));
          break;

        case "embed-result": {
          const pending = pendingRef.current.get(msg.id);
          if (pending) {
            pending.resolve(msg.embeddings);
            pendingRef.current.delete(msg.id);
          }
          break;
        }

        case "error": {
          if (msg.id) {
            const pending = pendingRef.current.get(msg.id);
            if (pending) {
              pending.reject(new Error(msg.message));
              pendingRef.current.delete(msg.id);
            }
          } else {
            setState({
              ready: false,
              loading: false,
              progress: "",
              error: msg.message,
            });
          }
          break;
        }
      }
    };

    worker.onerror = (err) => {
      setState({
        ready: false,
        loading: false,
        progress: "",
        error: `Worker error: ${err.message}`,
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      // Reject any pending requests
      for (const [, pending] of pendingRef.current) {
        pending.reject(new Error("Worker terminated"));
      }
      pendingRef.current.clear();
    };
  }, []);

  /**
   * Request embeddings for an array of text strings.
   * Returns a promise that resolves with the embedding vectors.
   */
  const embed = useCallback(async (texts: string[]): Promise<number[][]> => {
    const worker = workerRef.current;
    if (!worker) {
      throw new Error("Embedding worker not available");
    }

    const id = `req-${++idCounterRef.current}`;

    return new Promise<number[][]>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });

      const message: WorkerInboundMessage = { type: "embed", id, texts };
      worker.postMessage(message);
    });
  }, []);

  return { embed, ...state };
}
