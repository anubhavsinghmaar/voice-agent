"use client";

import { useRef, useCallback, useMemo } from "react";
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
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const nativeSampleRate = audioContext.sampleRate;
      console.log("[AudioCapture] Native sample rate:", nativeSampleRate);

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);

        let samples: Float32Array;
        if (nativeSampleRate === 16000) {
          samples = new Float32Array(channelData.length);
          samples.set(channelData);
        } else {
          const ratio = nativeSampleRate / 16000;
          const newLength = Math.floor(channelData.length / ratio);
          samples = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            samples[i] = channelData[Math.floor(i * ratio)];
          }
        }

        const int16 = float32ToInt16(samples);
        onChunk(int16.buffer as ArrayBuffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      console.log("[AudioCapture] Started, sending PCM16 at 16kHz");
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
    console.log("[AudioCapture] Stopped");
  }, []);

  const getAnalyserNode = useCallback(() => analyserRef.current, []);

  // Return a stable reference so useEffect deps don't cause re-runs
  return useMemo(
    () => ({ start, stop, getAnalyserNode }),
    [start, stop, getAnalyserNode]
  );
}
