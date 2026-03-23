"use client";

import React, { useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { hasApiKeys } from "@/lib/api-keys";
import { ApiConfigModal } from "@/components/config/api-config-modal";

const Aurora = lazy(() => import("@/components/ui/aurora"));

export function Hero() {
  const router = useRouter();
  const [showConfig, setShowConfig] = useState(false);

  function handleGetStarted() {
    if (hasApiKeys()) {
      router.push("/agent");
    } else {
      setShowConfig(true);
    }
  }

  function handleConfigSave() {
    router.push("/agent");
  }

  return (
    <>
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black md:flex-row">
        {/* Aurora background — pinned to top, reduced height */}
        <div className="absolute inset-x-0 top-0 z-0 h-[35vh]">
          <Suspense fallback={null}>
            <Aurora
              colorStops={["#66c4ff", "#B19EEF", "#626fd0"]}
              blend={0.5}
              amplitude={1.0}
              speed={1}
            />
          </Suspense>
          {/* Fade out at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        </div>

        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

        {/* Spline 3D scene — shifted right and slightly smaller */}
        <div className="absolute inset-0 z-[1]" style={{ left: "10%", transform: "scale(0.85)", transformOrigin: "center center" }}>
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>

        {/* Left: Hero text — on top of Spline, pointer-events only on interactive elements */}
        <div className="relative z-[2] flex flex-1 flex-col justify-center p-8 pointer-events-none md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl font-bold md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent">
                Your{" "}
              </span>
              <br />
              <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent">
                AI Voice Assistant
              </span>
            </h1>

            {/* Handwritten "Personal" annotation with arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: -3 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="relative mt-2 ml-2 inline-block"
            >
              {/* Arrow pointing up-right toward "Your" */}
              <svg
                width="40"
                height="50"
                viewBox="0 0 40 50"
                fill="none"
                className="absolute -top-12 left-16"
                style={{ transform: "rotate(10deg)" }}
              >
                <path
                  d="M20 48 C18 30, 10 15, 8 5"
                  stroke="url(#arrowGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M3 12 L8 4 L14 10"
                  stroke="url(#arrowGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#66c4ff" />
                    <stop offset="100%" stopColor="#B19EEF" />
                  </linearGradient>
                </defs>
              </svg>

              <span
                className="bg-gradient-to-r from-[#66c4ff] via-[#B19EEF] to-[#626fd0] bg-clip-text text-transparent text-4xl md:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-caveat), cursive" }}
              >
                Personal
              </span>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 max-w-lg text-base text-neutral-300/80 md:text-lg"
          >
            Experience natural conversations powered by cutting edge speech
            recognition, language understanding, and voice synthesis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-8"
          >
            <button
              onClick={handleGetStarted}
              className="pointer-events-auto group relative overflow-hidden rounded-xl border border-white/[0.15] bg-white/[0.06] px-8 py-3 text-base font-semibold text-white backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/[0.25] hover:bg-white/[0.12] hover:px-10 hover:shadow-[0_0_40px_rgba(177,158,239,0.15)]"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#66c4ff]/10 via-[#B19EEF]/10 to-[#626fd0]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </button>
          </motion.div>
        </div>
      </div>

      <ApiConfigModal
        open={showConfig}
        onOpenChange={setShowConfig}
        onSave={handleConfigSave}
      />
    </>
  );
}
