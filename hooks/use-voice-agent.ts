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

  // Keep stateRef in sync
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
    console.log("[VoiceAgent] Services initialized");
  }, [audioPlayback]);

  const processAndSpeak = useCallback(
    async (finalTranscript: string) => {
      setState("PROCESSING");
      console.log("[VoiceAgent] Processing transcript:", finalTranscript);

      try {
        const response = await generateResponse(finalTranscript);
        console.log("[VoiceAgent] Gemini response:", response);
        setAgentText(response);

        // Connect Cartesia fresh for each utterance
        const keys = getApiKeys();
        if (!keys) throw new Error("No API keys");

        // Close old connection if any
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
        audioPlayback.init(); // Ensure AudioContext is active
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

      // If speaking, interrupt
      if (stateRef.current === "SPEAKING") {
        audioPlayback.stopPlayback();
        cartesiaRef.current?.stop();
      }

      // Clean up previous Deepgram connection
      if (deepgramRef.current) {
        deepgramRef.current.close();
        deepgramRef.current = null;
      }

      setTranscript("");

      deepgramRef.current = createDeepgramManager(
        keys.deepgram,
        (event) => {
          console.log("[VoiceAgent] Deepgram event:", event.event, event.transcript);

          if (event.event === "Update" || event.event === "StartOfTurn") {
            setTranscript(event.transcript);
          } else if (event.event === "EndOfTurn") {
            setTranscript(event.transcript);
            const text = event.transcript;

            // Stop listening first
            audioCapture.stop();
            deepgramRef.current?.close();
            deepgramRef.current = null;

            if (!text.trim()) {
              setState("IDLE");
              return;
            }

            // Fire and forget the async processing (errors handled inside)
            processAndSpeak(text);
          }
        },
        (err) => {
          console.error("[VoiceAgent] Deepgram error:", err);
          setError(err);
          setState("IDLE");
        },
        () => {
          console.log("[VoiceAgent] Deepgram closed");
        }
      );

      console.log("[VoiceAgent] Connecting to Deepgram...");
      await deepgramRef.current.connect();
      console.log("[VoiceAgent] Deepgram connected, starting audio capture...");

      await audioCapture.start((pcm16) => {
        deepgramRef.current?.sendAudio(pcm16);
      });

      console.log("[VoiceAgent] Audio capture started");
      setState("LISTENING");
    } catch (err) {
      console.error("[VoiceAgent] Start error:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else {
        setError(
          "Failed to start listening. Please try again. " +
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
    console.log("[VoiceAgent] toggleMic, current state:", current);

    if (current === "IDLE") {
      startListening();
    } else if (current === "LISTENING") {
      stopListening();
    } else if (current === "SPEAKING") {
      startListening();
    }
  }, [startListening, stopListening]);

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
