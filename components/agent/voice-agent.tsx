"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAgent, type AgentState } from "@/hooks/use-voice-agent";
import { WaveVisualizer } from "./wave-visualizer";
import { ApiConfigModal } from "@/components/config/api-config-modal";
import { hasApiKeys } from "@/lib/api-keys";

const MagicRings = lazy(() => import("@/components/ui/magic-rings"));

function getStatusText(state: AgentState): string {
  switch (state) {
    case "LISTENING":
      return "Listening...";
    case "PROCESSING":
      return "Thinking...";
    case "SPEAKING":
      return "Speaking...";
    default:
      return "Ready \u2014 tap to speak";
  }
}

function getStatusColor(state: AgentState): string {
  switch (state) {
    case "LISTENING":
      return "text-blue-400";
    case "PROCESSING":
      return "text-amber-400";
    case "SPEAKING":
      return "text-green-400";
    default:
      return "text-neutral-400";
  }
}

export function VoiceAgent() {
  const router = useRouter();
  const [showConfig, setShowConfig] = useState(false);
  const {
    state,
    transcript,
    agentText,
    error,
    toggleMic,
    initServices,
    getCaptureAnalyser,
    getPlaybackAnalyser,
  } = useVoiceAgent();

  useEffect(() => {
    if (!hasApiKeys()) {
      setShowConfig(true);
    } else {
      initServices();
    }
  }, [initServices]);

  const isMicActive = state === "LISTENING";

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-black">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 md:p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="text-neutral-400 hover:text-neutral-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowConfig(true)}
          className="text-neutral-400 hover:text-neutral-50"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Wave visualizer */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-32">
        <div className="relative h-80 w-80 md:h-96 md:w-96">
          {/* MagicRings behind wave visualizer */}
          <Suspense fallback={null}>
            <MagicRings
              color="#fc42ff"
              colorTwo="#42fcff"
              ringCount={6}
              rotationSpeed={1.0}
              lineThickness={0.005}
              glowIntensity={1.0}
              pulseSpeed={1.0}
              className="pointer-events-none"
            />
          </Suspense>
          {/* Wave visualizer on top */}
          <div className="absolute inset-0 z-[1]">
            <WaveVisualizer
              state={state}
              getCaptureAnalyser={getCaptureAnalyser}
              getPlaybackAnalyser={getPlaybackAnalyser}
            />
          </div>
        </div>

        {/* Transcript / Agent text */}
        <div className="h-12 max-w-md px-4 text-center">
          {state === "LISTENING" && transcript && (
            <p className="text-sm text-neutral-300">{transcript}</p>
          )}
          {(state === "SPEAKING" || state === "IDLE") && agentText && (
            <p className="text-sm text-neutral-400">{agentText}</p>
          )}
        </div>

        {/* Status text */}
        <p className={`text-sm font-medium ${getStatusColor(state)}`}>
          {getStatusText(state)}
        </p>

        {/* Error */}
        {error && (
          <p className="max-w-sm px-4 text-center text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Mic button */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center">
        <button
          onClick={toggleMic}
          disabled={state === "PROCESSING"}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
            isMicActive
              ? "bg-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.5)] ring-2 ring-blue-400/50"
              : state === "PROCESSING"
                ? "cursor-not-allowed bg-neutral-800 opacity-50"
                : "bg-neutral-800 hover:bg-neutral-700 ring-1 ring-neutral-600"
          }`}
        >
          {isMicActive ? (
            <Mic className="h-6 w-6 text-white" />
          ) : (
            <MicOff className="h-6 w-6 text-neutral-200" />
          )}
          {isMicActive && (
            <span className="absolute inset-0 animate-ping rounded-full bg-blue-600 opacity-20" />
          )}
        </button>
      </div>

      <ApiConfigModal
        open={showConfig}
        onOpenChange={setShowConfig}
        onSave={() => {
          initServices();
        }}
      />
    </div>
  );
}
