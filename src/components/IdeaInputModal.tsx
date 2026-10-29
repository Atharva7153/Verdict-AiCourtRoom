"use client";
import React, { useState } from "react";
import { X, Scale, Sparkles, LoaderCircle, RotateCcw, Zap } from "lucide-react";
import { IdeaCase } from "@/app/api/court/route";

const blankForm: IdeaCase = {
  idea: "",
  problem: "",
  solution: "",
  targetUsers: "",
  difference: "",
  track: "",
  techStack: "",
  buildTime: "24 hours",
  teamSkills: "",
  demoPlan: "",
  competitorNotes: "",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitIdea: (data: IdeaCase, demo?: boolean) => void;
  isLoading: boolean;
  error?: string | null;
  retryWait?: number;
}

export default function IdeaInputModal({
  isOpen,
  onClose,
  onSubmitIdea,
  isLoading,
  error,
  retryWait = 0,
}: Props) {
  const [form, setForm] = useState<IdeaCase>(blankForm);

  if (!isOpen) return null;

  const update = (key: keyof IdeaCase, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const hasMinimumContent =
    form.idea.trim().length >= 2 ||
    (form.problem && form.problem.trim().length >= 6) ||
    (form.solution && form.solution.trim().length >= 6);

  const canSubmitLive = !isLoading && retryWait <= 0 && hasMinimumContent;

  const handleSubmit = (asDemo = false) => {
    let resolvedIdea = form.idea.trim();
    if (resolvedIdea.length < 8) {
      const extra = form.problem?.trim() || form.solution?.trim() || "Hackathon project submission";
      resolvedIdea = resolvedIdea ? `${resolvedIdea} — ${extra}` : extra;
    }
    onSubmitIdea({ ...form, idea: resolvedIdea }, asDemo);
  };

  const handleReset = () => {
    setForm(blankForm);
  };

  const fillTemplate = (title: string, problem: string, solution: string, stack: string) => {
    setForm({
      ...blankForm,
      idea: title,
      problem,
      solution,
      targetUsers: "Hackathon attendees & devs",
      difference: "Lightweight, zero-setup, focused on 1 core outcome.",
      techStack: stack,
      buildTime: "24 hours",
      teamSkills: "2 developers (full-stack + AI)",
      demoPlan: "Live end-to-end user loop completed in under 45 seconds on stage.",
    });
  };

  const input = (
    key: keyof IdeaCase,
    label: string,
    placeholder: string,
    area = false,
    required = false
  ) => (
    <label className={area ? "field field-wide" : "field"}>
      <span>
        {label}
        {required && <b> Required</b>}
      </span>
      {area ? (
        <textarea
          value={form[key] || ""}
          onChange={(e) => update(key, e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={key === "idea" ? 700 : 1200}
        />
      ) : (
        <input
          value={form[key] || ""}
          onChange={(e) => update(key, e.target.value)}
          placeholder={placeholder}
          maxLength={300}
        />
      )}
    </label>
  );

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <section className="case-modal" role="dialog" aria-modal="true" aria-labelledby="filing-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">The Supreme Court of Hackathons · Case filing</span>
            <h2 id="filing-title">Put your idea on trial.</h2>
            <p>Give the court the facts. Detective Heron will cross-reference the live web for prior art.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 flex items-center gap-1"
              title="Clear form"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
            <button className="close-button" onClick={onClose} disabled={isLoading} aria-label="Close case form">
              <X />
            </button>
          </div>
        </header>

        {/* Quick starter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 pb-1 text-xs text-gray-500">
          <span className="text-[10px] uppercase font-bold text-amber-800">Quick start templates:</span>
          <button
            type="button"
            onClick={() =>
              fillTemplate(
                "GitPulse — AI Pull Request Explainer",
                "Reviewers spend 40 mins understanding context across 10+ modified files.",
                "Generates an interactive visual flowchart of architectural blast-radius directly in PR comments.",
                "Next.js, GitHub Webhooks, Groq LLM"
              )
            }
            className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-medium"
          >
            ✦ AI Code Review
          </button>
          <button
            type="button"
            onClick={() =>
              fillTemplate(
                "HealthLens — Prescription Scanner",
                "Elderly patients often misread complex drug dosage labels and drug conflict warnings.",
                "Point your camera at 2 pill bottles; computer vision immediately highlights contraindications in high-contrast text.",
                "React Native, Supabase, OCR vision model"
              )
            }
            className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-medium"
          >
            ✦ Medical Scanner
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmitLive) handleSubmit(false);
          }}
        >
          <div className="form-grid">
            {input(
              "idea",
              "Idea name or one-line concept",
              "e.g. AI-assisted food rescue board or CodeAudit",
              true,
              true
            )}
            {input("problem", "Problem", "What specific problem needs solving?", true)}
            {input("solution", "Proposed solution", "What will your product do end-to-end?", true)}
            {input("targetUsers", "Target user", "Who has this urgent problem?")}
            {input("difference", "What makes it different?", "Your sharpest moat or unique angle")}
            {input("track", "Hackathon theme or track", "AI/ML, Social Good, DevTools, Web3, etc.")}
            {input("techStack", "Proposed stack", "Next.js, Python, Supabase, Groq, etc.")}
            {input("buildTime", "Time to build", "e.g. 24 hours, 48 hours")}
            {input("teamSkills", "Team size and skills", "e.g. 3 people: frontend, backend, design")}
            {input("demoPlan", "Demo plan", "What 60-second interaction will you show live?", true)}
            {input(
              "competitorNotes",
              "Competitor notes (optional)",
              "Any competitors you know of (Detective Heron will also check GitHub/web).",
              true
            )}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <p>{error}</p>
              {retryWait > 0 && (
                <p className="mt-1 font-bold">
                  Groq rate limit cooldown: {retryWait}s remaining. You can also run the trial instantly via Simulation mode!
                </p>
              )}
            </div>
          )}

          <footer className="modal-footer">
            <span>
              <Scale size={16} /> Detective Heron will query the public web for prior art to test your moat.
            </span>
            <div className="flex items-center gap-2">
              {retryWait > 0 && (
                <button
                  type="button"
                  className="px-3 py-2 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5"
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading || !hasMinimumContent}
                >
                  <Zap size={14} />
                  <span>Instant Simulation</span>
                </button>
              )}

              <button
                type="submit"
                className="submit-case"
                disabled={!canSubmitLive}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="spin" size={17} /> Filing case…
                  </>
                ) : retryWait > 0 ? (
                  `Wait ${retryWait}s`
                ) : (
                  <>
                    <Sparkles size={16} /> Call the court
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
