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

  const stateRef = useRef<AgentState>("IDLE");
  const deepgramRef = useRef<DeepgramManager | null>(null);
  const cartesiaRef = useRef<CartesiaManager | null>(null);
  const initializedRef = useRef(false);
  const audioBufferQueue = useRef<ArrayBuffer[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const audioCapture = useAudioCapture();

  const onPlaybackEnd = useCallback(() => {
    console.log("[VoiceAgent] Playback ended");
    setState("IDLE");
  }, []);

  const audioPlayback = useAudioPlayback(onPlaybackEnd);

  const initServices = useCallback(() => {
    if (initializedRef.current) return;
    const keys = getApiKeys();
    if (!keys) return;

    console.log("[VoiceAgent] Initializing services...");
    initGemini(keys.gemini);
    audioPlayback.init();
    initializedRef.current = true;
  }, [audioPlayback]);

  const processAndSpeak = useCallback(
    async (finalTranscript: string) => {
      setState("PROCESSING");
      console.log("[VoiceAgent] Processing:", finalTranscript);

      try {
        const response = await generateResponse(finalTranscript);
        console.log("[VoiceAgent] Gemini response:", response);
        setAgentText(response);

        const keys = getApiKeys();
        if (!keys) throw new Error("No API keys");

        cartesiaRef.current?.close();

        cartesiaRef.current = createCartesiaManager(
          keys.cartesia,
          (float32) => {
            audioPlayback.enqueue(float32);
          },
          () => {
            console.log("[VoiceAgent] Cartesia done signal");
            audioPlayback.flush();
          },
          (err) => {
            console.error("[VoiceAgent] Cartesia error:", err);
            setError(err);
            setState("IDLE");
          },
          () => {
            console.log("[VoiceAgent] Cartesia closed");
          }
        );

        await cartesiaRef.current.connect();
        console.log("[VoiceAgent] Cartesia connected, speaking...");

        setState("SPEAKING");
        audioPlayback.init();
        cartesiaRef.current.speak(response);
      } catch (err) {
        console.error("[VoiceAgent] Process/speak error:", err);
        setError("Sorry, I could not process that. Please try again.");
        setState("IDLE");
      }
    },
    [audioPlayback]
  );

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

      if (stateRef.current === "SPEAKING") {
        audioPlayback.stopPlayback();
        cartesiaRef.current?.stop();
      }

      if (deepgramRef.current) {
        deepgramRef.current.close();
        deepgramRef.current = null;
      }

      setTranscript("");
      audioBufferQueue.current = [];

      // Step 1: Start microphone FIRST so audio is flowing
      console.log("[VoiceAgent] Starting audio capture first...");
      await audioCapture.start((pcm16) => {
        // If Deepgram is connected, send directly. Otherwise buffer.
        if (deepgramRef.current?.isConnected()) {
          deepgramRef.current.sendAudio(pcm16);
        } else {
          audioBufferQueue.current.push(pcm16);
        }
      });
      console.log("[VoiceAgent] Audio capture running");

      // Step 2: Now connect to Deepgram (audio is already buffering)
      console.log("[VoiceAgent] Connecting to Deepgram...");
      deepgramRef.current = createDeepgramManager(
        keys.deepgram,
        (event) => {
          console.log(
            "[VoiceAgent] Deepgram event:",
            event.event,
            "transcript:",
            event.transcript?.slice(0, 50)
          );

          if (event.event === "Update" || event.event === "StartOfTurn") {
            setTranscript(event.transcript);
          } else if (event.event === "EndOfTurn") {
            setTranscript(event.transcript);
            const text = event.transcript;

            audioCapture.stop();
            deepgramRef.current?.close();
            deepgramRef.current = null;

            if (!text.trim()) {
              setState("IDLE");
              return;
            }

            processAndSpeak(text);
          }
        },
        (err) => {
          console.error("[VoiceAgent] Deepgram error:", err);
          setError(err);
          audioCapture.stop();
          setState("IDLE");
        },
        () => {
          console.log("[VoiceAgent] Deepgram closed");
        }
      );

      await deepgramRef.current.connect();
      console.log("[VoiceAgent] Deepgram connected");

      // Step 3: Flush buffered audio immediately
      const buffered = audioBufferQueue.current;
      console.log("[VoiceAgent] Flushing", buffered.length, "buffered chunks");
      for (const chunk of buffered) {
        deepgramRef.current.sendAudio(chunk);
      }
      audioBufferQueue.current = [];

      setState("LISTENING");
      console.log("[VoiceAgent] Now listening");
    } catch (err) {
      console.error("[VoiceAgent] Start error:", err);
      audioCapture.stop();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        setError(
          "Failed to start listening. " +
            (err instanceof Error ? err.message : "")
        );
      }
      setState("IDLE");
    }
  }, [audioCapture, audioPlayback, initServices, processAndSpeak]);

  const stopListening = useCallback(() => {
    audioCapture.stop();
    deepgramRef.current?.close();
    deepgramRef.current = null;
    setState("IDLE");
  }, [audioCapture]);

  const toggleMic = useCallback(() => {
    const current = stateRef.current;
    console.log("[VoiceAgent] toggleMic, state:", current);

    if (current === "IDLE") {
      startListening();
    } else if (current === "LISTENING") {
      stopListening();
    } else if (current === "SPEAKING") {
      startListening();
    }
  }, [startListening, stopListening]);

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
