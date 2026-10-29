"use client";
import React, { useState, useEffect, useRef } from "react";
import CourtScene3D from "@/components/CourtScene3D";
import CourtControls from "@/components/CourtControls";
import IdeaInputModal from "@/components/IdeaInputModal";
import VerdictReportModal from "@/components/VerdictReportModal";
import VerdictCertificateModal from "@/components/VerdictCertificateModal";
import TranscriptDrawer from "@/components/TranscriptDrawer";
import type { CourtMessage, CourtSimulationResponse, IdeaCase, TrialPhase } from "@/app/api/court/route";
import { Scale, BookOpen, Landmark, ArrowUpRight, History, Award, Info, Search } from "lucide-react";

const starterCase: IdeaCase = {
  idea: "A neighborhood food rescue tool that connects cafés with nearby community fridges before surplus meals go to waste.",
  problem: "Small cafés often have surplus food near closing time, while local community fridges have limited visibility into what is available.",
  solution: "A lightweight matching board that lets cafés post surplus portions and nearby volunteers claim a pickup window.",
  targetUsers: "Independent cafés, community fridge organizers, and local volunteers",
  difference: "Focus on a verified pickup handoff and availability window rather than a broad food marketplace.",
  track: "Climate & community impact",
  techStack: "Next.js, Supabase, maps API",
  buildTime: "24 hours",
  teamSkills: "3 people: frontend, backend, product design",
  demoPlan: "Post a sample surplus listing, claim it from the neighborhood view, and show the completed handoff.",
  competitorNotes: "Examined by Detective Heron on public GitHub repositories.",
};

type HistoryItem = { id: string; createdAt: string; result: CourtSimulationResponse; step: number };
const phaseLabels: Record<string, string> = {
  opening: "Opening statements",
  evidence: "Evidence & Web Research",
  "cross-examination": "Cross-examination",
  witness: "Witness testimony",
  deliberation: "Supreme Jury Deliberation",
  verdict: "The Verdict",
};

