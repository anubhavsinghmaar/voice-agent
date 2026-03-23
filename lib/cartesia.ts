export interface CartesiaManager {
  connect: () => void;
  speak: (text: string) => void;
  stop: () => void;
  close: () => void;
  isConnected: () => boolean;
}

export function createCartesiaManager(
  apiKey: string,
  onAudioChunk: (float32: Float32Array) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onClose: () => void
): CartesiaManager {
  let ws: WebSocket | null = null;
  let contextCounter = 0;

  function connect() {
    const url = `wss://api.cartesia.ai/tts/websocket?api_key=${apiKey}&cartesia_version=2025-04-16`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[Cartesia] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "chunk" && data.data) {
          const binaryStr = atob(data.data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const float32 = new Float32Array(bytes.buffer as ArrayBuffer);
          onAudioChunk(float32);
        } else if (data.type === "done") {
          onDone();
        } else if (data.error) {
          onError(data.error);
        }
      } catch (e) {
        console.error("[Cartesia] Parse error:", e);
      }
    };

    ws.onerror = (event) => {
      console.error("[Cartesia] WebSocket error:", event);
      onError("Cartesia connection error. Check your API key.");
    };

    ws.onclose = () => {
      console.log("[Cartesia] Disconnected");
      onClose();
    };
  }

  function speak(text: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      onError("Cartesia WebSocket is not connected.");
      return;
    }

    contextCounter++;
    const contextId = `ctx-${Date.now()}-${contextCounter}`;

    const request = {
      model_id: "sonic-2024-10-19",
      transcript: text,
      voice: {
        mode: "id",
        id: "a0e99841-438c-4a64-b679-ae501e7d6091",
      },
      language: "en",
      context_id: contextId,
      output_format: {
        container: "raw",
        encoding: "pcm_f32le",
        sample_rate: 24000,
      },
      add_timestamps: false,
      continue: false,
    };

    ws.send(JSON.stringify(request));
  }

  function stop() {
    // Reconnect to cancel any in-progress generation
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    connect();
  }

  function close() {
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function isConnected() {
    return ws !== null && ws.readyState === WebSocket.OPEN;
  }

  return { connect, speak, stop, close, isConnected };
}
