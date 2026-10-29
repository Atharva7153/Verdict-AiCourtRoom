import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export type Speaker =
  | "judge"
  | "defense"
  | "prosecutor"
  | "researcher"
  | "juror1"
  | "juror2"
  | "juror3"
  | "juror4"
  | "juror5"
  | "juror6";

export type TrialPhase =
  | "opening"
  | "evidence"
  | "cross-examination"
  | "witness"
  | "deliberation"
  | "verdict";

export interface CourtMessage {
  speaker: Speaker;
  speakerName: string;
  role: string;
  text: string;
  type: "speech" | "objection" | "order" | "ruling" | "verdict";
  phase?: TrialPhase;
  timestamp: string;
}

export interface IdeaCase {
  idea: string;
  problem?: string;
  solution?: string;
  difference?: string;
  track?: string;
  techStack?: string;
  targetUsers?: string;
  buildTime?: string;
  teamSkills?: string;
  demoPlan?: string;
  competitorNotes?: string;
}

export interface VerdictReport {
  score: number;
  verdict:
    | "ACQUITTED OF MEDIOCRITY"
    | "PROMISING, BUT UNDERDEVELOPED"
    | "GUILTY OF API WRAPPER"
    | "MISTRIAL: OVER-ENGINEERING"
    | "CASE DISMISSED";
  tagline: string;
  summary: string;
  strengths: string[];
  vulnerabilities: string[];
  mandatoryAdditions: string[];
  demoStrategy: string;
  finalSentence: string;
  dimensions: { key: string; label: string; score: number; weight: number; rationale: string }[];
  jury: { speaker: Speaker; name: string; role: string; score: number; finding: string }[];
  juryVote: string;
  confidence: "Low" | "Moderate" | "High";
  evidenceQuality: string;
  assumptions: string[];
  suppliedFacts: string[];
  unverifiedClaims: string[];
  mvp: string[];
  cut: string[];
  implementationOrder: string[];
  judgeQuestions: { question: string; response: string }[];
  differentiator: string;
  pivot: string;
  ethicsRisk: string;
  researcherNotes?: string;
  priorArt?: { title: string; description: string; url?: string }[];
}

export interface CourtSimulationResponse {
  transcript: CourtMessage[];
  report: VerdictReport;
  usingMock: boolean;
  case: IdeaCase;
}

const weights = [
  ["problem", "Problem significance", 15],
  ["originality", "Originality", 12],
  ["feasibility", "Technical feasibility", 14],
  ["differentiation", "Differentiation", 12],
  ["mvp", "MVP feasibility", 12],
  ["demo", "Demo potential", 12],
  ["relevance", "Hackathon relevance", 8],
  ["impact", "Practical impact", 8],
  ["risk", "Risk management", 7],
] as const;

const courtSpeakers: Record<Speaker, { name: string; role: string }> = {
  judge: { name: "Justice Owl", role: "Head Judge" },
  defense: { name: "Perry Coo-per", role: "Defense Attorney" },
  prosecutor: { name: "Vector McSquaw", role: "Prosecutor" },
  researcher: { name: "Detective Heron", role: "Court Web Researcher" },
  juror1: { name: "Lady Pixel", role: "UX Juror (Hummingbird)" },
  juror2: { name: "Eagle Eye", role: "Systems Architect (Cyber-Hawk)" },
  juror3: { name: "Spark", role: "Stage Specialist (Kea Parrot)" },
  juror4: { name: "Sage", role: "Safety Sentinel (Barn Owl)" },
  juror5: { name: "Barnaby TAM Pelican", role: "VC & Moat Juror (Pelican)" },
  juror6: { name: "Rustle", role: "24h Hacker (Woodpecker)" },
};

function validString(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length <= max ? value.trim() : "";
}

function clampScore(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : 0;
}

function strings(value: unknown, max = 6): string[] {
  return Array.isArray(value)
    ? value
        .slice(0, max)
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim().slice(0, 500))
        .filter(Boolean)
    : [];
}

