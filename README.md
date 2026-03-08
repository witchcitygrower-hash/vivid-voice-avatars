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

<table>
<tr>
<td width="50%">

### 🧠 Local AI Inference
Choose from **7 language models** (0.5B → 3.8B parameters) compiled for WebGPU via [MLC WebLLM](https://github.com/mlc-ai/web-llm). Models download once and are cached by your browser — no re-downloading.

</td>
<td width="50%">

### 🔊 Neural Voice
[Kokoro TTS](https://github.com/hexgrad/kokoro) — an 82M-parameter text-to-speech model — generates natural speech with real-time audio analysis driving the avatar's mouth movements, LED bars, and particle effects.

</td>
</tr>
<tr>
<td width="50%">

### 🎤 Voice Input
Speak to Neural using the browser's built-in Web Speech API. Your voice is transcribed to text locally — no audio is sent anywhere.

</td>
<td width="50%">

### 🤖 Reactive Avatar
A fully animated SVG robot face with glowing eyes, LED mouth bars, antenna effects, and floating particles — all driven by real-time audio frequency analysis.

</td>
</tr>
</table>

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/witchcitygrower-hash/vivid-voice-avatars.git
cd vivid-voice-avatars

# Install dependencies
npm install

# Start dev server
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
| 🤖 **Reactive Avatar** | Audio-driven SVG robot with glow effects & particles | Web Audio API + SVG |
| 🎤 **Voice Input** | Speech-to-text via browser API | Web Speech API |
| 💬 **Streaming Chat** | Markdown-rendered responses with live token counting | React + react-markdown |
| ⚙️ **Model Tuning** | Adjust temperature, top-p, max tokens, system prompt | Real-time controls |
| 📊 **Performance HUD** | Live tokens/sec, response time, token count stats | Custom telemetry |
| 💾 **Chat History** | Persistent conversations with session management | localStorage |
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
│                                          ┌─────────▼──────────┐ │
│                                          │  Web Audio API     │ │
│                                          │                    │ │
│                                          │  FFT Analysis      │ │
│                                          │  Bass / Mid / High │ │
│                                          └─────────┬──────────┘ │
│                                                    │             │
│  ┌─────────────────────────────────────────────────▼──────────┐ │
│  │                    SVG Avatar Engine                        │ │
│  │                                                            │ │
│  │  👁️ Glowing eyes    🔊 LED mouth bars    ✨ Particles      │ │
│  │  📡 Antenna pulse   🎨 Reactive colors   💫 Status glow    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐           │
│  │              React UI Layer                      │           │
│  │                                                  │           │
│  │  Chat Interface • Model Picker • Settings Panel  │           │
│  │  Stats HUD • Chat History • Audio Visualizer     │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘

              ⬆️ Models downloaded once, cached in browser
              🚫 No server calls after initial load
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

> **Tip:** Models are cached in your browser after the first download. Switching between cached models is near-instant.

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="20%"><strong>Frontend</strong></td>
<td align="center" width="20%"><strong>AI / ML</strong></td>
<td align="center" width="20%"><strong>Audio</strong></td>
<td align="center" width="20%"><strong>Styling</strong></td>
<td align="center" width="20%"><strong>Build</strong></td>
</tr>
<tr>
<td align="center">
React 18<br/>
TypeScript<br/>
React Router
</td>
<td align="center">
WebLLM<br/>
WebGPU<br/>
MLC Runtime
</td>
<td align="center">
Kokoro TTS<br/>
Web Audio API<br/>
Web Speech API
</td>
<td align="center">
Tailwind CSS<br/>
shadcn/ui<br/>
Lucide Icons
</td>
<td align="center">
Vite<br/>
ESLint<br/>
Vitest
</td>
</tr>
</table>

---

## 📁 Project Structure

```
src/
├── components/
│   ├── SVGAvatar.tsx          # Animated robot face with audio reactivity
│   ├── ChatBox.tsx            # Chat interface, model picker, settings
│   ├── AudioVisualizer.tsx    # Real-time audio frequency display
│   └── ui/                   # shadcn/ui component library
├── hooks/
│   ├── useWebLLM.ts           # WebLLM engine management & streaming
│   ├── useKokoroTTS.ts        # Kokoro TTS initialization & playback
│   ├── useAudioAnalyzer.ts    # FFT audio analysis (bass/mid/treble)
│   └── useChatHistory.ts      # Persistent session management
├── config/
│   └── models.ts              # Available model definitions
├── pages/
│   └── Index.tsx              # Main layout with sidebar + chat
└── index.css                  # Design system tokens
```

---

## ⚙️ Configuration

Neural exposes real-time model tuning through the settings panel:

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| **Temperature** | 0.0 – 2.0 | 0.7 | Controls randomness. Lower = more focused, higher = more creative |
| **Top-P** | 0.0 – 1.0 | 0.9 | Nucleus sampling threshold |
| **Max Tokens** | 64 – 2048 | 512 | Maximum response length |
| **System Prompt** | Free text | *Neural personality* | Customize the AI's behavior and personality |

---

## 🔒 Privacy

Neural is designed with privacy as a core principle:

- **No telemetry** — zero analytics or tracking
- **No server calls** — after model download, everything is offline-capable
- **No accounts** — no sign-up, no login, no data collection
- **Local storage only** — chat history stays in your browser's localStorage
- **Open source** — audit every line of code

---

## 🏗️ Building for Production

```bash
npm run build     # Outputs to dist/
npm run preview   # Preview production build locally
```

The production build can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).

---

## 📄 License

MIT — use it however you want.

---

<p align="center">
  <sub>Built with 🧠 by <a href="https://github.com/witchcitygrower-hash">witchcitygrower-hash</a></sub>
</p>
