"use client";

import { useRef, useCallback } from "react";
import { float32ToInt16 } from "@/lib/deepgram";

interface UseAudioCaptureReturn {
  start: (onChunk: (pcm16: ArrayBuffer) => void) => Promise<void>;
  stop: () => void;
  getAnalyserNode: () => AnalyserNode | null;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const start = useCallback(
    async (onChunk: (pcm16: ArrayBuffer) => void) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        const float32Copy = new Float32Array(channelData.length);
        float32Copy.set(channelData);
        const int16 = float32ToInt16(float32Copy);
        onChunk(int16.buffer as ArrayBuffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    },
    []
  );

  const stop = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const getAnalyserNode = useCallback(() => analyserRef.current, []);

  return { start, stop, getAnalyserNode };
}