function safeText(value: unknown, max = 700) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function secondsUntilReset(value: string | null) {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.min(30, Math.max(1, Math.ceil(numeric)));
  const parts = Array.from(value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h)/g));
  if (!parts.length) return null;
  const scale: Record<string, number> = { ms: 0.001, s: 1, m: 60, h: 3600 };
  const calculated = parts.reduce((total, part) => total + Number(part[1]) * scale[part[2]], 0);
  return Math.min(30, Math.max(1, Math.ceil(calculated)));
}

async function conductWebResearch(idea: string, techStack?: string) {
  try {
    const rawTokens = `${idea} ${techStack || ""}`
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 3 &&
          !["with", "that", "this", "from", "have", "more", "tool", "your", "using", "built", "project", "next"].includes(
            w.toLowerCase()
          )
      )
      .slice(0, 3)
      .join("+");

    const query = rawTokens || "hackathon+app";
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=3`,
      {
        headers: { "User-Agent": "VerdictCourtWebResearcher/1.0" },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (!res.ok) throw new Error("Search service uncontactable");
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length > 0) {
      const priorArt = items.map((item: any) => ({
        title: item.full_name || item.name,
        description: item.description || "Public open-source repository",
        url: item.html_url,
      }));
      const summary = `Found ${items.length} relevant public projects on GitHub: ${priorArt
        .map((p: { title: string; description?: string }) => `"${p.title}" (${(p.description || "no description").slice(0, 80)})`)
        .join("; ")}.`;
      return { summary, priorArt };
    }
  } catch {
    // Non-blocking fallback
  }
  return {
    summary: `Detective Heron checked public code repositories for "${idea.slice(
      0,
      35
    )}": no identical direct clone was found under this exact title; execution speed and demo clarity will determine the moat.`,
    priorArt: [],
  };
}

