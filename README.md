<p align="center">
  <img src="https://img.shields.io/badge/100%25-In_Browser-00e5ff?style=for-the-badge&labelColor=0a0a0a" alt="In Browser" />
  <img src="https://img.shields.io/badge/Zero-API_Keys-a0ff00?style=for-the-badge&labelColor=0a0a0a" alt="Zero API Keys" />
  <img src="https://img.shields.io/badge/Fully-Private-ff6ec7?style=for-the-badge&labelColor=0a0a0a" alt="Fully Private" />
</p>

<h1 align="center">
  🤖 Neural — Voice-Reactive AI Avatar
</h1>

<p align="center">
  <strong>A fully client-side AI assistant with a voice-reactive robot avatar, powered by WebGPU.</strong><br/>
  No servers. No API keys. No accounts. Everything runs in your browser.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-models">Models</a> •
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## ✨ What is Neural?

Neural is an AI chatbot that runs **entirely in your browser** — the LLM, the text-to-speech engine, and the animated avatar all execute locally on your GPU via WebGPU. Your conversations never leave your device.

### Key Highlights

- **🧠 Local AI Inference** — Choose from **7 language models** (0.5B → 3.8B parameters) compiled for WebGPU via [MLC WebLLM](https://github.com/mlc-ai/web-llm). Models download once and are cached.
- **🔊 Neural Voice** — [Kokoro TTS](https://github.com/hexgrad/kokoro) (82M params) generates natural speech with real-time audio analysis driving the avatar's animations.
- **🎤 Voice Input** — Speak using the browser's Web Speech API. Your voice is transcribed locally.
- **🤖 Reactive Avatar** — Animated SVG robot with glowing eyes, LED mouth bars, 25+ action animations, and audio-reactive particles.
- **🔄 Synchronized Output** — Text, voice, and avatar animation are perfectly synced — the response text reveals only when TTS audio begins playing.
- **📱 Mobile-First Design** — Fully responsive layout with collapsible sidebar, compact mobile header, and optimized touch interactions.
- **🔀 Hot Model Switching** — Change AI models on the fly without reloading the page.

---

## 🚀 Quick Start

```bash
git clone https://github.com/witchcitygrower-hash/vivid-voice-avatars.git
cd vivid-voice-avatars
npm install
npm run dev
```

Open **http://localhost:5173** → Pick a model → Click **Load** → Start chatting.

> **Requirements:** Chrome 113+ / Edge 113+ / Safari 17+ with WebGPU support. GPU with 1–4GB VRAM depending on model.

---

## 🎯 Features

| Feature | Description | Technology |
|---------|-------------|------------|
| 🧠 **7 AI Models** | From ultra-light (0.5B) to powerful (3.8B), all running locally | WebLLM + WebGPU |
| 🔊 **Neural TTS** | 82M-param text-to-speech with natural prosody | Kokoro TTS |
| 🤖 **Reactive Avatar** | Audio-driven SVG robot with 25+ animations, glow effects & particles | Web Audio API + SVG |
| 🎤 **Voice Input** | Speech-to-text via browser API | Web Speech API |
| 🔄 **Synced Output** | Text, voice, and animation reveal together in perfect sync | Custom orchestration |
| 🔀 **Hot Model Switch** | Change models without page reload | WebLLM engine reset |
| 💬 **Streaming Chat** | Markdown-rendered responses with live token counting | React + react-markdown |
| ⚙️ **Model Tuning** | Adjust temperature, top-p, max tokens, system prompt | Real-time controls |
| 📊 **Performance HUD** | Live tokens/sec, response time, token count stats | Custom telemetry |
| 💾 **Chat History** | Persistent conversations with session management | localStorage |
| 📱 **Mobile Responsive** | Collapsible sidebar, compact header, touch-optimized | Responsive React layout |
| 🔒 **100% Private** | Zero network calls after model download | Client-side only |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client-Side Only)               │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Voice Input  │   │   WebLLM     │   │    Kokoro TTS        │ │
│  │              │   │              │   │                      │ │
│  │  Web Speech  │──▶│  WebGPU      │──▶│  82M-param model     │ │
│  │  API (STT)   │   │  Inference   │   │  Audio generation    │ │
│  └──────────────┘   └──────────────┘   └──────────┬───────────┘ │
│                                                    │             │
│                           ┌────────────────────────┤             │
│                           │  Sync Controller       │             │
│                           │  Text + Voice + Avatar │             │
│                           │  revealed together     │             │
│                           └────────────┬───────────┘             │
│                                        │                         │
│                              ┌─────────▼──────────┐             │
│                              │  Web Audio API     │             │
│                              │  FFT Analysis      │             │
│                              └─────────┬──────────┘             │
│                                        │                         │
│  ┌─────────────────────────────────────▼────────────────────────┐│
│  │                    SVG Avatar Engine                          ││
│  │  👁️ Glowing eyes  🔊 LED mouth  ✨ Particles  🎬 25+ actions ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌──────────────────────────────────────────────────┐           │
│  │              React UI Layer                      │           │
│  │  Chat • Model Picker • Hot Swap • Settings       │           │
│  │  Stats HUD • History • Mobile Layout             │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Models

All models are quantized to **q4f16_1** (4-bit weights, 16-bit activations) for efficient GPU execution.

| Model | Provider | Params | Download | VRAM | Quality | Best For |
|-------|----------|--------|----------|------|---------|----------|
| **Phi 3.5 Mini** | Microsoft | 3.8B | ~2.4GB | ~3.7GB | ★★★★★ | Highest quality responses |
| **Llama 3.2 3B** | Meta | 3B | ~1.8GB | ~3GB | ★★★★☆ | Strong reasoning |
| **Qwen 2.5 3B** | Alibaba | 3B | ~1.8GB | ~3GB | ★★★★☆ | Multilingual support |
| **SmolLM2 1.7B** | HuggingFace | 1.7B | ~1GB | ~2GB | ★★★☆☆ | Balanced speed/quality |
| **Qwen 2.5 1.5B** | Alibaba | 1.5B | ~1GB | ~2GB | ★★★☆☆ | Fast with decent output |
| **Llama 3.2 1B** | Meta | 1B | ~700MB | ~1.5GB | ★★☆☆☆ | Quick responses |
| **Qwen 2.5 0.5B** | Alibaba | 0.5B | ~350MB | ~1GB | ★☆☆☆☆ | Ultra-fast, minimal GPU |

---

## 🛠️ Tech Stack

| Frontend | AI / ML | Audio | Styling | Build |
|----------|---------|-------|---------|-------|
| React 18 | WebLLM | Kokoro TTS | Tailwind CSS | Vite |
| TypeScript | WebGPU | Web Audio API | shadcn/ui | ESLint |
| React Router | MLC Runtime | Web Speech API | Lucide Icons | Vitest |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── SVGAvatar.tsx          # Animated robot face with 25+ actions
│   ├── ChatBox.tsx            # Chat interface, model picker, hot swap
│   ├── AudioVisualizer.tsx    # Real-time audio frequency display
│   └── ui/                    # shadcn/ui component library
├── hooks/
│   ├── useWebLLM.ts           # WebLLM engine management & streaming
│   ├── useKokoroTTS.ts        # Kokoro TTS with onStart sync callback
│   ├── useAudioAnalyzer.ts    # FFT audio analysis (bass/mid/treble)
│   ├── useAvatarAnimations.ts # 25+ avatar action system
│   └── useChatHistory.ts      # Persistent session management
├── config/
│   └── models.ts              # Available model definitions
├── pages/
│   └── Index.tsx              # Responsive layout (mobile + desktop)
└── index.css                  # Design system tokens
```

---

## ⚙️ Configuration

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| **Temperature** | 0.0 – 2.0 | 0.7 | Lower = more focused, higher = more creative |
| **Top-P** | 0.0 – 1.0 | 0.9 | Nucleus sampling threshold |
| **Max Tokens** | 64 – 2048 | 512 | Maximum response length |
| **System Prompt** | Free text | *Neural personality* | Customize the AI's behavior |

---

## 🔒 Privacy

- **No telemetry** — zero analytics or tracking
- **No server calls** — after model download, everything is offline-capable
- **No accounts** — no sign-up, no login, no data collection
- **Local storage only** — chat history stays in your browser
- **Open source** — audit every line of code

---

## 🏗️ Building for Production

```bash
npm run build     # Outputs to dist/
npm run preview   # Preview production build locally
```

Deploy to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).

---

## 📄 License

MIT — use it however you want.

---

<p align="center">
  <sub>Built with 🧠 by <a href="https://github.com/witchcitygrower-hash">witchcitygrower-hash</a></sub>
</p>
