# VERDICT — The Hackathon Court

A visual courtroom for testing hackathon ideas. Bird attorneys, Justice Owl, and four independent jurors examine the case through on-screen comic dialogue. There is no audio, voice input, or text-to-speech.

## Run locally

```bash
npm install
npm run dev
```

The fictional demo case works without credentials. To enable live Groq evaluations, set these server-only environment variables in `.env.local`:

```bash
GROQ_API_KEY=your-groq-api-key
# Optional; defaults to the Groq model `qwen/qwen3.8-27b`
GROQ_MODEL=qwen/qwen3.8-27b
```

Restart the development server after changing environment variables. The browser never receives the API key. If no key is configured, live case submissions explain the missing configuration and the demo remains available.

## What the app does

- Renders an interactive 3D courtroom and independent comic speech bubbles.
- Files a case with problem, users, solution, differentiator, stack, build window, team, and demo details.
- Runs a multi-phase evaluation through Groq when configured, with validated transcript structure and weighted score calculation on the server. The documented weights are problem 15%, originality 12%, feasibility 14%, differentiation 12%, MVP 12%, demo 12%, hackathon relevance 8%, practical impact 8%, and risk management 7%. Scores range from 0 (missing/weak) to 10 (exceptional and strongly supported).
- Shows a fictional demo proceeding with objection, ruling, juror disagreement, and verdict.
- Provides exhibits, jury findings, score rationale, action plan, transcript download, and local trial history.
- Stores history and the current proceeding in browser local storage. It is not synced to a database.

The score is a decision aid based on submitted information; no live competitor research is performed and the result does not predict competition outcomes.
