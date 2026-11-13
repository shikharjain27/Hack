# plan.md — Unjargon (AI03 Accessible Learning Assistant)

> Context: 8-hour hackathon MVP. A dense textbook page (photo or pasted text) becomes a reading-level slider (Expert → Grade 10 → Grade 6) with live word diffs, readability gauges, faithfulness badges, a concept map, karaoke TTS and quiz cards. All AI comes from the Gemini API. No training, no DB, no auth. Save this file at the repo root as `plan.md` and run it step by step. **Each step ends with a working demo. Commit after each step.**

## Ground Rules for the Executor
- Repo root: `C:\Users\ADMIN\Desktop\Hack` (Windows, Git Bash). It holds `.env` (`GOOGLE_API_KEY=...`) and `.gitignore`. **Never overwrite, re-create or print either file.**
- `.gitignore` is UTF-16 encoded and ignores only `.env`. Before the first commit, **ask the user** whether you may rewrite it as UTF-8 with `.env`, `node_modules/`, `.next/` and `next-env.d.ts`. Don't append to it: mixing encodings corrupts the file.
- The API key is server-side only: `process.env.GOOGLE_API_KEY`, read only inside `src/app/api/**`. Never use a `NEXT_PUBLIC_` variable.
- Model: `gemini-2.5-flash`. Always set `responseMimeType: "application/json"` plus a `responseSchema`.
- Keep it simple: a few files, client components, no state libraries.

## 1. Tech Stack & Setup
Run once from the repo root. This scaffolds into a temp folder because create-next-app refuses a folder that already has `.env`, then copies with no-clobber so the existing `.env` and `.gitignore` survive:
```bash
npx create-next-app@latest tmp-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install --yes && cp -rn tmp-app/. . && rm -rf tmp-app && npm install && npm i @google/genai lucide-react diff d3-force && npm i -D @types/d3-force
```
- Next.js (App Router, TS), Tailwind (v4 CSS config), `lucide-react` icons, `@google/genai`.
- `diff`: `diffWords` for the red/green morph. `d3-force`: concept-map layout drawn as plain SVG.
- Readability (Flesch-Kincaid) is computed locally in `lib/readability.ts`, with no package.
- TTS is the browser `speechSynthesis` API, with `onboundary` events for word highlighting.

## 2. Data Models
`src/lib/types.ts` holds the TypeScript source of truth. `src/lib/schema.ts` mirrors it exactly as a `@google/genai` `responseSchema`, using `Type.OBJECT`/`Type.ARRAY`/`Type.STRING`/`Type.INTEGER`/`Type.BOOLEAN`, marks every field `required` and sets `propertyOrdering`.

### Call 1: `POST /api/transform` → `TransformResult`
```ts
interface Sentence { id: string; text: string }                  // source: "s1".."sN"
interface LevelSentence { id: string; text: string; source_ids: string[] } // ids: e1.., g1.., k1..
interface GlossaryItem { term: string; plain: string; emoji: string }
interface ConceptNode { id: string; label: string }
interface ConceptEdge { from: string; to: string; label: string }
interface QuizItem { q: string; options: string[]; answer: number; source_id: string } // 4 options, answer = index
interface TransformResult {
  title: string;
  source_sentences: Sentence[];          // verbatim transcription, 6–12 sentences
  levels: {
    expert:  LevelSentence[];            // lightly cleaned original
    grade10: LevelSentence[];
    grade6:  LevelSentence[];            // short sentences, no undefined jargon
  };
  glossary: GlossaryItem[];              // 5–8 terms taken from the source
  concept_map: { nodes: ConceptNode[]; edges: ConceptEdge[] }; // 6–10 nodes; edge ends must be node ids
  quiz: QuizItem[];                      // exactly 3
  diagram_alt_text: string;              // "" if the input has no diagram
}
```
Request body: `{ text?: string; imageBase64?: string; mimeType?: string }`. Send an image as an `inlineData` part.

### Call 2: `POST /api/verify` → `VerifyResult`
Request body: `{ source_sentences, levels }`. The prompt is: for every grade10/grade6 sentence, compare it with the source sentences it cites and list any facts, numbers or quantities that were lost or distorted.
```ts
interface Verdict { id: string; faithful: boolean; dropped_facts: string[]; note: string }
interface VerifyResult { verdicts: Verdict[] }   // one per grade10 + grade6 sentence
```

### Computed locally: `Metrics` (one per level, in `lib/readability.ts`)
```ts
interface Metrics { fkGrade: number; avgSentenceLen: number; jargonDensity: number } // jargon = % of words with ≥4 syllables or matching a glossary term
```
FK grade = `0.39*(words/sentences) + 11.8*(syllables/words) - 15.59`. Syllables use a vowel-group heuristic.

