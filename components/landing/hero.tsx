"use client";

import React, { useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { hasApiKeys } from "@/lib/api-keys";
import { ApiConfigModal } from "@/components/config/api-config-modal";

const Aurora = lazy(() => import("@/components/ui/aurora"));
const ShapeBlur = lazy(() => import("@/components/ui/shape-blur"));

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
        {/* Aurora background — pinned to top */}
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

        {/* Spline 3D scene — shifted LEFT */}
        <div
          className="absolute inset-0 z-[1]"
          style={{ left: "-5%", transform: "scale(0.82)", transformOrigin: "center center" }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>

        {/* Hero text — shifted down to avoid aurora overlap */}
        <div className="relative z-[2] flex flex-1 flex-col justify-center p-8 pt-[28vh] pointer-events-none md:p-16 md:pt-[28vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Line 1: Your [Personal with arrow] AI Voice */}
            <h1 className="text-4xl font-bold md:text-6xl lg:text-7xl leading-tight">
              <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent">
                Your{" "}
              </span>

              {/* Inline "Personal" with upward arrow pointing to it */}
              <span className="relative inline-block mx-1 align-baseline">
                {/* Arrow — positioned above "Personal", pointing down toward it */}
                <motion.svg
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                  width="50"
                  height="36"
                  viewBox="0 0 50 36"
                  fill="none"
                  className="absolute -top-9 left-1/2 -translate-x-1/2 md:-top-11"
                >
                  {/* Curved arrow line pointing downward */}
                  <path
                    d="M25 2 C22 10, 18 18, 24 32"
                    stroke="url(#arrowGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Arrowhead at bottom */}
                  <path
                    d="M19 27 L24 34 L29 27"
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
                </motion.svg>

                <motion.span
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#66c4ff] via-[#B19EEF] to-[#626fd0] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-7xl"
                  style={{ fontFamily: "var(--font-caveat), cursive" }}
                >
                  Personal
                </motion.span>
              </span>

              <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent">
                {" "}AI Voice
              </span>

              {/* Line 2: Assistant */}
              <br />
              <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent">
                Assistant
              </span>
            </h1>
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

          {/* Get Started button with ShapeBlur effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-8"
          >
            <button
              onClick={handleGetStarted}
              className="pointer-events-auto group relative overflow-hidden rounded-xl border border-white/[0.15] bg-white/[0.04] px-8 py-3 text-base font-semibold text-white transition-all duration-500 hover:scale-105 hover:border-white/[0.25] hover:shadow-[0_0_40px_rgba(177,158,239,0.15)]"
              style={{ minWidth: 180, minHeight: 52 }}
            >
              {/* ShapeBlur shader overlay */}
              <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-70 transition-opacity duration-500">
                <Suspense fallback={null}>
                  <ShapeBlur
                    variation={0}
                    pixelRatioProp={2}
                    shapeSize={1}
                    roundness={0.5}
                    borderSize={0.05}
                    circleSize={0.25}
                    circleEdge={1}
                  />
                </Suspense>
              </div>
              <span className="relative z-10">Get Started</span>
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
