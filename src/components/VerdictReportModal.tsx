"use client";

import React, { useEffect, useState } from "react";
import { X, Award, CheckCircle2, AlertTriangle, Lightbulb, Copy, Check, Download, Sparkles, Scale } from "lucide-react";
import type { VerdictReport } from "@/app/api/court/route";

interface VerdictReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: VerdictReport | null;
  ideaText: string;
  onUsePivot?: (pivot: string) => void;
  onAnotherPivot?: () => Promise<string>;
}

export default function VerdictReportModal({
  isOpen,
  onClose,
  report,
  ideaText,
  onUsePivot,
  onAnotherPivot,
}: VerdictReportModalProps) {
  const [copied, setCopied] = useState(false);
  const [pivotVisible, setPivotVisible] = useState(true);
  const [pivotText, setPivotText] = useState("");
  const [pivotLoading, setPivotLoading] = useState(false);
  const [pivotError, setPivotError] = useState("");
  useEffect(() => { if (isOpen) { setPivotVisible(true); setPivotText(""); setPivotError(""); } }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const juryVote = report.juryVote || `${report.jury.filter((member) => member.score >= 6).length}–${report.jury.filter((member) => member.score < 6).length} lean competitive (6/10+ threshold)`;
  const isWinner = report.score >= 80;
  const isNeedsWork = report.score >= 60 && report.score < 80;

  const handleCopy = () => {
    const text = `# AI COURTROOM: HACKATHON READINESS REPORT
Project: ${ideaText}
Verdict: ${report.verdict}
Hackathon Score: ${report.score}/100

## Summary
${report.summary}

## Strengths
${report.strengths.map((s) => `- ${s}`).join("\n")}

## Fatal Vulnerabilities
${report.vulnerabilities.map((v) => `- ${v}`).join("\n")}

## Mandatory Additions To Win
${report.mandatoryAdditions.map((a) => `[ ] ${a}`).join("\n")}

## 3-Minute Live Demo Strategy
${report.demoStrategy}

## Weighted scorecard
${report.dimensions.map((d) => `- ${d.label}: ${d.score}/10 (${d.weight}%) — ${d.rationale}`).join("\n")}

## Jury findings (${juryVote})
${report.jury.map((j) => `- ${j.name} (${j.score}/10): ${j.finding}`).join("\n")}

## Build plan
- MVP: ${report.mvp.join("; ")}
- Cut: ${report.cut.join("; ")}
- Order: ${report.implementationOrder.join(" → ")}
- Differentiator: ${report.differentiator}
- Pivot: ${report.pivot}
- Ethics and safety: ${report.ethicsRisk}
- Claims to verify: ${report.unverifiedClaims.join("; ")}
- Supplied facts: ${report.suppliedFacts.join("; ")}
- Assumptions: ${report.assumptions.join("; ")}

## Likely judge questions
${report.judgeQuestions.map((item) => `- Q: ${item.question}\n  A: ${item.response}`).join("\n")}

## Final Sentence of the Court
"${report.finalSentence}"
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `# AI COURTROOM: HACKATHON READINESS REPORT
Project: ${ideaText}
Verdict: ${report.verdict}
Hackathon Score: ${report.score}/100

## Summary
${report.summary}

## Strengths
${report.strengths.map((s) => `- ${s}`).join("\n")}

## Vulnerabilities
${report.vulnerabilities.map((v) => `- ${v}`).join("\n")}

## Things To Add To Win
${report.mandatoryAdditions.map((a) => `[ ] ${a}`).join("\n")}

## 3-Minute Demo Strategy
${report.demoStrategy}

## Score breakdown
${report.dimensions.map((d) => `- ${d.label}: ${d.score}/10 (${d.weight}%) — ${d.rationale}`).join("\n")}

## Jury (${juryVote})
${report.jury.map((j) => `- ${j.name} (${j.score}/10): ${j.finding}`).join("\n")}

## Action plan
- MVP: ${report.mvp.join("; ")}
- Cut: ${report.cut.join("; ")}
- Build order: ${report.implementationOrder.join(" → ")}
- Differentiator: ${report.differentiator}
- Pivot: ${report.pivot}
- Ethics and safety: ${report.ethicsRisk}
- Claims to verify: ${report.unverifiedClaims.join("; ")}
- Supplied facts: ${report.suppliedFacts.join("; ")}
- Assumptions: ${report.assumptions.join("; ")}

## Judge questions
${report.judgeQuestions.map((item) => `- Q: ${item.question}\n  A: ${item.response}`).join("\n")}

## Final Sentence
"${report.finalSentence}"
`;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `court-verdict-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#fffdf9] border-[3px] border-gray-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-comic-lg relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-amber-700" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-800">
            Supreme Court of Hackathon Validation • Final Decree
          </span>
        </div>

        {/* Verdict Banner */}
        <div
          className={`p-5 rounded-2xl border-[3px] mb-6 flex flex-col md:flex-row items-center justify-between gap-4 ${
            isWinner
              ? "bg-emerald-50 border-emerald-600 text-emerald-950"
              : isNeedsWork
              ? "bg-amber-50 border-amber-600 text-amber-950"
              : "bg-red-50 border-red-600 text-red-950"
          }`}
        >
          <div className="text-center md:text-left">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-1.5 ${
                isWinner
                  ? "bg-emerald-200 text-emerald-900"
                  : isNeedsWork
                  ? "bg-amber-200 text-amber-900"
                  : "bg-red-200 text-red-900"
              }`}
            >
              {report.verdict}
            </span>
            <h1 className="text-xl md:text-2xl font-black font-comic leading-tight">
              {report.tagline}
            </h1>
          </div>

          {/* Big Score Gauge */}
          <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-white border-[2px] border-gray-900 shadow-comic">
            <span className="text-3xl font-black font-comic">
              {report.score}
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              / 100 Score
            </span>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border-[2px] border-amber-200">
          <p className="text-sm font-medium text-gray-800 leading-relaxed">
            {report.summary}
          </p>
        </div>

        {/* Side-by-side Strengths vs Flaws */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Strengths */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border-[2px] border-emerald-300">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              What Makes It Winning-Worthy
            </h3>
            <ul className="space-y-2 text-xs font-medium text-emerald-950">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vulnerabilities */}
          <div className="p-4 rounded-2xl bg-red-50/80 border-[2px] border-red-300">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-900 mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Fatal Risks & Judge Scrutiny
            </h3>
            <ul className="space-y-2 text-xs font-medium text-red-950">
              {report.vulnerabilities.map((vuln, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>{vuln}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mandatory Additions / What To Add To Win */}
        <div className="mb-6 p-5 rounded-2xl bg-indigo-50 border-[2px] border-indigo-300">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-950 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-600" />
            Prescription: What Things You Must Add To Win
          </h3>
          <div className="space-y-2.5">
            {report.mandatoryAdditions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-indigo-200 text-xs font-medium text-gray-800"
              >
                <div className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Minute Demo Pitch Strategy */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-100/60 border-[2px] border-amber-300">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            Stage Demo Strategy (Avoid The Hackathon Curse)
          </h3>
          <p className="text-xs font-medium text-gray-800 leading-relaxed">
            {report.demoStrategy}
          </p>
        </div>

        <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white border-2 border-gray-200">
            <h3 className="text-xs font-black uppercase tracking-wider mb-3">Weighted scorecard</h3>
            <p className="text-[11px] text-gray-500 mb-3">Decision aid · category weights total 100% · scale: 0–2 missing, 3–4 weak, 5–6 plausible, 7–8 strong, 9–10 exceptional evidence</p>
            {report.dimensions.map((item) => <div key={item.key} className="mb-2">
              <div className="flex justify-between text-[11px] font-bold"><span>{item.label} <small className="text-gray-400">{item.weight}%</small></span><span>{item.score}/10</span></div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-amber-500" style={{width:`${item.score*10}%`}}/></div>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.rationale}</p>
            </div>)}
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <h3 className="text-xs font-black uppercase tracking-wider mb-1">The jury did not all agree</h3>
            <p className="text-[11px] text-blue-900 mb-1">Jury vote: {juryVote}</p><p className="text-[11px] text-blue-900 mb-3">Evidence confidence: {report.confidence} · {report.evidenceQuality}</p>
            {report.jury.map((juror)=><div key={juror.speaker} className="py-2 border-t border-blue-100"><div className="flex justify-between text-[11px] font-black"><span>{juror.name} · {juror.role}</span><span>{juror.score}/10</span></div><p className="text-[11px] text-gray-700">{juror.finding}</p></div>)}
          </div>
        </section>
        <section className="mb-6 p-4 rounded-2xl bg-stone-50 border-2 border-stone-200">
          <h3 className="text-xs font-black uppercase tracking-wider mb-3">Build order</h3>
          <div className="grid md:grid-cols-3 gap-4 text-xs"><div><b>MVP</b><ul className="list-disc pl-5 mt-1 space-y-1">{report.mvp.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><b>Cut for now</b><ul className="list-disc pl-5 mt-1 space-y-1">{report.cut.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><b>Implementation order</b><ol className="list-decimal pl-5 mt-1 space-y-1">{report.implementationOrder.map((x,i)=><li key={i}>{x}</li>)}</ol></div></div>
          <p className="text-xs mt-3"><b>Most compelling differentiator:</b> {report.differentiator}</p>
          <p className="text-xs mt-2"><b>Suggested pivot:</b> {report.pivot}</p>
          <p className="text-xs mt-2"><b>Ethics & safety:</b> {report.ethicsRisk}</p>
          <p className="text-xs mt-2"><b>Claims to verify:</b> {report.unverifiedClaims.join(" · ") || "None stated"}</p>
          <details className="mt-3 text-xs"><summary className="font-bold cursor-pointer">Evidence ledger · supplied facts &amp; assumptions</summary><p className="mt-2"><b>Submitted facts:</b> {report.suppliedFacts.join(" · ")||"No supporting facts supplied"}</p><p className="mt-2"><b>Assumptions:</b> {report.assumptions.join(" · ")||"No assumptions identified"}</p></details>
          {report.judgeQuestions.length>0&&<div className="mt-4"><b className="text-xs">Likely judge questions</b>{report.judgeQuestions.map((item,i)=><p className="mt-2 text-xs" key={i}><b>Q:</b> {item.question}<br/><b>A:</b> {item.response}</p>)}</div>}
        </section>

        {pivotVisible && report.pivot && <section className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300">
          <div className="flex items-start justify-between gap-4"><div><h3 className="text-xs font-black uppercase tracking-wider text-amber-950">Plea bargain · A sharper case</h3><p className="text-xs text-gray-700 mt-2">{pivotText || report.pivot}</p></div><button onClick={()=>setPivotVisible(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900" aria-label="Reject this pivot">Reject</button></div>
          {pivotError&&<p className="text-xs text-red-700 mt-2" role="alert">{pivotError}</p>}
          <div className="flex flex-wrap gap-2 mt-3"><button onClick={()=>onUsePivot?.(pivotText||report.pivot)} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold">Accept pivot &amp; retry</button><button disabled={pivotLoading||!onAnotherPivot} onClick={async()=>{if(!onAnotherPivot)return;setPivotLoading(true);setPivotError("");try{setPivotText(await onAnotherPivot())}catch(e){setPivotError(e instanceof Error?e.message:"Could not suggest another pivot.")}finally{setPivotLoading(false)}}} className="px-3 py-2 rounded-lg bg-white border border-amber-400 text-amber-950 text-xs font-bold">{pivotLoading?"Considering another…":"Suggest another pivot"}</button></div>
        </section>}

        {/* Final Sentence from Judge */}
        <div className="mb-6 p-4 rounded-2xl bg-gray-900 text-white border-[2px] border-gray-900 shadow-comic">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
            ⚖️ Formal Judicial Sentence
          </span>
          <p className="text-sm font-bold italic font-comic text-gray-200">
            &ldquo;{report.finalSentence}&rdquo;
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Report"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold border border-gray-300 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider border-[2px] border-gray-900 shadow-comic"
          >
            Return To Courtroom
          </button>
        </div>

      </div>
    </div>
  );
}