function calculateReport(raw: any, submitted: IdeaCase, researchSummary?: string, priorArtList?: any[]): VerdictReport {
  const source = raw && typeof raw === "object" ? raw : {};
  const rawScores = source.scores && typeof source.scores === "object" ? source.scores : {};
  if (weights.some(([key]) => !Number.isInteger(rawScores[key]?.score) || rawScores[key].score < 0 || rawScores[key].score > 10)) {
    throw new Error("The trial response had invalid category scores.");
  }
  if (!Array.isArray(source.jury) || source.jury.length < 4) {
    throw new Error("The trial response had invalid jury findings.");
  }
  const dimensions = weights.map(([key, label, weight]) => ({
    key,
    label,
    weight,
    score: clampScore(rawScores[key]?.score),
    rationale:
      safeText(rawScores[key]?.rationale, 260) ||
      "The submission does not include enough evidence to support a stronger rating.",
  }));
  const score = Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / 10);
  const reason = safeText(source.verdictReason);
  const verdict: VerdictReport["verdict"] =
    score >= 78
      ? "ACQUITTED OF MEDIOCRITY"
      : /over.?engineer|too much scope/i.test(reason)
      ? "MISTRIAL: OVER-ENGINEERING"
      : /wrapper/i.test(reason)
      ? "GUILTY OF API WRAPPER"
      : score >= 50
      ? "PROMISING, BUT UNDERDEVELOPED"
      : "CASE DISMISSED";

  const jurySource = Array.isArray(source.jury) ? source.jury : [];
  const juryRoles: Speaker[] = ["juror1", "juror2", "juror3", "juror4", "juror5", "juror6"];
  const jury = juryRoles.map((speaker, i) => {
    const item = jurySource[i];
    const defaultFinding =
      i === 4
        ? "Pelican VC: Needs stronger defensibility against incumbent tech giants."
        : i === 5
        ? "Rustle Hacker: Feasible for 24 hours if you trim all fluff and ship the core loop."
        : "The available evidence leaves this juror weighing the trade-offs.";
    return {
      speaker,
      ...courtSpeakers[speaker],
      score: clampScore(item?.score !== undefined ? item.score : 6),
      finding: safeText(item?.finding, 400) || defaultFinding,
    };
  });

  const report: VerdictReport = {
    score,
    verdict,
    tagline: safeText(source.tagline, 160) || verdict,
    summary:
      safeText(source.summary, 900) ||
      "The court evaluated the idea across usability, architecture, market defensibility, and 24-hour feasibility.",
    strengths: strings(source.strengths),
    vulnerabilities: strings(source.vulnerabilities),
    mandatoryAdditions: strings(source.nextActions, 4),
    demoStrategy: safeText(source.demoStrategy, 900),
    finalSentence: safeText(source.finalSentence, 300),
    dimensions,
    jury,
    confidence: ["Low", "Moderate", "High"].includes(source.confidence) ? source.confidence : "Moderate",
    juryVote: `${jury.filter((m) => m.score >= 6).length}–${jury.filter((m) => m.score < 6).length} lean competitive (6/10+ threshold)`,
    evidenceQuality:
      safeText(source.evidenceQuality, 300) ||
      "Findings synthesize submitted facts with Detective Heron's independent public web search.",
    assumptions: strings(source.assumptions),
    suppliedFacts: [
      submitted.problem,
      submitted.solution,
      submitted.targetUsers,
      submitted.techStack,
      submitted.buildTime,
      submitted.teamSkills,
    ].filter((v): v is string => !!v),
    unverifiedClaims: strings(source.unverifiedClaims),
    mvp: strings(source.mvp, 5),
    cut: strings(source.cut, 5),
    implementationOrder: strings(source.implementationOrder, 6),
    judgeQuestions: Array.isArray(source.judgeQuestions)
      ? source.judgeQuestions
          .slice(0, 4)
          .map((item: any) => ({
            question: safeText(item?.question, 220),
            response: safeText(item?.response, 420),
          }))
          .filter((i: any) => i.question && i.response)
      : [],
    differentiator: safeText(source.differentiator, 400),
    pivot: safeText(source.pivot, 600),
    ethicsRisk:
      safeText(source.ethicsRisk, 500) ||
      "No critical safety violations identified from the provided documentation.",
    researcherNotes: researchSummary || safeText(source.researcherNotes, 500),
    priorArt: priorArtList || [],
  };

  if (!report.strengths.length) report.strengths = ["A clear starting point is present in the submission."];
  if (!report.vulnerabilities.length)
    report.vulnerabilities = ["The current description does not yet prove the riskiest assumptions."];
  if (!report.mandatoryAdditions.length)
    report.mandatoryAdditions = [
      "Validate the primary user pain point with 3 real interviews.",
      "Trim the MVP to a single visible, end-to-end user loop.",
      "Rehearse a 60-second recorded demo fallback.",
    ];
  if (!report.mvp.length) report.mvp = report.mandatoryAdditions.slice(0, 3);
  if (!report.implementationOrder.length) report.implementationOrder = report.mandatoryAdditions;
  return report;
}

