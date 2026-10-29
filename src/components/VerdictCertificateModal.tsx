"use client";

import React, { useRef, useState } from "react";
import { X, Download, Copy, Check, Award, Sparkles, Scale, ShieldCheck } from "lucide-react";
import type { VerdictReport, IdeaCase } from "@/app/api/court/route";

interface VerdictCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: VerdictReport;
  ideaCase: IdeaCase;
}

export default function VerdictCertificateModal({
  isOpen,
  onClose,
  report,
  ideaCase,
}: VerdictCertificateModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const caseId = `CASE NO. ${new Date().getFullYear()}—VERDICT`;

  // Draw high-resolution canvas certificate for instant PNG download
  const generateCertificateBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Parchment paper background
    const bgGrad = ctx.createRadialGradient(800, 550, 100, 800, 550, 950);
    bgGrad.addColorStop(0, "#fffef9");
    bgGrad.addColorStop(0.7, "#f7f1e4");
    bgGrad.addColorStop(1, "#ebdfcb");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1600, 1100);

    // Subtle paper grain vignette
    ctx.strokeStyle = "rgba(100, 80, 50, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 1100; i += 8) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1600, i);
      ctx.stroke();
    }

    // 2. Ornate Double Gold & Charcoal Borders
    ctx.strokeStyle = "#8b6f3b";
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1520, 1020);

    ctx.strokeStyle = "#2c2a26";
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1490, 990);

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(62, 62, 1476, 976);

    // Corner decorative corner accents
    const corners = [
      [55, 55],
      [1545, 55],
      [55, 1045],
      [1545, 1045],
    ];
    ctx.fillStyle = "#8b6f3b";
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Top Seal & Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#8b6f3b";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("✦  THE SUPREME COURT OF HACKATHON INNOVATION  ✦", 800, 120);

    ctx.fillStyle = "#1e1e1e";
    ctx.font = "bold 44px Georgia, serif";
    ctx.fillText("CERTIFICATE OF ADJUDICATION", 800, 175);

    ctx.fillStyle = "#6b6255";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText(`Issued on ${dateStr} · Official Record · ${caseId}`, 800, 215);

    // Decorative divider
    ctx.strokeStyle = "#c2ad82";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(400, 240);
    ctx.lineTo(1200, 240);
    ctx.stroke();

    // 4. Case Details
    ctx.fillStyle = "#8a7550";
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText("IN THE MATTER OF THE DEFENDANT PROJECT:", 800, 280);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 32px Georgia, serif";
    const ideaTitle = ideaCase.idea.length > 60 ? ideaCase.idea.slice(0, 58) + "…" : ideaCase.idea;
    ctx.fillText(`"${ideaTitle}"`, 800, 325);

    if (ideaCase.track || ideaCase.targetUsers) {
      ctx.fillStyle = "#5c564b";
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText(
        `Track: ${ideaCase.track || "General Track"}  ·  Target: ${ideaCase.targetUsers || "General Audience"}`,
        800,
        355
      );
    }

    // 5. Center Badge: VERDICT & SCORE
    const verdictY = 440;
    // Score circle on the left
    ctx.save();
    ctx.beginPath();
    ctx.arc(620, verdictY + 20, 68, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#8b6f3b";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 48px Georgia, serif";
    ctx.fillText(`${report.score}`, 620, verdictY + 28);
    ctx.fillStyle = "#776d5e";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText("/ 100 POINTS", 620, verdictY + 54);
    ctx.restore();

    // Stamped Verdict Banner on the right
    ctx.save();
    ctx.translate(920, verdictY + 20);
    ctx.rotate(-0.04);
    ctx.fillStyle = report.score >= 75 ? "#1b4d3e" : report.score >= 50 ? "#854d0e" : "#831843";
    ctx.fillRect(-220, -42, 440, 84);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(-215, -37, 430, 74);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(report.verdict, 0, 7);
    ctx.restore();

    // 6. Judicial Decree & Sentence Box
    const boxY = 560;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.strokeStyle = "#d6cbb8";
    ctx.lineWidth = 2;
    ctx.fillRect(200, boxY, 1200, 175);
    ctx.strokeRect(200, boxY, 1200, 175);

    ctx.textAlign = "left";
    ctx.fillStyle = "#8a7550";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText("FORMAL JUDICIAL SENTENCE OF JUSTICE OWL:", 230, boxY + 35);

    ctx.fillStyle = "#1f2937";
    ctx.font = "italic 20px Georgia, serif";
    const sentence = `"${report.finalSentence}"`;
    // Wrap sentence nicely
    ctx.fillText(sentence.slice(0, 95), 230, boxY + 70);
    if (sentence.length > 95) {
      ctx.fillText(sentence.slice(95, 190), 230, boxY + 98);
    }

    ctx.fillStyle = "#4b5563";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(
      `Jury Vote: ${report.juryVote}  |  Independent Web Dossier by Detective Heron: Verified`,
      230,
      boxY + 145
    );

    // 7. Red Ink Wax Seal
    ctx.save();
    const sealX = 320;
    const sealY = 880;
    ctx.translate(sealX, sealY);
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.fillStyle = "#a82e2e";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#e8b4b4";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("HACKATHON", 0, -28);
    ctx.font = "24px Georgia, serif";
    ctx.fillText("⚖️", 0, 2);
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("SEAL OF OWL", 0, 26);
    ctx.font = "8px Inter, sans-serif";
    ctx.fillText("VERIFIED PROCEEDING", 0, 42);
    ctx.restore();

    // 8. Signatures Section
    const sigY = 880;
    const sigs = [
      { role: "Presiding Judge", name: "Justice Owl", lineX: 580 },
      { role: "Defense Attorney", name: "Perry Coo-per", lineX: 860 },
      { role: "Lead Prosecutor", name: "Vector McSquaw", lineX: 1140 },
      { role: "Web Investigator", name: "Detective Heron", lineX: 1380 },
    ];

    sigs.forEach((sig) => {
      ctx.strokeStyle = "#6b6255";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sig.lineX - 100, sigY + 10);
      ctx.lineTo(sig.lineX + 100, sigY + 10);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#1e1e1e";
      ctx.font = "italic 22px 'Brush Script MT', 'Snell Roundhand', cursive, Georgia, serif";
      ctx.fillText(sig.name, sig.lineX, sigY - 2);

      ctx.fillStyle = "#8a7550";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(sig.role.toUpperCase(), sig.lineX, sigY + 30);
    });

    // 9. Bottom Disclaimer
    ctx.textAlign = "center";
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("VERDICT — The Supreme Hackathon Court. Certified for sharing on X, LinkedIn & Devpost.", 800, 1025);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateCertificateBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (ideaCase.idea || "hackathon-case").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      a.download = `verdict-certificate-${safeName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      const blob = await generateCertificateBlob();
      if (!blob) return;
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const isWinner = report.score >= 78;
  const isNeedsWork = report.score >= 50 && report.score < 78;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-4xl w-full bg-[#fdfbf6] border-[4px] border-[#8b6f3b] rounded-3xl p-6 md:p-10 shadow-2xl my-auto max-h-[95vh] overflow-y-auto text-[#1e1e1e]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-gray-100 border border-gray-300 text-gray-700 transition"
          aria-label="Close certificate"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Inner Frame */}
        <div className="border-[2px] border-[#2c2a26] rounded-2xl p-6 md:p-8 relative bg-gradient-to-b from-[#fffef9] via-[#f9f5eb] to-[#f0e8d7] shadow-inner">
          {/* Corner seal accents */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#8b6f3b]" />
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#8b6f3b]" />
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#8b6f3b]" />
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#8b6f3b]" />

          {/* Top heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#8b6f3b] uppercase mb-1">
              <Scale size={16} /> Supreme Court of Hackathon Validation
            </div>
            <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-gray-900 uppercase">
              Official Certificate of Adjudication
            </h1>
            <p className="text-xs text-gray-500 italic mt-1 font-serif">
              Issued on {dateStr} · {caseId}
            </p>
            <div className="w-48 h-0.5 bg-[#c2ad82] mx-auto mt-3" />
          </div>

          {/* Defendant Idea */}
          <div className="text-center mb-6">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#8a7550] block mb-1">
              IN THE MATTER OF THE DEFENDANT PROJECT:
            </span>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-gray-950">
              &ldquo;{ideaCase.idea}&rdquo;
            </h2>
            {ideaCase.track && (
              <span className="inline-block mt-1 text-xs text-gray-600 bg-amber-100/70 border border-amber-200 px-3 py-0.5 rounded-full">
                Track: {ideaCase.track}
              </span>
            )}
          </div>

          {/* Stamped Verdict & Score Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-6 p-4 rounded-xl bg-white/70 border border-[#d6cbb8]">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full bg-[#fffef9] border-[3px] border-[#8b6f3b] shadow-md shrink-0">
              <span className="font-serif text-4xl font-black text-gray-900">{report.score}</span>
              <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">/ 100 Score</span>
            </div>

            {/* Rubber Stamp Badge */}
            <div
              className={`transform -rotate-1 px-6 py-4 rounded-xl border-[3px] shadow-lg text-center ${
                isWinner
                  ? "bg-emerald-900 text-white border-emerald-300"
                  : isNeedsWork
                  ? "bg-amber-900 text-white border-amber-300"
                  : "bg-red-900 text-white border-red-300"
              }`}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase block opacity-80">
                OFFICIAL COURT VERDICT
              </span>
              <h3 className="text-lg md:text-xl font-black tracking-wide font-sans">{report.verdict}</h3>
              <p className="text-xs opacity-90 italic mt-0.5">{report.tagline}</p>
            </div>
          </div>

          {/* Formal Sentence quote */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 mb-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8a7550] block mb-1">
              ⚖️ Presiding Sentence of Justice Owl
            </span>
            <p className="font-serif italic text-sm md:text-base text-gray-800 leading-relaxed max-w-2xl mx-auto">
              &ldquo;{report.finalSentence}&rdquo;
            </p>
          </div>

          {/* Web Researcher validation badge */}
          {report.researcherNotes && (
            <div className="mb-6 p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong>Detective Heron Web Dossier:</strong> {report.researcherNotes}
              </div>
            </div>
          )}

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#d6cbb8] text-center">
            <div>
              <div className="font-serif italic text-base text-gray-800 h-7 flex items-end justify-center">
                Justice Owl
              </div>
              <div className="w-full h-px bg-gray-400 mt-1 mb-1" />
              <span className="text-[10px] font-bold uppercase text-[#8a7550]">Presiding Judge</span>
            </div>
            <div>
              <div className="font-serif italic text-base text-gray-800 h-7 flex items-end justify-center">
                Perry Coo-per
              </div>
              <div className="w-full h-px bg-gray-400 mt-1 mb-1" />
              <span className="text-[10px] font-bold uppercase text-[#8a7550]">Defense Attorney</span>
            </div>
            <div>
              <div className="font-serif italic text-base text-gray-800 h-7 flex items-end justify-center">
                Vector McSquaw
              </div>
              <div className="w-full h-px bg-gray-400 mt-1 mb-1" />
              <span className="text-[10px] font-bold uppercase text-[#8a7550]">Lead Prosecutor</span>
            </div>
            <div>
              <div className="font-serif italic text-base text-gray-800 h-7 flex items-end justify-center">
                Detective Heron
              </div>
              <div className="w-full h-px bg-gray-400 mt-1 mb-1" />
              <span className="text-[10px] font-bold uppercase text-[#8a7550]">Web Researcher</span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl bg-[#354d50] hover:bg-[#263e41] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Rendering PNG…" : "Download Certificate (.PNG)"}</span>
            </button>

            <button
              onClick={handleCopyImage}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Image Copied!" : "Copy Image"}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
