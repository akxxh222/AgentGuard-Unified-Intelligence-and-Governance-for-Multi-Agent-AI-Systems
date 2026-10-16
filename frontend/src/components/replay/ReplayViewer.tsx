"use client";

import React, { useState } from "react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { AgentEvent } from "@/types";

interface ReplayViewerProps {
  events?: AgentEvent[];
}

export function ReplayViewer({ events = [] }: ReplayViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalSteps = Math.max(events.length, 1);
  const currentEvent = events[currentIndex];

  return (
    <Card className="bg-zinc-900/70 border-zinc-800/80">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-mono font-medium text-zinc-400 uppercase">
          Step-by-Step Replay
        </CardTitle>
        <span className="text-[11px] font-mono text-zinc-400">
          Step {currentIndex + 1} of {totalSteps}
        </span>
      </CardHeader>

      <CardContent className="p-4 pt-2 font-mono text-xs space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-zinc-400"
            onClick={() => setCurrentIndex(0)}
            aria-label="Rewind to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="icon"
            className="h-8 w-8 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause replay" : "Play replay"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-zinc-400"
            onClick={() =>
              setCurrentIndex((prev) => Math.min(prev + 1, totalSteps - 1))
            }
            aria-label="Step forward"
          >
            <FastForward className="w-3.5 h-3.5" />
          </Button>

          <div className="flex-1 px-2">
            <Slider
              value={[currentIndex]}
              min={0}
              max={totalSteps - 1}
              step={1}
              onValueChange={(val) => setCurrentIndex(val[0])}
            />
          </div>
        </div>

        {/* Current Event Inspector */}
        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3 min-h-[120px]">
          {currentEvent ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-bold">
                  {currentEvent.event_type.toUpperCase()}
                </span>
                <span className="text-zinc-500">{currentEvent.timestamp}</span>
              </div>
              <div className="text-zinc-300 font-sans text-xs">
                Agent: <strong>{currentEvent.agent_id}</strong> • Task:{" "}
                {currentEvent.task_id}
              </div>
              <pre className="text-[10px] text-zinc-400 mt-2 overflow-x-auto">
                {JSON.stringify(currentEvent.payload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-[11px]">
              No replay events loaded.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
