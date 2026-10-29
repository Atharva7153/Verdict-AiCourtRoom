"use client";

import React from "react";
import { Pause, Play, SkipForward, RotateCcw, FileText, Award, Sparkles, Repeat2, BookOpen } from "lucide-react";

interface CourtControlsProps {
  cameraPreset: "overview" | "judge" | "defense" | "prosecutor" | "jury" | "researcher";
  onSelectCamera: (preset: "overview" | "judge" | "defense" | "prosecutor" | "jury" | "researcher") => void;
  isPlaying: boolean; onTogglePlay: () => void; onNextStep: () => void; onResetTrial: () => void;
  onOpenNewTrial: () => void; onOpenReport: () => void; onOpenTranscript: () => void; onOpenEvidence: () => void; onOpenCertificate?: () => void;
  hasReport: boolean; stepIndex: number; totalSteps: number; isComplete: boolean; autoAdvance: boolean; onToggleAuto: () => void; onReplay: () => void;
}
export default function CourtControls({ cameraPreset, onSelectCamera, isPlaying, onTogglePlay, onNextStep, onResetTrial, onOpenNewTrial, onOpenReport, onOpenTranscript, onOpenEvidence, onOpenCertificate, hasReport, stepIndex, totalSteps, isComplete, autoAdvance, onToggleAuto, onReplay }: CourtControlsProps) {
  return <div className="control-deck" aria-label="Courtroom controls">
    <div className="control-progress"><span className="eyebrow">Proceedings</span><strong>{totalSteps ? <>{String(stepIndex + 1).padStart(2,"0")} <i>/ {String(totalSteps).padStart(2,"0")}</i></> : "— / —"}</strong><div className="progress-track"><span style={{ width: `${totalSteps ? ((stepIndex + 1) / totalSteps) * 100 : 0}%` }} /></div></div>
    <div className="control-actions">
      <label className="focus-control"><span>Focus</span><select aria-label="Focus courtroom character" value={cameraPreset} onChange={e=>onSelectCamera(e.target.value as CourtControlsProps["cameraPreset"])}><option value="overview">Full court</option><option value="judge">Justice Owl</option><option value="defense">Defense</option><option value="prosecutor">Prosecution</option><option value="researcher">Detective Heron</option><option value="jury">Jury box</option></select></label>
      <button className="icon-control" onClick={onResetTrial} disabled={!totalSteps} title="Replay trial from the opening" aria-label="Replay trial from the beginning"><RotateCcw size={17}/></button>
      <button className="icon-control" onClick={onReplay} disabled={!totalSteps} title="Replay this line" aria-label="Replay current line animation"><Repeat2 size={17}/></button>
      <button className="primary-control" onClick={onTogglePlay} disabled={!totalSteps||isComplete} aria-label={isPlaying ? "Pause trial" : "Resume trial"}>{isPlaying ? <Pause size={16}/> : <Play size={16}/>}<span>{isPlaying ? "Pause" : "Resume"}</span></button>
      <button className="next-control" onClick={onNextStep} disabled={!totalSteps || stepIndex >= totalSteps - 1} aria-label="Advance to next statement"><span>Next statement</span><SkipForward size={16}/></button>
    </div>
    <label className="auto-toggle"><input type="checkbox" checked={autoAdvance} onChange={onToggleAuto}/><span className="toggle-mark"/><span>Auto-advance</span></label>
    <div className="control-links">
      <button onClick={onOpenEvidence}><BookOpen size={16}/><span>Evidence</span></button>
      <button onClick={onOpenTranscript}><FileText size={16}/><span>Record</span></button>
      <button disabled={!hasReport} onClick={onOpenReport}><Award size={16}/><span>Verdict</span></button>
      {onOpenCertificate && <button disabled={!hasReport} onClick={onOpenCertificate} className="certificate-link"><Award size={16} className="text-amber-600"/><span>Certificate</span></button>}
      <button onClick={onOpenNewTrial} className="file-again"><Sparkles size={15}/><span>New case</span></button>
    </div>
  </div>;
}