## 3. File & Folder Structure
```
.env                      (exists — DO NOT TOUCH)
.gitignore                (exists — ask before changing)
plan.md
public/sample/krebs.jpg   (optional: user-supplied photo; the sample works without it)
src/
  app/
    layout.tsx            fonts: Inter + Lexend (dyslexia-friendly toggle)
    page.tsx              workspace: input panel (left) + dashboard (right)
    globals.css
    api/transform/route.ts
    api/verify/route.ts
  lib/
    types.ts
    schema.ts             responseSchema objects for both calls
    gemini.ts             shared client + generateJSON<T>(parts, schema, systemPrompt)
    readability.ts
    sample.ts             SAMPLE_TEXT (dense Krebs-cycle paragraph, ~180 words, with numbers like "2 CO₂", "3 NADH")
    fixtures/sample-result.json   cached TransformResult + VerifyResult for offline/rate-limit fallback
  components/
    InputPanel.tsx        textarea, image dropzone, "Load Sample Input", "Unjargon it" button
    LevelSlider.tsx       3-stop range input
    DiffText.tsx          diffWords(expert, current) → red strikethrough / green insert spans + per-sentence badges
    Gauges.tsx            3 SVG semicircle gauges, CSS-transitioned needles
    ConceptMap.tsx        d3-force layout → SVG; click node → glossary card
    GlossaryCards.tsx
    KaraokePlayer.tsx     play/pause, speed 0.75–1.5x, word highlight
    QuizCards.tsx         flip cards; wrong answer → scroll to & flash source sentence
    SourcePanel.tsx       transcribed source sentences; highlights on badge hover
```

## 4. Step-by-Step Build Order

### Step 1: Scaffold, Gemini route, raw JSON (≈1.5h)
- Run the setup command. Write `types.ts`, `schema.ts`, `gemini.ts`, `sample.ts` and `api/transform/route.ts`. The route returns 400 on empty input and 500 with `{error}` on failure. The system prompt enforces the id prefixes, the counts and "grade6 ≤ 12 words/sentence".
- `page.tsx`: "Load Sample Input" fills the textarea. "Unjargon it" posts and shows a loading skeleton, then a temporary `<pre>` of the JSON.
- Add `?mock=1` support: the route returns `fixtures/sample-result.json` without calling Gemini. Save one real sample response as that fixture now.
- ✅ Demo: one click loads the sample, then real structured JSON renders.

### Step 2: Slider, diff and gauges, the core hook (≈2h)
- Remove the `<pre>`. Build `LevelSlider`, `DiffText` (join each level's sentences, `diffWords` against expert, animate with a short fade) and `readability.ts` + `Gauges` (needles move when the level changes, with the Expert value shown as a ghost tick).
- Show `title` and a header stat: "Grade 16.2 → 5.8".
- ✅ Demo: dragging Expert → Grade 6 morphs the text with red/green diffs as the gauges swing.

### Step 3: Faithfulness check and provenance (≈1.5h)
- `api/verify/route.ts` (call 2). The client calls it automatically after the transform succeeds. Badges show a spinner, then ✅ or ⚠️.
- In `DiffText`, render sentences as spans with a badge each. The ⚠️ tooltip lists `dropped_facts`. Hovering a sentence highlights its `source_ids` in `SourcePanel`.
- Image input: dropzone → base64 → same route. If `public/sample/krebs.jpg` exists, the sample button also shows that photo as a thumbnail.
- ✅ Demo: at Grade 6, at least one ⚠️ "dropped: produces 2 CO₂" shows, and hover lights up the source sentence.

### Step 4: Karaoke audio, concept map, glossary, quiz (≈2h)
- `KaraokePlayer`: speak the current level's text with `SpeechSynthesisUtterance`. `onboundary` gives `charIndex`, which maps to the word span to highlight. Add a speed select and a Lexend font toggle on the text area.
- `ConceptMap` (d3-force, ~300 ticks run synchronously, then a static SVG) and `GlossaryCards`. Clicking a node opens the matching card.
- `QuizCards`: 3 flip cards. A wrong answer scrolls to the `source_id` sentence and flashes it.
- Lay the dashboard out as tabs or a grid: **Read** (slider, diff, audio) | **Map** | **Quiz**. Use Lucide icons throughout.
- ✅ Demo: the full 4-beat pitch flow works end to end.

### Step 5: Demo hardening (≈1h, the buffer)
- On any API error, the client falls back automatically to the fixture and shows a small "cached" chip, so the demo never shows a blank screen.
- Polish: empty state, loading skeletons, consistent card styling, a laptop-sized (1440px) layout.
- Rehearse: fresh `npm run dev`, then Load Sample → Unjargon → slider → ⚠️ hover → play → quiz, in under 3 minutes. Run `npm run build` to catch type errors.

## 5. Cut List (Out of Scope)
- Auth, accounts, database, persistence, history, sharing, deployment polish.
- Mobile/tablet responsiveness (desktop at 1440px only) and cross-browser TTS testing (Chrome only).
- Bounding boxes on the photo (provenance highlights the transcribed text instead), PDF/DOCX ingestion, multi-page input.
- Gemini TTS, voice selection UI, audio download.
- Streaming responses, retries/backoff, rate limiting, input size validation beyond "not empty".
- Unit tests, i18n, dark mode, full accessibility audit (keep semantic HTML and contrast sensible).
- Extra reading levels, user-tunable levels, editing generated text.