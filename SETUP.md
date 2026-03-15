# Setup: Adding New Skills

This project has two skill systems:

1. `Prompt skills` (in `src/skills/`) used by `/api/generate` for code-generation guidance.
2. `Agent skills` (in `src/components/AgentPanel/` + `src/hooks/useGeminiAgent.ts`) used by the Gemini Agent panel actions like image analysis, TTS, image generation.

Use the section below that matches what you are adding.

## A) Add a New Prompt Skill (guidance markdown)

Example: adding `finance` as a new guidance skill.

1. Create the markdown file.
- Add `src/skills/finance.md`.
- Put patterns, constraints, dos/donts, and short examples.

2. Register the file import.
- Edit `src/skills/index.ts`.
- Add an import: `import financeSkill from "./finance.md";`

3. Add the skill key to guidance list.
- In `GUIDANCE_SKILLS`, add `"finance"`.

4. Map key -> content.
- In `guidanceSkillContent`, add: `finance: financeSkill,`

5. Add detection vocabulary.
- In `SKILL_DETECTION_PROMPT` (same file), add one bullet for `finance` with relevant keywords.
- This is required so classifier can select it.

That is the minimum needed for prompt-skill routing.

## B) Add a New Prompt Skill (example code skill)

Example: adding `example-candlestick`.

1. Add or identify an example in `src/examples/code/` and ensure it has a unique `id` in `src/examples/code/index` source.
2. Edit `src/skills/index.ts`:
- Add key to `EXAMPLE_SKILLS` (for example `"example-candlestick"`).
- Add mapping in `exampleIdMap` to the real example id.
- Add one line in `SKILL_DETECTION_PROMPT` under Code examples.

## C) Make Story Planner Aware of New Skill (optional but recommended)

If you want story planning to explicitly emit your new skill in `skillHints`, update:

1. `src/lib/gemini/agent.ts`
- In `createStoryPlannerAgent()` instruction:
- Add your skill name to the "Available tags" line.
- Add a short section describing when to include that skill in `skillHints`.

2. (Optional) Add build-time guidance in `createSceneBuilderAgent()` instruction if your skill requires specific component patterns.

## D) Add a New Agent Panel Skill (Analyze/Generate button)

If you mean a new card in Agent Panel (not prompt-skill routing), update these files:

1. `src/hooks/useGeminiAgent.ts`
- Extend `AgentSkillRunOptions["skill"]` union.
- Add run logic in `runSkill()` (new endpoint call or branch).

2. `src/components/AgentPanel/AgentPanel.tsx`
- Add card/button that opens `SkillDialog` with your new `skill` key.
- Add UI labels and any input controls needed.

3. API route
- Add or extend endpoint in `src/app/api/agent/*/route.ts`.

4. Types
- Add result type in `src/lib/gemini/types.ts` if payload shape is new.

## E) If Your Skill Needs a Capability Toggle

Capabilities gate what the story agent can use.

Update:
1. `src/lib/gemini/types.ts`
- Add field to `AgentCapabilities`.
- Add default in `DEFAULT_CAPABILITIES`.

2. `src/components/AgentPanel/AgentPanel.tsx`
- Add toggle button in the Agent capabilities grid.

3. `src/lib/gemini/agent.ts`
- Add handling in `capabilityBlock()` and prompt instructions where needed.

## File Change Checklist

For a new guidance prompt skill, you usually edit:
- `src/skills/<new-skill>.md`
- `src/skills/index.ts`
- `src/lib/gemini/agent.ts` (optional but recommended)

For a new Agent Panel action skill, you usually edit:
- `src/hooks/useGeminiAgent.ts`
- `src/components/AgentPanel/AgentPanel.tsx`
- `src/app/api/agent/.../route.ts`
- `src/lib/gemini/types.ts` (if needed)

## Quick Validation

After changes:

1. Run `npm run dev`.
2. Trigger a prompt that should match your new skill.
3. Confirm the detected skill appears and generated output reflects your skill guidance.
4. If it is an Agent Panel skill, run it from the panel and confirm route + UI response.
