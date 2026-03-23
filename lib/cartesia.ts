export interface CartesiaManager {
  connect: () => Promise<void>;
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

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://api.cartesia.ai/tts/websocket?api_key=${apiKey}&cartesia_version=2025-04-16`;

      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("[Cartesia] Connected");
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[Cartesia] Message type:", data.type, "status:", data.status_code);

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
            console.error("[Cartesia] Error:", data.error);
            onError(data.error);
          }
        } catch (e) {
          console.error("[Cartesia] Parse error:", e);
        }
      };

      ws.onerror = () => {
        console.error("[Cartesia] WebSocket error");
        onError("Cartesia connection error. Check your API key.");
        reject(new Error("Cartesia connection failed"));
      };

      ws.onclose = () => {
        console.log("[Cartesia] Disconnected");
        onClose();
      };
    });
  }

  function speak(text: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error("[Cartesia] Not connected, cannot speak");
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

    console.log("[Cartesia] Sending TTS request for:", text.slice(0, 50));
    ws.send(JSON.stringify(request));
  }

  function stop() {
    if (ws) {
      ws.close();
      ws = null;
    }
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
