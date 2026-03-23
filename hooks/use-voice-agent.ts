"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getApiKeys } from "@/lib/api-keys";
import { createDeepgramManager, type DeepgramManager } from "@/lib/deepgram";
import { initGemini, generateResponse } from "@/lib/gemini";
import { createCartesiaManager, type CartesiaManager } from "@/lib/cartesia";
import { useAudioCapture } from "./use-audio-capture";
import { useAudioPlayback } from "./use-audio-playback";

export type AgentState = "IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING";

export function useVoiceAgent() {
  const [state, setState] = useState<AgentState>("IDLE");
  const [transcript, setTranscript] = useState("");
  const [agentText, setAgentText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deepgramRef = useRef<DeepgramManager | null>(null);
  const cartesiaRef = useRef<CartesiaManager | null>(null);
  const initializedRef = useRef(false);

  const audioCapture = useAudioCapture();

  const onPlaybackEnd = useCallback(() => {
    setState("IDLE");
  }, []);

  const audioPlayback = useAudioPlayback(onPlaybackEnd);

  const initServices = useCallback(() => {
    if (initializedRef.current) return;
    const keys = getApiKeys();
    if (!keys) return;

    initGemini(keys.gemini);

    cartesiaRef.current = createCartesiaManager(
      keys.cartesia,
      (float32) => {
        audioPlayback.enqueue(float32);
      },
      () => {
        audioPlayback.flush();
      },
      (err) => {
        setError(err);
        setState("IDLE");
      },
      () => {
        console.log("[VoiceAgent] Cartesia closed");
      }
    );
    cartesiaRef.current.connect();

    audioPlayback.init();
    initializedRef.current = true;
  }, [audioPlayback]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      const keys = getApiKeys();
      if (!keys) {
        setError("API keys not configured.");
        return;
      }

      if (!initializedRef.current) {
        initServices();
      }

      // If speaking, interrupt
      if (state === "SPEAKING") {
        audioPlayback.stopPlayback();
        cartesiaRef.current?.stop();
      }

      setTranscript("");

      deepgramRef.current = createDeepgramManager(
        keys.deepgram,
        async (event) => {
          if (event.event === "Update" || event.event === "StartOfTurn") {
            setTranscript(event.transcript);
          } else if (event.event === "EndOfTurn") {
            setTranscript(event.transcript);
            const finalTranscript = event.transcript;

            // Stop listening
            audioCapture.stop();
            deepgramRef.current?.close();
            deepgramRef.current = null;

            if (!finalTranscript.trim()) {
              setState("IDLE");
              return;
            }

            // Process with Gemini
            setState("PROCESSING");
            try {
              const response = await generateResponse(finalTranscript);
              setAgentText(response);

              // Speak with Cartesia
              setState("SPEAKING");
              if (!cartesiaRef.current?.isConnected()) {
                cartesiaRef.current?.connect();
                // Small delay for connection
                await new Promise((r) => setTimeout(r, 500));
              }
              cartesiaRef.current?.speak(response);
            } catch (err) {
              console.error("[VoiceAgent] Gemini error:", err);
              setError("Sorry, I could not process that. Please try again.");
              setState("IDLE");
            }
          }
        },
        (err) => {
          setError(err);
          setState("IDLE");
        },
        () => {
          console.log("[VoiceAgent] Deepgram closed");
        }
      );

      deepgramRef.current.connect();
      // Small delay for WebSocket to connect
      await new Promise((r) => setTimeout(r, 300));

      await audioCapture.start((pcm16) => {
        deepgramRef.current?.sendAudio(pcm16);
      });

      setState("LISTENING");
    } catch (err) {
      console.error("[VoiceAgent] Start error:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        setError("Failed to start listening. Please try again.");
      }
      setState("IDLE");
    }
  }, [state, audioCapture, audioPlayback, initServices]);

  const stopListening = useCallback(() => {
    audioCapture.stop();
    deepgramRef.current?.close();
    deepgramRef.current = null;
    setState("IDLE");
  }, [audioCapture]);

  const toggleMic = useCallback(() => {
    if (state === "IDLE") {
      startListening();
    } else if (state === "LISTENING") {
      stopListening();
    } else if (state === "SPEAKING") {
      // Barge in: interrupt and start listening
      startListening();
    }
  }, [state, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioCapture.stop();
      deepgramRef.current?.close();
      cartesiaRef.current?.close();
      audioPlayback.stopPlayback();
    };
  }, [audioCapture, audioPlayback]);

  return {
    state,
    transcript,
    agentText,
    error,
    toggleMic,
    initServices,
    getCaptureAnalyser: audioCapture.getAnalyserNode,
    getPlaybackAnalyser: audioPlayback.getAnalyserNode,
  };
}
