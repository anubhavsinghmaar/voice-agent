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
        {/* Aurora background */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <Aurora
              colorStops={["#66c4ff", "#B19EEF", "#626fd0"]}
              blend={0.5}
              amplitude={1.0}
              speed={1}
            />
          </Suspense>
        </div>

        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

        {/* Left: Hero text */}
        <div className="relative z-10 flex flex-1 flex-col justify-center p-8 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-4xl font-bold text-transparent md:text-6xl lg:text-7xl">
              Your AI Voice Assistant
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-8"
          >
            <button
              onClick={handleGetStarted}
              className="group relative overflow-hidden rounded-xl border border-white/[0.15] bg-white/[0.06] px-8 py-3 text-base font-semibold text-white backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-white/[0.25] hover:bg-white/[0.12] hover:px-10 hover:shadow-[0_0_40px_rgba(177,158,239,0.15)]"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#66c4ff]/10 via-[#B19EEF]/10 to-[#626fd0]/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </button>
          </motion.div>
        </div>

        {/* Right: Spline 3D scene */}
        <div className="relative z-10 flex-1">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
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
