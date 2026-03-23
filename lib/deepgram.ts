export type DeepgramEvent =
  | { type: "TurnInfo"; event: "StartOfTurn"; transcript: string }
  | { type: "TurnInfo"; event: "Update"; transcript: string }
  | { type: "TurnInfo"; event: "EndOfTurn"; transcript: string; end_of_turn_confidence: number }
  | { type: "TurnInfo"; event: "EagerEndOfTurn"; transcript: string };

export interface DeepgramManager {
  connect: () => Promise<void>;
  sendAudio: (data: ArrayBuffer) => void;
  close: () => void;
  isConnected: () => boolean;
}

export function createDeepgramManager(
  apiKey: string,
  onTranscript: (event: DeepgramEvent) => void,
  onError: (error: string) => void,
  onClose: () => void
): DeepgramManager {
  let ws: WebSocket | null = null;

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url =
        "wss://api.deepgram.com/v2/listen?model=flux-general-en&encoding=linear16&sample_rate=16000&eot_threshold=0.7&eot_timeout_ms=5000";

      ws = new WebSocket(url, ["token", apiKey]);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        console.log("[Deepgram] Connected");
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "TurnInfo") {
            onTranscript(data as DeepgramEvent);
          }
        } catch (e) {
          console.error("[Deepgram] Parse error:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("[Deepgram] WebSocket error:", event);
        onError("Deepgram connection error. Check your API key.");
        reject(new Error("Deepgram connection failed"));
      };

      ws.onclose = () => {
        console.log("[Deepgram] Disconnected");
        onClose();
      };
    });
  }

  function sendAudio(data: ArrayBuffer) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }

  function close() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "CloseStream" }));
      } catch {
        // ignore
      }
      ws.close();
    }
    ws = null;
  }

  function isConnected() {
    return ws !== null && ws.readyState === WebSocket.OPEN;
  }

  return { connect, sendAudio, close, isConnected };
}

export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}
