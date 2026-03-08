# Neural Avatar

An AI-powered robot avatar that runs **100% in your browser** — no servers, no API keys, no accounts needed.

Uses **Phi-3.5-mini (3.8B parameters)** via WebLLM + WebGPU for intelligent, private conversations.

## Requirements

- **Browser**: Chrome 113+, Edge 113+, or Safari 17+ (WebGPU required)
- **GPU**: ~3.7GB VRAM (most modern GPUs work)
- **Node.js**: 18+ (for building)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

Click **"Load Model"** in the chat box — the model (~2.4GB) downloads once and is cached by your browser.

## Features

- 🤖 **SVG Robot Avatar** — audio-reactive face with glowing eyes, LED mouth bars, and particle effects
- 🧠 **In-Browser AI** — Phi-3.5-mini runs locally via WebGPU, no cloud needed
- 🎤 **Microphone Input** — real-time audio visualization with frequency analysis
- 💬 **Chat Interface** — markdown-rendered streaming responses
- 🔒 **100% Private** — nothing leaves your browser

## Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- WebLLM (@mlc-ai/web-llm)
- Web Audio API