export default function Home() {
  const [cameraPreset, setCameraPreset] = useState<
    "overview" | "judge" | "defense" | "prosecutor" | "jury" | "researcher"
  >("overview");
  const [trial, setTrial] = useState<CourtSimulationResponse | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [auto, setAuto] = useState(false);
  const [replay, setReplay] = useState(0);
  const [caseOpen, setCaseOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState<IdeaCase>({ idea: "your next idea" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("verdict-history-v1");
      if (saved) setHistory(JSON.parse(saved));
      const active = localStorage.getItem("verdict-active-v1");
      if (active) {
        const parsed = JSON.parse(active) as { trial: CourtSimulationResponse; step: number };
        setTrial(parsed.trial);
        setCurrentCase(parsed.trial.case);
        setStep(Math.min(parsed.step, parsed.trial.transcript.length - 1));
      }
    } catch {
      localStorage.removeItem("verdict-history-v1");
    }
  }, []);

  useEffect(() => {
    if (trial) {
      try {
        localStorage.setItem("verdict-active-v1", JSON.stringify({ trial, step }));
      } catch {}
    }
  }, [trial, step]);

  useEffect(() => {
    const update = () => setRetryCountdown(Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)));
    update();
    if (retryUntil <= Date.now()) return;
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [retryUntil]);

  const runTrial = async (data: IdeaCase, demo = false) => {
    if (busy.current) return;
    if (!demo && Date.now() < retryUntil) {
      setError("Groq has asked the app to wait before retrying this live trial. You can use Instant Simulation.");
      return;
    }
    busy.current = true;
    setLoading(true);
    setError(null);
    setPlaying(false);
    setCurrentCase(data);
    try {
      const res = await fetch("/api/court", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, demo }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          const seconds = Math.min(30, Number(json.retryAfterSeconds) || 15);
          setRetryUntil(Date.now() + seconds * 1000);
        }
        throw new Error(json.error || "The court could not begin this trial.");
      }
      setRetryUntil(0);
      const result = json as CourtSimulationResponse;
      setTrial(result);
      setStep(0);
      setPlaying(false);
      setCaseOpen(false);
      const item: HistoryItem = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), result, step: 0 };
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 12);
        try {
          localStorage.setItem("verdict-history-v1", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The court could not begin this trial.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const openNewTrialModal = () => {
    setError(null);
    setCaseOpen(true);
  };

  const messages = trial?.transcript || [];
  const current = messages[step] || null;
  const currentText = current?.text;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!playing || !auto || !currentText) return;
    if (step >= messages.length - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(3400, Math.min(10000, currentText.length * 44));
    timer.current = setTimeout(() => setStep((n) => n + 1), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, auto, step, messages.length, currentText]);

  const loadHistory = (item: HistoryItem) => {
    setTrial(item.result);
    setCurrentCase(item.result.case);
    setStep(item.step);
    setPlaying(false);
    setHistoryOpen(false);
    setReportOpen(false);
    setCertificateOpen(false);
  };

  const phase = (current?.phase || "opening") as TrialPhase;

  return (
    <main className="verdict-app">
      <header className="topbar">
        <a href="#court" className="brand" aria-label="Verdict home">
          <span className="brand-seal">
            <Scale size={20} />
          </span>
          <span>
            <strong>VERDICT</strong>
            <small>THE HACKATHON COURT</small>
          </span>
        </a>
        <div className="top-case">
          {trial ? (
            <>
              <span className="case-live-dot" />
              CASE NO. {new Date().getFullYear()}—{String(history.length || 1).padStart(3, "0")}{" "}
              <b>{trial.usingMock ? "DEMO RECORD" : "LIVE TRIAL"}</b>
            </>
          ) : (
            <>
              <span className="case-live-dot muted" />
              COURTROOM OPEN <b>AWAITING FILING</b>
            </>
          )}
        </div>
        <div className="top-actions">
          {trial && (
            <button
              className="history-trigger"
              onClick={() => setCertificateOpen(true)}
              title="View official stamped certificate"
            >
              <Award size={16} />
              <span>Certificate</span>
            </button>
          )}
          <button className="history-trigger" onClick={() => setHistoryOpen((v) => !v)}>
            <History size={16} />
            <span>Past trials</span>
            {history.length > 0 && <i>{history.length}</i>}
          </button>
          <button className="file-button" onClick={openNewTrialModal}>
            <span>File a case</span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      {historyOpen && (
        <section className="history-menu" aria-label="Trial history">
          <div className="history-menu-head">
            <strong>Prior proceedings</strong>
            <button onClick={() => setHistoryOpen(false)}>Close</button>
          </div>
          {history.length === 0 ? (
            <p>No saved trials yet. Cases stay in this browser.</p>
          ) : (
            history.map((item) => (
              <button className="history-item" key={item.id} onClick={() => loadHistory(item)}>
                <span>
                  <b>{item.result.case.idea}</b>
                  <small>
                    {new Date(item.createdAt).toLocaleDateString()} · {item.result.usingMock ? "Demo" : "Groq analysis"}
                  </small>
                </span>
                <strong>
                  {item.result.report.score}
                  <small>/100</small>
                </strong>
              </button>
            ))
          )}
          <small className="local-note">Saved locally in this browser</small>
        </section>
      )}

      <section className="court-heading">
        <div>
          <div className="court-kicker">
            <span>✦</span> SUPREME COURT OF HACKATHON IDEAS <span>✦</span>
          </div>
          <h1>
            The people vs.{" "}
            <em>
              {trial
                ? currentCase.idea.length > 45
                  ? currentCase.idea.slice(0, 45) + "…"
                  : currentCase.idea
                : "your next idea"}
            </em>
          </h1>
          <p>
            {trial?.case.targetUsers || "An idea enters. A verdict comes out."}
            {trial && (
              <>
                {" "}
                <span className="heading-divider">/</span> {phaseLabels[phase]}
              </>
            )}
          </p>
        </div>
        <div className="heading-stamp">
          <span>COURT</span>
          <Landmark size={23} />
          <span>IN SESSION</span>
        </div>
      </section>

      <section id="court" className="court-frame">
        <div className="scene-label">
          <span>
            <span className="live-led" />
            {trial ? phaseLabels[phase] : "THE CHAMBER"}
          </span>
          <span>
            {trial
              ? `STATEMENT ${String(step + 1).padStart(2, "0")} / ${String(messages.length).padStart(2, "0")}`
              : "ALL RISE"}
          </span>
        </div>
        <div className="scene-stage">
          <CourtScene3D currentMessage={current} cameraPreset={cameraPreset} replayToken={replay} />
          <div className="scene-vignette" />
          <div className="scene-case-caption">
            <span>THE HONORABLE</span>
            <b>JUSTICE OWL</b>
            <i>Presiding with Detective Heron & 6 Jurors</i>
          </div>
          {!trial && (
            <div className="welcome-overlay">
              <span className="welcome-seal">
                <Scale size={27} />
              </span>
              <span className="eyebrow">The court is ready</span>
              <h2>
                Every idea deserves
                <br />a fair trial.
              </h2>
              <p>
                Defense, prosecution, Web Researcher Detective Heron, and 6 colorful independent jurors test your
                viability.
              </p>
              <div className="welcome-actions">
                <button className="submit-case" onClick={openNewTrialModal}>
                  File your idea <ArrowUpRight size={16} />
                </button>
                <button className="demo-link" onClick={() => runTrial(starterCase, true)} disabled={loading}>
                  <BookOpen size={15} /> {loading ? "Preparing demo…" : "Watch the demo case"}
                </button>
              </div>
              <small>Demo case is fictional · no API key required</small>
            </div>
          )}
        </div>

        <div className="scene-lower">
          <div className="cast-strip">
            <span className="eyebrow">THE COURT</span>
            <span className={`cast-chip judge-chip ${current?.speaker === "judge" ? "speaking" : ""}`}>
              <i>J</i> Justice Owl
            </span>
            <span className={`cast-chip defense-chip ${current?.speaker === "defense" ? "speaking" : ""}`}>
              <i>D</i> Perry Coo-per
            </span>
            <span className={`cast-chip prosecution-chip ${current?.speaker === "prosecutor" ? "speaking" : ""}`}>
              <i>P</i> Vector McSquaw
            </span>
            <span className={`cast-chip researcher-chip ${current?.speaker === "researcher" ? "speaking" : ""}`}>
              <i>H</i> Detective Heron (Web)
            </span>
            <span className="cast-divider" />
            <span className="eyebrow jury-label">THE JURY</span>
            <span className={`cast-chip ${current?.speaker?.startsWith("juror") ? "speaking" : ""}`}>
              <i>6</i> Independent Jurors
            </span>
          </div>
          <div className="scene-footnote">
            <Info size={13} /> Assessment is a decision aid backed by live web prior-art checks.
          </div>
        </div>
      </section>

      {error && (
        <div className="request-error" role="alert">
          <span>{error}</span>
          <button onClick={() => runTrial(currentCase, false)} disabled={loading || retryCountdown > 0}>
            {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Retry live trial"}
          </button>
          <button onClick={() => runTrial(currentCase.idea ? currentCase : starterCase, true)} disabled={loading}>
            Run simulation
          </button>
          <button className="error-close" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <CourtControls
        cameraPreset={cameraPreset}
        onSelectCamera={setCameraPreset}
        isPlaying={playing}
        onTogglePlay={() =>
          setPlaying((v) => {
            const next = !v;
            if (next) setAuto(true);
            return next;
          })
        }
        onNextStep={() => {
          setPlaying(false);
          setStep((v) => Math.min(v + 1, messages.length - 1));
        }}
        onResetTrial={() => {
          setPlaying(false);
          setStep(0);
        }}
        onOpenNewTrial={openNewTrialModal}
        onOpenReport={() => setReportOpen(true)}
        onOpenTranscript={() => setTranscriptOpen(true)}
        onOpenEvidence={() => setEvidenceOpen((v) => !v)}
        onOpenCertificate={() => setCertificateOpen(true)}
        hasReport={!!trial}
        stepIndex={step}
        totalSteps={messages.length}
        isComplete={!!messages.length && step >= messages.length - 1}
        autoAdvance={auto}
        onToggleAuto={() =>
          setAuto((v) => {
            const next = !v;
            setPlaying(next);
            return next;
          })
        }
        onReplay={() => setReplay((v) => v + 1)}
      />

      <footer className="app-footer">
        <span>VERDICT <i>·</i> Supreme Court of Hackathons.</span>
        <span>NO AUDIO. FULL PROCEEDINGS &amp; MANGA SPEEDLINES ON SCREEN.</span>
      </footer>

      <IdeaInputModal
        isOpen={caseOpen}
        onClose={() => {
          setCaseOpen(false);
          setError(null);
        }}
        onSubmitIdea={(data, demo) => runTrial(data, demo)}
        isLoading={loading}
        error={error}
        retryWait={retryCountdown}
      />

      {trial && (
        <VerdictReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          report={trial.report}
          ideaText={trial.case.idea}
          onOpenCertificate={() => {
            setReportOpen(false);
            setCertificateOpen(true);
          }}
          onUsePivot={(pivot) => {
            const revised = { ...trial.case, solution: pivot, difference: pivot };
            setReportOpen(false);
            void runTrial(revised, trial.usingMock);
          }}
          onAnotherPivot={async () => {
            const response = await fetch("/api/court/pivot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...trial.case,
                previousPivot: trial.report.pivot,
                demo: trial.usingMock,
              }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Could not suggest another pivot.");
            return data.pivot as string;
          }}
        />
      )}

      {trial && (
        <VerdictCertificateModal
          isOpen={certificateOpen}
          onClose={() => setCertificateOpen(false)}
          report={trial.report}
          ideaCase={trial.case}
        />
      )}

      {trial && (
        <TranscriptDrawer
          isOpen={transcriptOpen}
          onClose={() => setTranscriptOpen(false)}
          transcript={messages}
          currentStepIndex={step}
          onSelectStep={(i) => {
            setStep(i);
            setPlaying(false);
          }}
          report={trial.report}
          caseData={trial.case}
        />
      )}

      {evidenceOpen && (
        <aside className="evidence-panel" aria-label="Case exhibits">
          <header>
            <div>
              <span className="eyebrow">FILED EVIDENCE</span>
              <h2>Exhibits</h2>
            </div>
            <button onClick={() => setEvidenceOpen(false)} aria-label="Close exhibits">
              ×
            </button>
          </header>
          {trial ? (
            <>
              <p className="evidence-note">
                Submitted details and independent web dossier collected by Detective Heron.
              </p>
              {[
                ["A", "Problem statement", trial.case.problem],
                ["B", "Proposed solution", trial.case.solution],
                ["C", "Target users", trial.case.targetUsers],
                ["D", "Differentiator", trial.case.difference],
                ["E", "Technology stack", trial.case.techStack],
                ["F", "Build window & team", [trial.case.buildTime, trial.case.teamSkills].filter(Boolean).join(" · ")],
                ["G", "Demo plan", trial.case.demoPlan],
                ["H", "Competitor notes", trial.case.competitorNotes],
                ["R", "Detective Heron Web Dossier", trial.report.researcherNotes],
              ].map(([key, title, value]) => (
                <article className="exhibit" key={key}>
                  <span>EXHIBIT {key}</span>
                  <h3>{title}</h3>
                  <p>{value || "Not provided in the filing."}</p>
                  {!value && <small>Unverified / missing</small>}
                </article>
              ))}
              <button
                className="submit-case evidence-report"
                onClick={() => {
                  setEvidenceOpen(false);
                  setReportOpen(true);
                }}
              >
                View findings <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <p>File a case to create exhibits.</p>
          )}
        </aside>
      )}
    </main>
  );
}