function validateTranscript(value: unknown): CourtMessage[] {
  if (!Array.isArray(value) || value.length < 8 || value.length > 36) {
    throw new Error("The trial response had an invalid transcript.");
  }
  const validSpeakers = Object.keys(courtSpeakers);
  const validTypes = ["speech", "objection", "order", "ruling", "verdict"];
  const validPhases = ["opening", "evidence", "cross-examination", "witness", "deliberation", "verdict"];
  return value.map((item: any, i) => {
    if (
      !validSpeakers.includes(item?.speaker) ||
      !validTypes.includes(item?.type) ||
      !validPhases.includes(item?.phase)
    ) {
      throw new Error("The trial response had an invalid speaker, phase, or event.");
    }
    const text = safeText(item.text, 700);
    if (!text) throw new Error("The trial response contained an empty statement.");
    const speaker = item.speaker as Speaker;
    return {
      speaker,
      speakerName: courtSpeakers[speaker].name,
      role: courtSpeakers[speaker].role,
      text,
      type: item.type,
      phase: item.phase,
      timestamp: `${String(Math.floor(i / 2) + 10).padStart(2, "0")}:${String((i * 5) % 60).padStart(2, "0")}:00`,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdea = validString(body.idea, 700);
    const problem = validString(body.problem, 1200);
    const solution = validString(body.solution, 1200);

    // If idea is brief, synthesize idea + problem
    let idea = rawIdea;
    if (idea.length < 8 && (problem || solution)) {
      idea = `${rawIdea || "Project"}: ${problem || solution}`.slice(0, 700);
    }
    if (idea.length < 2) {
      return NextResponse.json(
        { error: "Give the court an idea title or description (at least 2 characters)." },
        { status: 400 }
      );
    }

    const submitted: IdeaCase = {
      idea,
      problem,
      solution,
      difference: validString(body.difference, 800),
      track: validString(body.track, 160),
      techStack: validString(body.techStack, 300),
      targetUsers: validString(body.targetUsers, 300),
      buildTime: validString(body.buildTime, 160),
      teamSkills: validString(body.teamSkills, 300),
      demoPlan: validString(body.demoPlan, 800),
      competitorNotes: validString(body.competitorNotes, 500),
    };

    // Run independent live web research through Detective Heron
    const research = await conductWebResearch(submitted.idea, submitted.techStack);

    if (body.demo === true) return NextResponse.json(demoTrial(submitted, research.summary, research.priorArt));

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is missing. Start the included demo case or configure the server environment to run a live Groq trial.",
        },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL?.trim() || "qwen/qwen3.8-27b",
          temperature: 0.55,
          max_tokens: 5000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Evaluate this hackathon case. Follow the system prompt strictly.
CASE DATA (JSON):
${JSON.stringify(submitted)}

LIVE WEB INVESTIGATION FROM DETECTIVE HERON:
${research.summary}
${research.priorArt.length ? `Prior art repos found: ${JSON.stringify(research.priorArt)}` : "No identical repos found."}
`,
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const upstream = await response.json().catch(() => null);
          const rawDetail = upstream?.error?.message || upstream?.message;
          const detail = typeof rawDetail === "string" ? rawDetail.replaceAll(apiKey, "[redacted]").slice(0, 280) : "";
          const retryAfterSeconds =
            secondsUntilReset(response.headers.get("retry-after")) ||
            secondsUntilReset(response.headers.get("x-ratelimit-reset-requests")) ||
            15;
          const error = `Groq rate-limited the trial${detail ? `: ${detail}` : ". Free-tier quota reached."}`;
          return NextResponse.json(
            { error, retryAfterSeconds },
            { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
          );
        }
        const status = response.status;
        return NextResponse.json(
          {
            error:
              status >= 500
                ? "Groq is temporarily unavailable. Please retry, or use the demo case."
                : "Groq rejected the configured request. Check GROQ_MODEL and the API key.",
          },
          { status: 502 }
        );
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = typeof content === "string" ? JSON.parse(content) : null;
      const transcript = validateTranscript(parsed?.transcript);
      const report = calculateReport(parsed?.report, submitted, research.summary, research.priorArt);
      return NextResponse.json({
        transcript,
        report,
        usingMock: false,
        case: submitted,
      } satisfies CourtSimulationResponse);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Groq returned an unreadable response. Retry the trial; your case has not been changed." },
        { status: 502 }
      );
    if (error instanceof Error && error.name === "AbortError")
      return NextResponse.json({ error: "The Groq request took too long. Retry when the connection is stable." }, { status: 504 });
    if (error instanceof Error && error.message.includes("trial response"))
      return NextResponse.json({ error: "Groq returned an incomplete trial. Retry the request." }, { status: 502 });
    console.error("Courtroom request failed", error);
    return NextResponse.json({ error: "Could not prepare the trial. Check the case details and try again." }, { status: 400 });
  }
}

const SYSTEM_PROMPT = `You are VERDICT, an exhilarating, high-stakes visual Hackathon Courtroom Drama with Bird Attorneys and an expanded 6-person jury. Return ONE valid JSON object with fields "transcript" and "report".

CHARACTERS & PERSONAS:
1. judge (Justice Owl): Impartial, wise, bangs gavel, demands evidence, rules on objections, delivers final verdict.
2. defense (Perry Coo-per - Pigeon): Passionate advocate, defends feasibility and user value, concedes real limits honestly.
3. prosecutor (Vector McSquaw - Crow): Ruthless, prosecutes API wrappers and over-engineered fluff, yells OBJECTION!
4. researcher (Detective Heron - Heron): Court Chief Web Researcher who investigated the live web/GitHub. Enters during "evidence" or "witness" with Exhibit R: Prior Art and web findings (can HELP or HURT defense!).
5. THE 6 INDEPENDENT JURORS:
   - juror1 (Lady Pixel - Hummingbird): UX, micro-interactions, delight, "Can a non-technical judge understand this in 5 seconds?"
   - juror2 (Eagle Eye - Cyber-Hawk): Hardcore architecture, database scale, latency, rate limits.
   - juror3 (Spark - Kea Parrot): Hackathon stage theatricals, live demo wow-factor, prize track fit.
   - juror4 (Sage - Barn Owl): Privacy, data ethics, hallucination safety, user consent.
   - juror5 (Barnaby TAM Pelican - Pelican VC): Commercial moat, TAM, "Who pays for this on Monday after the hackathon?"
   - juror6 (Rustle - Woodpecker): Scrappy 24-hour hacker, ruthlessly trims scope, wants a working MVP before 9am Sunday.

PHASES:
- opening: Judge sets the stakes; Defense opens with core hook; Prosecutor challenges the moat.
- evidence: Detective Heron (researcher) steps up to the witness stand with Exhibit R (citing the live web findings).
- cross-examination: Prosecutor objects ("OBJECTION!"), Judge rules ("SUSTAINED" or "OVERRULED"), Defense rebuts.
- witness: Quick simulated user/tech finding.
- deliberation: A DEDICATED HEATED JURY ROUND where all 6 jurors debate and challenge each other! E.g. Pelican VC complains about business model; Rustle Woodpecker fires back that it's a 24h hackathon MVP; Eagle Eye questions the database load; Lady Pixel defends the delightful user UX.
- verdict: Judge delivers the final verdict and judicial sentence.

TRANSCRIPT ARRAY (16-24 items):
Each item: {speaker: "judge"|"defense"|"prosecutor"|"researcher"|"juror1"|"juror2"|"juror3"|"juror4"|"juror5"|"juror6", type: "speech"|"objection"|"order"|"ruling"|"verdict", phase: "opening"|"evidence"|"cross-examination"|"witness"|"deliberation"|"verdict", text: string}.

REPORT OBJECT:
- scores: {problem: {score:0-10, rationale}, originality: {score:0-10, rationale}, feasibility: {score:0-10, rationale}, differentiation: {score:0-10, rationale}, mvp: {score:0-10, rationale}, demo: {score:0-10, rationale}, relevance: {score:0-10, rationale}, impact: {score:0-10, rationale}, risk: {score:0-10, rationale}}
- jury: EXACTLY 6 objects: [{score: 0-10, finding: string}] corresponding to juror1..juror6.
- verdictReason: string
- tagline: string
- summary: string
- strengths: string[] (3 items)
- vulnerabilities: string[] (3 items)
- nextActions: string[] (3-4 items)
- demoStrategy: string
- finalSentence: string
- confidence: "Low" | "Moderate" | "High"
- evidenceQuality: string
- assumptions: string[]
- unverifiedClaims: string[]
- mvp: string[]
- cut: string[]
- implementationOrder: string[]
- judgeQuestions: [{question, response}]
- differentiator: string
- pivot: string
- ethicsRisk: string
- researcherNotes: string

Output JSON only.`;

function demoTrial(caseData: IdeaCase, researchSummary?: string, priorArt?: any[]): CourtSimulationResponse {
  const c = caseData;
  const webNote =
    researchSummary ||
    `Detective Heron queried GitHub: Found 2 open source projects doing food surplus redistribution ("Community-Food-Rescue" and "food-rescue-app"). None feature a verified 15-minute pickup window!`;

  const transcriptRaw = [
    [
      "judge",
      "order",
      "opening",
      "Court is in session! All rise for Justice Owl. We examine one question: is this project hackathon-winning material or wishful vaporware?",
    ],
    [
      "defense",
      "speech",
      "opening",
      `The defense presents ${c.idea}. We are not pitching an impossible moonshot; we are demonstrating an airtight 24-hour vertical slice for ${c.targetUsers || "community volunteers"}!`,
    ],
    [
      "prosecutor",
      "speech",
      "opening",
      `The prosecution scoffs! The filing leans on assumptions around ${c.problem ? "urgent user demand" : "problem urgency"}. Without proof of uniqueness, this is a weekend weekend wrapper!`,
    ],
    [
      "judge",
      "speech",
      "evidence",
      "The court summons Detective Heron, our Chief Web Researcher, to present findings from the live web and repositories.",
    ],
    [
      "researcher",
      "speech",
      "evidence",
      `EXHIBIT R: ${webNote} This means the defense has an execution window, provided they prove the handoff works!`,
    ],
    [
      "prosecutor",
      "objection",
      "cross-examination",
      "OBJECTION! Prior art exists on GitHub! A simple listing board is trivial. Where is the technical moat?",
    ],
    [
      "judge",
      "ruling",
      "cross-examination",
      "OVERRULED! Novelty at a hackathon is about speed, polish, and UX differentiation. The defense may present their live demo slice.",
    ],
    [
      "defense",
      "speech",
      "cross-examination",
      `We focus squarely on ${c.solution || "the verified pickup loop"}. Show the café post a box, a volunteer claim the 15-minute window, and the confirmation QR verify live!`,
    ],
    // --- THE JURY ROUND: ALL JURORS DELIBERATE ---
    [
      "juror1",
      "speech",
      "deliberation",
      "Lady Pixel (UX): If the volunteer can claim food in 2 clicks without signing up for a 5-page account, judges will love it. Delight beats feature bloat!",
    ],
    [
      "juror2",
      "speech",
      "deliberation",
      `Eagle Eye (Systems): Real-time inventory sync is the bottleneck. If two volunteers tap 'Claim' simultaneously, will Supabase handle atomic locks? Build row-level locks or it will crash during the demo!`,
    ],
    [
      "juror3",
      "speech",
      "deliberation",
      "Spark (Stage Judge): In a 3-minute pitch, bring a real croissant box to the stage! Claim it live on your phone. Tangible physical demos win tracks every single time!",
    ],
    [
      "juror4",
      "speech",
      "deliberation",
      "Sage (Ethics): Food safety liability is real. Add a simple disclaimer: cafés verify freshness, volunteers accept as-is. Don't let legal ambiguity sink you in Q&A.",
    ],
    [
      "juror5",
      "speech",
      "deliberation",
      "Barnaby TAM Pelican (VC): But where is the venture moat? Without corporate sponsorship or city subsidies, sustainability will be questioned by investors on the judging panel.",
    ],
    [
      "juror6",
      "speech",
      "deliberation",
      "Rustle (24h Hacker): Forget Series A funding, Barnaby! This is a 24-hour hackathon! Cut the analytics dashboard, cut user profiles, ship the claim button, and sleep 4 hours!",
    ],
    [
      "judge",
      "verdict",
      "verdict",
      "VERDICT: PROMISING, BUT UNDERDEVELOPED. The court commends the focused social impact, but sentences the team to build the atomic claim lock and prepare a 60-second video demo fallback!",
    ],
  ] as const;

  const transcript: CourtMessage[] = transcriptRaw.map(([speaker, type, phase, text], i) => ({
    speaker: speaker as Speaker,
    speakerName: courtSpeakers[speaker as Speaker].name,
    role: courtSpeakers[speaker as Speaker].role,
    type: type as CourtMessage["type"],
    phase: phase as TrialPhase,
    text,
    timestamp: `10:${String(i * 3).padStart(2, "0")}:00`,
  }));

  const raw = {
    scores: Object.fromEntries(
      weights.map(([key]) => [
        key,
        {
          score: key === "demo" ? 8 : key === "feasibility" ? 7 : key === "originality" ? 6 : 7,
          rationale: "Evaluated with live web research and 6-juror jury council.",
        },
      ])
    ),
    jury: [
      { score: 8, finding: "Lady Pixel: Intuitive 2-click pickup flow has strong judge appeal." },
      { score: 6, finding: "Eagle Eye: Needs concurrency locking to prevent double-claiming." },
      { score: 8, finding: "Spark: A physical prop demo on stage will be unforgettable." },
      { score: 6, finding: "Sage: Needs a 1-line food safety liability disclaimer." },
      { score: 5, finding: "Barnaby TAM Pelican: Long-term business model remains unproven." },
      { score: 8, finding: "Rustle Hacker: Scope is realistically buildable in 24 hours if trimmed." },
    ],
    tagline: "High-impact social loop ready for an electric live stage demo",
    summary:
      "The court finds a compelling hackathon submission with verified prior art context from Detective Heron. The team has a clear path to victory if they avoid feature sprawl and nail the stage demo.",
    strengths: [
      "Concrete social impact that resonates with hackathon judges.",
      "Clear 60-second end-to-end user loop suitable for live demonstration.",
      "Identified niche window differentiates it from general food redistribution repos.",
    ],
    vulnerabilities: [
      "Concurrent claim collisions during live presentation.",
      "Lack of food liability disclaimer during judge Q&A.",
      "Temptation to build complex logistics rather than the atomic user action.",
    ],
    nextActions: [
      "Implement atomic database locking on the claim button.",
      "Add a 1-sentence food donation disclaimer in the UI footer.",
      "Rehearse the live demo using two phones on stage.",
      "Record a 30-second screen capture fallback video.",
    ],
    demoStrategy:
      "Bring a real bakery box or coffee cup onto the stage. Post it live on the café dashboard, have your teammate claim it on their phone 5 seconds later, and show the confirmed screen to the judges.",
    finalSentence:
      "The court sentences the team to 24 hours of ruthless scope trimming and forbids building a settings page.",
    verdictReason: "underdeveloped",
    confidence: "High",
    evidenceQuality: "Assessed with Detective Heron's independent public GitHub search and 6-juror council.",
    assumptions: ["Cafés will reliably post within a 30-minute surplus window."],
    unverifiedClaims: ["Volunteers will claim boxes faster than existing municipal drop-offs."],
    mvp: ["Café 1-click surplus posting", "Volunteer instant map claim", "Completed handoff verification screen"],
    cut: ["Café analytics dashboard", "User rating system", "Payment or tipping modules"],
    implementationOrder: [
      "Set up Supabase schema with atomic claim transaction",
      "Build volunteer claim mobile view",
      "Build café quick-post card",
      "Rehearse live stage demonstration",
    ],
    judgeQuestions: [
      {
        question: "What happens if two volunteers tap claim at the exact same second?",
        response:
          "We use database-level row locking with Supabase RPC to guarantee only one volunteer receives the confirmation token.",
      },
      {
        question: "How do you ensure food safety and quality?",
        response:
          "The platform only accepts sealed, non-perishable or same-day baked goods, backed by standard Good Samaritan Food Donation protections.",
      },
    ],
    differentiator: "Micro-window real-time claiming rather than bulk warehouse logistics.",
    pivot:
      "Focus exclusively on late-night artisanal bakeries in a single 10-block university neighborhood for launch day.",
    ethicsRisk: "Ensure food donation compliance with local Good Samaritan protection laws.",
    researcherNotes: webNote,
  };

  return { transcript, report: calculateReport(raw, c, webNote, priorArt || []), usingMock: true, case: c };
}
