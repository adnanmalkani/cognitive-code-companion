# Claude Code Prompt — Cognitive Code Companion VS Code Extension

Use the following prompt as your initial instruction to Claude Code. Copy it in full.

---

## The Prompt

I'm building a VS Code extension called **"Cognitive Code Companion"** as part of a PhD application for a Human-Centered AI for Programming Environments position at the University of Amsterdam. The extension must demonstrate three things: (1) I can build VS Code extensions, (2) I can integrate LLMs into developer tools, and (3) I think about diverse cognitive styles in programming environments. It needs to be polished enough to publish on the VS Code marketplace and link in my application. The deadline is April 28, 2026.

### What the extension does

The user selects code in the editor, runs a command ("Explain This Code"), and gets an AI-generated explanation displayed in a sidebar webview panel. The key differentiator: the user can configure their **cognitive preference** in settings, which changes HOW the explanation is structured. This is the human-centered AI angle — the same code gets explained differently depending on how the user thinks.

### Cognitive Preference Modes (setting: `cognitiveCodCompanion.explanationStyle`)

1. **"step-by-step"** (default) — Line-by-line procedural walkthrough. Good for sequential thinkers.
2. **"big-picture-first"** — Starts with what the code achieves overall, then zooms into details. Good for top-down thinkers.
3. **"analogy-based"** — Explains using real-world analogies and metaphors. Good for conceptual/visual thinkers.
4. **"minimal"** — Terse, no hand-holding, just the essential logic. For experienced devs who want quick clarity.

### Technical Architecture

- **Language**: TypeScript (the whole extension, including the webview)
- **LLM Integration**: Use the Anthropic Claude API (`@anthropic-ai/sdk`). The user provides their API key via VS Code settings (`cognitiveCodCompanion.apiKey`). Use `claude-sonnet-4-20250514` as the model.
- **UI**: A VS Code Webview panel (sidebar) that renders the explanation in well-formatted markdown/HTML. The panel should have:
  - A header showing the current cognitive mode
  - A rendered explanation area with syntax highlighting for any code blocks (use a simple `<pre><code>` approach with VS Code's CSS variables for theming)
  - A small dropdown at the top of the panel to quickly switch cognitive mode without going to settings
  - A loading spinner/state while waiting for the API response
  - An empty state when no explanation has been requested yet
- **Commands**:
  - `cognitiveCodCompanion.explainCode` — Triggered from the command palette or right-click context menu on selected text. Sends the selected code + cognitive preference to Claude API, displays result in the sidebar.
- **Context Menu**: Add "Explain This Code" to the editor right-click context menu (only visible when text is selected).
- **Settings** (contributes.configuration):
  - `cognitiveCodCompanion.apiKey` (string, required) — Anthropic API key
  - `cognitiveCodCompanion.explanationStyle` (enum: step-by-step | big-picture-first | analogy-based | minimal, default: step-by-step)
  - `cognitiveCodCompanion.language` (string, default: "English") — Language for explanations, to support non-English speakers

### Prompt Engineering

The system prompt sent to Claude should be carefully crafted. Here is the structure:

```
System: You are a code explanation assistant embedded in a developer's IDE. Your job is to explain code clearly and helpfully. The user has selected the following cognitive preference: {mode}.

{mode-specific instructions — see below}

Always:
- Refer to the code the user selected, do not reproduce it in full unless necessary
- Use markdown formatting
- If the code contains accessibility-relevant patterns (e.g., ARIA attributes, semantic HTML, alt text), highlight them positively
- Keep explanations concise — respect the developer's time
- If the code language is ambiguous, state your assumption

Mode-specific instructions:
- step-by-step: "Walk through the code line by line or block by block. Number each step. Explain what each part does in sequence."
- big-picture-first: "Start with a 1-2 sentence summary of what this code achieves. Then break down the key components and how they connect. Only go line-by-line if the code is very short."
- analogy-based: "Explain this code using a real-world analogy or metaphor first. Then map the analogy back to the actual code constructs. Make the analogy relatable and non-technical."
- minimal: "Be terse. State what the code does, flag anything non-obvious or error-prone, and stop. No preamble, no encouragement."
```

### Project Structure

```
cognitive-code-companion/
├── src/
│   ├── extension.ts          # Activation, command registration
│   ├── anthropicClient.ts    # Claude API wrapper
│   ├── promptBuilder.ts      # Builds the system+user prompt based on cognitive mode
│   ├── webview/
│   │   ├── webviewProvider.ts # Webview sidebar provider
│   │   └── webview.html       # The HTML template for the sidebar panel
│   └── types.ts              # Shared types (CognitiveMode enum, etc.)
├── package.json
├── tsconfig.json
├── README.md                  # Marketplace-ready README with screenshots
├── CHANGELOG.md
├── LICENSE                    # MIT
└── .vscodeignore
```

### README Content (for the marketplace)

The README should include:

- A clear description framing this as a human-centered AI tool for inclusive programming
- A feature list
- A GIF/screenshot placeholder section (I will add these manually)
- A section explaining the cognitive preference modes and WHY they exist (link to HCI concepts like cognitive load theory, dual-process theory)
- Installation and setup instructions (how to add the API key)
- A "Philosophy" or "Why This Extension?" section explaining that IDEs should adapt to how developers think, not the other way around

### Quality Requirements

- No errors or warnings on `npm run compile`
- The extension should activate only when needed (use `onCommand` activation event)
- Handle errors gracefully: missing API key → show info message with a button to open settings; API failure → show error in the webview panel, not a modal
- The webview should respect VS Code's color theme (light/dark) using CSS variables
- Type everything properly, no `any` types

### Do NOT

- Do not use React or any framework for the webview — keep it plain HTML/CSS/JS for simplicity
- Do not bundle a local model — this is API-only
- Do not add telemetry or tracking of any kind
- Do not over-engineer — this is a focused, small extension that does one thing well

Please start by scaffolding the full project structure with all files, then implement each file. After implementation, verify it compiles with `npm run compile`.
