# Neural Avatar

An AI-powered robot avatar that runs **100% in your browser** — no servers, no API keys, no accounts needed.

Choose from **7 AI models** (0.5B–3.8B parameters) via WebLLM + WebGPU, with **Kokoro TTS** for voice output and mouth sync.

## Requirements

- **Browser**: Chrome 113+, Edge 113+, or Safari 17+ (WebGPU required)
- **GPU**: 1–4GB VRAM depending on model choice
- **Node.js**: 18+ (for building)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

Select an AI model and click **"Load"** — models download once and are cached by your browser.

## Available Models

| Model | Parameters | Download | VRAM | Quality |
|-------|-----------|----------|------|---------|
| Phi 3.5 Mini | 3.8B | ~2.4GB | ~3.7GB | ★★★★★ |
| Llama 3.2 3B | 3B | ~1.8GB | ~3GB | ★★★★ |
| Qwen 2.5 3B | 3B | ~1.8GB | ~3GB | ★★★★ |
| SmolLM2 1.7B | 1.7B | ~1GB | ~2GB | ★★★ |
| Qwen 2.5 1.5B | 1.5B | ~1GB | ~2GB | ★★★ |
| Llama 3.2 1B | 1B | ~700MB | ~1.5GB | ★★ |
| Qwen 2.5 0.5B | 0.5B | ~350MB | ~1GB | ★ |

## Features

- 🤖 **SVG Robot Avatar** — audio-reactive face with glowing eyes, LED mouth bars, and particle effects
- 🧠 **7 AI Models** — from ultra-light (0.5B) to powerful (3.8B), all running locally via WebGPU
- 🔊 **Kokoro TTS** — 82M parameter text-to-speech with real-time mouth sync
- 🎤 **Voice Input** — speech-to-text via Web Speech API + real-time audio visualization
- 📸 **Image Upload** — attach images to messages (multimodal support coming)
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
- Kokoro TTS (kokoro-js)
- Web Audio API + Web Speech API
