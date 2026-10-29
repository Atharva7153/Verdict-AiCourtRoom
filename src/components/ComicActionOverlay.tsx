"use client";

import React, { useEffect, useState } from "react";
import type { CourtMessage } from "@/app/api/court/route";

interface ComicActionOverlayProps {
  currentMessage: CourtMessage | null;
  replayToken?: number;
}

export default function ComicActionOverlay({
  currentMessage,
  replayToken = 0,
}: ComicActionOverlayProps) {
  const [activeBanner, setActiveBanner] = useState<{
    text: string;
    subtext?: string;
    type: "objection" | "ruling" | "order" | "verdict" | "researcher";
  } | null>(null);

  useEffect(() => {
    if (!currentMessage) {
      setActiveBanner(null);
      return;
    }

    const text = currentMessage.text.toUpperCase();
    const type = currentMessage.type;
    const speaker = currentMessage.speaker;

    if (type === "objection" || text.includes("OBJECTION")) {
      setActiveBanner({
        text: "OBJECTION!",
        subtext: "Vector McSquaw challenges the defense!",
        type: "objection",
      });
    } else if (type === "ruling") {
      const isSustained = text.includes("SUSTAINED");
      const isOverruled = text.includes("OVERRULED");
      setActiveBanner({
        text: isSustained ? "SUSTAINED!" : isOverruled ? "OVERRULED!" : "THE COURT RULES!",
        subtext: "Justice Owl delivers a binding judicial decree",
        type: "ruling",
      });
    } else if (type === "order" || text.includes("ORDER IN THE COURT")) {
      setActiveBanner({
        text: "ORDER IN COURT!",
        subtext: "Gavel slams • All counsel stand down",
        type: "order",
      });
    } else if (type === "verdict") {
      setActiveBanner({
        text: "FINAL VERDICT!",
        subtext: "The Supreme Jury reaches its conclusion",
        type: "verdict",
      });
    } else if (speaker === "researcher" && currentMessage.phase === "evidence") {
      setActiveBanner({
        text: "WEB DOSSIER!",
        subtext: "Detective Heron returns with live GitHub prior art",
        type: "researcher",
      });
    } else {
      setActiveBanner(null);
      return;
    }

    // Dismiss banner after 1.6s so speech bubble is prominent
    const timer = setTimeout(() => {
      setActiveBanner(null);
    }, 1600);

    return () => clearTimeout(timer);
  }, [currentMessage, replayToken]);

  if (!activeBanner) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
      {/* Manga / Comic Radial Speedlines Canvas */}
      <svg
        className="absolute inset-0 w-full h-full animate-comic-burst"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="centerFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="45%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </radialGradient>
        </defs>

        {/* Dynamic Burst Lines */}
        <g
          stroke={
            activeBanner.type === "objection"
              ? "rgba(180, 40, 40, 0.42)"
              : activeBanner.type === "ruling"
              ? "rgba(30, 80, 160, 0.38)"
              : activeBanner.type === "verdict"
              ? "rgba(212, 175, 55, 0.48)"
              : "rgba(50, 60, 70, 0.35)"
          }
          strokeWidth="3.5"
        >
          {Array.from({ length: 48 }).map((_, i) => {
            const angle = (i * 360) / 48;
            const rad = (angle * Math.PI) / 180;
            const r1 = 180 + (i % 3) * 45;
            const r2 = 750;
            const x1 = 500 + Math.cos(rad) * r1;
            const y1 = 500 + Math.sin(rad) * r1;
            const x2 = 500 + Math.cos(rad) * r2;
            const y2 = 500 + Math.sin(rad) * r2;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={i % 2 ? "none" : "8, 12"} />;
          })}
        </g>
        <rect width="1000" height="1000" fill="url(#centerFade)" />
      </svg>

      {/* Dramatic Action Impact Comic Banner */}
      <div className="relative z-10 transform scale-100 animate-punch-in text-center select-none">
        <div
          className={`px-8 py-4 rounded-2xl border-[4px] shadow-2xl transform -rotate-2 ${
            activeBanner.type === "objection"
              ? "bg-red-600 text-white border-yellow-300 shadow-red-950/60"
              : activeBanner.type === "ruling"
              ? "bg-blue-900 text-white border-blue-200 shadow-blue-950/60"
              : activeBanner.type === "verdict"
              ? "bg-amber-500 text-amber-950 border-white shadow-amber-950/60"
              : "bg-gray-900 text-white border-amber-400 shadow-black/60"
          }`}
        >
          {/* Spiky Comic Action Text */}
          <h2 className="font-comic font-black tracking-tighter text-4xl sm:text-6xl md:text-7xl uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            {activeBanner.text}
          </h2>
          {activeBanner.subtext && (
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest mt-1 opacity-90 drop-shadow">
              {activeBanner.subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
