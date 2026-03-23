"use client";

import { useRef, useCallback, useMemo } from "react";

interface UseAudioPlaybackReturn {
  init: () => void;
  enqueue: (float32: Float32Array) => void;
  flush: () => void;
  stopPlayback: () => void;
  getAnalyserNode: () => AnalyserNode | null;
  isPlaying: () => boolean;
}

export function useAudioPlayback(
  onPlaybackEnd?: () => void
): UseAudioPlaybackReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const playingRef = useRef(false);
  const doneSignalRef = useRef(false);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  onPlaybackEndRef.current = onPlaybackEnd;

  const init = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      const ctx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      nextPlayTimeRef.current = 0;
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  const enqueue = useCallback((float32: Float32Array) => {
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) {
      console.warn("[AudioPlayback] No AudioContext, cannot enqueue");
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    playingRef.current = true;
    doneSignalRef.current = false;

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    const now = ctx.currentTime;
    const startTime = Math.max(nextPlayTimeRef.current, now);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.add(source);

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (doneSignalRef.current && activeSourcesRef.current.size === 0) {
        playingRef.current = false;
        onPlaybackEndRef.current?.();
      }
    };
  }, []);

  const flush = useCallback(() => {
    doneSignalRef.current = true;
    if (activeSourcesRef.current.size === 0) {
      playingRef.current = false;
      onPlaybackEndRef.current?.();
    }
  }, []);

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;
    playingRef.current = false;
    doneSignalRef.current = false;
  }, []);

  const getAnalyserNode = useCallback(() => analyserRef.current, []);

  const isPlaying = useCallback(() => playingRef.current, []);

  return useMemo(
    () => ({ init, enqueue, flush, stopPlayback, getAnalyserNode, isPlaying }),
    [init, enqueue, flush, stopPlayback, getAnalyserNode, isPlaying]
  );
}
