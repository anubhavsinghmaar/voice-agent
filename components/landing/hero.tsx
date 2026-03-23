"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { Button } from "@/components/ui/button";
import { hasApiKeys } from "@/lib/api-keys";
import { ApiConfigModal } from "@/components/config/api-config-modal";

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
      <Card className="relative flex h-screen w-full flex-col overflow-hidden border-neutral-800 bg-black/[0.96] md:flex-row">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

        {/* Left: Hero text */}
        <div className="relative z-10 flex flex-1 flex-col justify-center p-8 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-6xl lg:text-7xl">
              Your AI Voice Assistant
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 max-w-lg text-base text-neutral-400 md:text-lg"
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
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-blue-600 px-8 text-base font-semibold text-white hover:bg-blue-700"
            >
              Get Started
            </Button>
          </motion.div>
        </div>

        {/* Right: Spline 3D scene */}
        <div className="relative flex-1">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
      </Card>

      <ApiConfigModal
        open={showConfig}
        onOpenChange={setShowConfig}
        onSave={handleConfigSave}
      />
    </>
  );
}
