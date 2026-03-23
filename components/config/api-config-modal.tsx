"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { getApiKeys, setApiKeys } from "@/lib/api-keys";

interface ApiConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function ApiConfigModal({ open, onOpenChange, onSave }: ApiConfigModalProps) {
  const [deepgram, setDeepgram] = useState("");
  const [gemini, setGemini] = useState("");
  const [cartesia, setCartesia] = useState("");
  const [showKeys, setShowKeys] = useState({ deepgram: false, gemini: false, cartesia: false });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (open) {
      const keys = getApiKeys();
      if (keys) {
        setDeepgram(keys.deepgram);
        setGemini(keys.gemini);
        setCartesia(keys.cartesia);
      }
    }
  }, [open]);

  function handleSave() {
    if (!deepgram.trim() || !gemini.trim() || !cartesia.trim()) {
      setValidationError("All three API keys are required.");
      return;
    }
    setValidationError("");
    setApiKeys({ deepgram: deepgram.trim(), gemini: gemini.trim(), cartesia: cartesia.trim() });
    onSave();
    onOpenChange(false);
  }

  function toggleVisibility(key: "deepgram" | "gemini" | "cartesia") {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border-neutral-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-neutral-50">Configure API Keys</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Enter your API keys to power the voice assistant. Your keys are stored
            locally on your device and never sent to any server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Deepgram */}
          <div className="space-y-2">
            <Label htmlFor="deepgram" className="text-neutral-300">
              Deepgram API Key (STT)
            </Label>
            <div className="relative">
              <Input
                id="deepgram"
                type={showKeys.deepgram ? "text" : "password"}
                placeholder="Enter your Deepgram API key"
                value={deepgram}
                onChange={(e) => setDeepgram(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-neutral-50 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleVisibility("deepgram")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                {showKeys.deepgram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Gemini */}
          <div className="space-y-2">
            <Label htmlFor="gemini" className="text-neutral-300">
              Gemini API Key (LLM)
            </Label>
            <div className="relative">
              <Input
                id="gemini"
                type={showKeys.gemini ? "text" : "password"}
                placeholder="Enter your Gemini API key"
                value={gemini}
                onChange={(e) => setGemini(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-neutral-50 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleVisibility("gemini")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Cartesia */}
          <div className="space-y-2">
            <Label htmlFor="cartesia" className="text-neutral-300">
              Cartesia API Key (TTS)
            </Label>
            <div className="relative">
              <Input
                id="cartesia"
                type={showKeys.cartesia ? "text" : "password"}
                placeholder="Enter your Cartesia API key"
                value={cartesia}
                onChange={(e) => setCartesia(e.target.value)}
                className="bg-neutral-900 border-neutral-700 text-neutral-50 pr-10"
              />
              <button
                type="button"
                onClick={() => toggleVisibility("cartesia")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
              >
                {showKeys.cartesia ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
