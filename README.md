# Decoder

Decoder is an AI-powered tool that transforms research papers into actionable product insights. Built for product managers, strategists, and executives who need to understand how emerging research impacts their product roadmap and competitive position.

## Features

### Dual Analysis Modes

- **Quick Analysis** — Fast, single-pass analysis that provides a summary, key findings, and basic product implications.
- **Deeper Analysis** — Multi-agent pipeline that delivers a full strategic breakdown: competitive landscape, build-vs-buy assessment, market opportunity, and risk analysis, all tailored to your company context.

### Multi-Agent Pipeline

The deeper analysis runs a two-stage pipeline:

1. **Agent 1 (Claims & Excerpts Extractor)** — Extracts and categorizes research claims (technical, performance, resource requirements, capabilities) with key text excerpts.
2. **Agent 2 (Strategic Context + Product Analyzer)** — Produces an executive briefing covering strategic fit, market opportunity, product implications, build assessment, and risk analysis.

### Company Context Integration

Provide your company name, website, and description to receive recommendations tailored to your existing capabilities, including capability overlap scoring.

### Multiple Input Methods

- PDF file upload (drag-and-drop, up to 10MB)
- Direct text paste for abstracts or excerpts

### Export & Sharing

- Export as Markdown or PDF
- Generate shareable links (30-day expiration)

### History

- Local storage of all previous analyses
- Search and filter through past results
- Pause and resume long-running analyses

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Anthropic Claude API
- **PDF Parsing**: pdfjs-dist (client-side extraction)
- **Rate Limiting**: Vercel KV
- **Deployment**: Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Environment Variables

You'll need to configure:

- `ANTHROPIC_API_KEY` — Your Anthropic API key
- Vercel KV credentials (for rate limiting, optional for local dev)
