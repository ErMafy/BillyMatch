"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getRandomPhrase } from "@/lib/meme-phrases";

export function MemeToggle() {
  const [memeMode, setMemeMode] = useState(true);
  const [phrase, setPhrase] = useState(getRandomPhrase("welcome"));

  const handleToggle = (checked: boolean) => {
    setMemeMode(checked);
    if (checked) {
      setPhrase(getRandomPhrase("welcome"));
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <Switch checked={memeMode} onCheckedChange={handleToggle} />
      <Label className="text-xs cursor-pointer">
        {memeMode ? "🎭 Meme Mode: ON" : "😐 Meme Mode: OFF"}
      </Label>
      {memeMode && (
        <span className="text-xs text-amber-400 font-mono ml-auto hidden sm:inline">
          {phrase}
        </span>
      )}
    </div>
  );
}
