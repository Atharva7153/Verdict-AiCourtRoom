"use client";

import React, { useMemo, useState } from "react";
import { X, FileText, Download } from "lucide-react";
import type { CourtMessage, IdeaCase, VerdictReport } from "@/app/api/court/route";

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: CourtMessage[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  report?: VerdictReport;
  caseData?: IdeaCase;
}

export default function TranscriptDrawer({
  isOpen,
  onClose,
  transcript,
  currentStepIndex,
  onSelectStep,
  report,
  caseData,
}: TranscriptDrawerProps) {
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("all");
  const visibleTranscript = useMemo(() => transcript.map((message, index) => ({message,index})).filter(({message}) =>
    (speaker === "all" || message.speaker === speaker) &&
    (!query || `${message.speakerName} ${message.role} ${message.text} ${message.phase || ""}`.toLowerCase().includes(query.toLowerCase()))
  ), [transcript, speaker, query]);
  if (!isOpen) return null;

  const handleDownload = () => {
    const text = `# VERDICT — Court Record\n\nCase: ${caseData?.idea || "Hackathon idea"}\n${report ? `Verdict: ${report.verdict} · ${report.score}/100\nConfidence: ${report.confidence}\n\n## Findings\n${report.summary}\n\n## Score breakdown\n${report.dimensions.map((d) => `- ${d.label}: ${d.score}/10 (${d.weight}%) — ${d.rationale}`).join("\n")}\n\n## Next actions\n${report.mandatoryAdditions.map((x) => `- ${x}`).join("\n")}\n` : ""}\n## Transcript\n\n${transcript.map((m) => `### ${m.phase || "Proceedings"} · ${m.speakerName} (${m.role}) — ${m.timestamp}\n\n${m.text}`).join("\n\n")}`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verdict-court-record-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[430px] bg-[#fffdf9] border-l-[3px] border-gray-900 shadow-comic-lg flex flex-col animate-slide-left">
      {/* Drawer Header */}
      <div className="p-4 border-b-[2px] border-gray-800 flex items-center justify-between bg-amber-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-700" />
          <h3 className="font-black text-gray-900 font-comic text-base">
            Official Court Record
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 transition-colors"
            title="Download Transcript"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-3 border-b border-gray-200 bg-white">
        <input aria-label="Search transcript" placeholder="Search statements…" value={query} onChange={e=>setQuery(e.target.value)} className="min-w-0 flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        <select aria-label="Filter by speaker" value={speaker} onChange={e=>setSpeaker(e.target.value)} className="max-w-[130px] px-2 py-2 text-xs rounded-lg border border-gray-300 bg-white">
          <option value="all">All speakers</option>
          {Array.from(new Set(transcript.map((m)=>m.speaker))).map((key)=><option key={key} value={key}>{transcript.find((m)=>m.speaker===key)?.speakerName}</option>)}
        </select>
      </div>

      {/* Transcript List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleTranscript.map(({message:msg,index:idx}) => {
          const isActive = idx === currentStepIndex;
          const isJudge = msg.speaker === "judge";
          const isDefense = msg.speaker === "defense";
          const isProsecutor = msg.speaker === "prosecutor";

          return (
            <div
              key={idx}
              onClick={() => onSelectStep(idx)}
              className={`p-3 rounded-2xl border-[2px] transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-100/90 border-amber-600 shadow-comic"
                  : isJudge
                  ? "bg-gray-50 border-gray-200 hover:border-gray-400"
                  : isDefense
                  ? "bg-blue-50/60 border-blue-200 hover:border-blue-400"
                  : isProsecutor
                  ? "bg-emerald-50/60 border-emerald-200 hover:border-emerald-400"
                  : "bg-orange-50/60 border-orange-200 hover:border-orange-400"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-1">
                <span
                  className={
                    isJudge
                      ? "text-gray-800"
                      : isDefense
                      ? "text-blue-700"
                      : isProsecutor
                      ? "text-emerald-700"
                      : "text-amber-800"
                  }
                >
                  {isJudge ? "🦉 " : isDefense ? "🐦 " : isProsecutor ? "🦜 " : "🐥 "}
                  {msg.speakerName}
                </span>
                <span className="text-gray-400 font-mono text-[10px]">{msg.timestamp}</span>
              </div>

              {msg.type === "objection" && (
                <span className="inline-block px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px] uppercase mb-1">
                  OBJECTION
                </span>
              )}

              <p className="text-xs text-gray-800 font-medium leading-relaxed font-comic">
                {msg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
