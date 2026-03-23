"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { AgentState } from "@/hooks/use-voice-agent";

interface WaveVisualizerProps {
  state: AgentState;
  getCaptureAnalyser: () => AnalyserNode | null;
  getPlaybackAnalyser: () => AnalyserNode | null;
}

export function WaveVisualizer({
  state,
  getCaptureAnalyser,
  getPlaybackAnalyser,
}: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const getColor = useCallback(() => {
    switch (state) {
      case "LISTENING":
        return { r: 59, g: 130, b: 246 }; // blue
      case "PROCESSING":
        return { r: 245, g: 158, b: 11 }; // amber
      case "SPEAKING":
        return { r: 34, g: 197, b: 94 }; // green
      default:
        return { r: 115, g: 115, b: 115 }; // neutral
    }
  }, [state]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.25;

    ctx.clearRect(0, 0, width, height);
    timeRef.current += 0.02;

    // Get frequency data from the appropriate analyser
    let dataArray: Uint8Array | null = null;
    const analyser =
      state === "LISTENING"
        ? getCaptureAnalyser()
        : state === "SPEAKING"
          ? getPlaybackAnalyser()
          : null;

    if (analyser) {
      const arr = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(arr);
      dataArray = arr as unknown as Uint8Array<ArrayBuffer>;
    }

    const numBars = 64;
    const color = getColor();

    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2;

      let amplitude = 0;
      if (dataArray) {
        const dataIndex = Math.floor((i / numBars) * dataArray.length);
        amplitude = dataArray[dataIndex] / 255;
      }

      // Idle animation: gentle sine wave
      const idleWave =
        Math.sin(timeRef.current * 2 + i * 0.3) * 0.15 +
        Math.sin(timeRef.current * 1.5 + i * 0.5) * 0.1;

      // Processing: pulsing animation
      const processingPulse =
        state === "PROCESSING"
          ? Math.sin(timeRef.current * 4) * 0.3 + 0.3
          : 0;

      const finalAmplitude = Math.max(amplitude, idleWave + 0.05, processingPulse);
      const barLength = baseRadius * 0.5 * finalAmplitude;

      const innerR = baseRadius;
      const outerR = baseRadius + barLength;

      const x1 = centerX + Math.cos(angle) * innerR;
      const y1 = centerY + Math.sin(angle) * innerR;
      const x2 = centerX + Math.cos(angle) * outerR;
      const y2 = centerY + Math.sin(angle) * outerR;

      const alpha = 0.4 + finalAmplitude * 0.6;
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Inner glow circle
    const glowAlpha = state === "IDLE" ? 0.05 : 0.1;
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      baseRadius
    );
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha * 2})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [state, getCaptureAnalyser, getPlaybackAnalyser, getColor]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="h-80 w-80 md:h-96 md:w-96"
      style={{ width: "100%", maxWidth: 384, aspectRatio: "1" }}
    />
  );
}
