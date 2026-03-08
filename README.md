<p align="center">
  <img src="https://img.shields.io/badge/100%25-In_Browser-00e5ff?style=for-the-badge&labelColor=0a0a0a" alt="In Browser" />
  <img src="https://img.shields.io/badge/Zero-API_Keys-a0ff00?style=for-the-badge&labelColor=0a0a0a" alt="Zero API Keys" />
  <img src="https://img.shields.io/badge/Fully-Private-ff6ec7?style=for-the-badge&labelColor=0a0a0a" alt="Fully Private" />
  <img src="https://img.shields.io/badge/Mobile-Ready-ffa500?style=for-the-badge&labelColor=0a0a0a" alt="Mobile Ready" />
</p>

<h1 align="center">🤖 Neural</h1>
<h3 align="center">Voice-Reactive AI Avatar — Entirely In Your Browser</h3>

<p align="center">
  <strong>Talk to a robot that talks back.</strong><br/>
  Neural runs 7 language models, a neural text-to-speech engine, voice input, and a fully animated SVG avatar — all locally on your GPU via WebGPU. No servers. No API keys. No accounts. No data ever leaves your device.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-features-in-depth">Features</a> •
  <a href="#-available-models">Models</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-privacy">Privacy</a>
</p>

---

## ✨ What Makes Neural Different?

Most AI chatbots send your data to a server. Neural sends **nothing, anywhere, ever**.

The entire AI pipeline — from your voice input, through the language model, to the robot speaking back to you — runs **inside a single browser tab**. The models are downloaded once and cached. After that, Neural works fully offline.

And it's not just a text chatbot. Neural has a **personality**. It has a body. Ask it to do a backflip and it will. Ask it to dance and it grooves. Ask it to explode and... well, try it.

---

## 🚀 Quick Start

```bash
git clone https://github.com/witchcitygrower-hash/vivid-voice-avatars.git
cd vivid-voice-avatars
npm install
npm run dev
```

Open **http://localhost:5173** → Pick a model → Click **Initialize** → Start talking.

> **Browser Requirements:** Chrome 113+, Edge 113+, or Safari 17+ with WebGPU enabled.  
> **GPU Requirements:** 1–4 GB VRAM depending on model size (see [Models](#-available-models)).

---

## 🧩 How It Works

Neural orchestrates four browser-native AI systems into one seamless experience:

```
You speak → Browser transcribes → LLM thinks → Kokoro speaks → Avatar animates
             (Web Speech API)       (WebGPU)       (82M TTS)       (SVG + Audio FFT)
```

### Step by Step

1. **You type or speak** — Voice input uses the browser's built-in Web Speech API for instant, local speech-to-text. No audio leaves your device.

2. **The LLM generates a response** — Your message is processed by a quantized language model (0.5B–3.8B parameters) running directly on your GPU through WebGPU. The UI shows a "Thinking" indicator during this phase.

3. **Kokoro synthesizes speech** — The response text is fed to Kokoro TTS, an 82-million parameter text-to-speech model that generates natural-sounding audio with proper prosody and intonation.

4. **Everything reveals in sync** — This is the magic. The response text, the avatar animation, and the audio playback all trigger at the **exact same moment** — when `source.start()` fires on the audio buffer. No text appears early. No animation fires without sound.

5. **The avatar reacts** — Real-time FFT audio analysis extracts bass, mid, and treble frequencies. These drive the avatar's mouth movement, eye glow, particle effects, and LED bars in real-time.

6. **Actions fire** — Neural detects action keywords in both your message and its response ("backflip", "dance", "explode") and triggers the matching animation from a library of **100+ distinct avatar actions**.

---

## 🎯 Features In Depth

### 🧠 7 Local AI Models
Choose from seven language models ranging from ultra-light (0.5B parameters, ~350MB) to powerful (3.8B parameters, ~2.4GB). All are quantized to 4-bit precision (`q4f16_1`) for efficient GPU inference via [MLC WebLLM](https://github.com/mlc-ai/web-llm). Models download once and are permanently cached by your browser — switching between cached models is near-instant.

### 🔀 Hot Model Switching
Change models on the fly without reloading the page. Click the model badge in the header → select a new model → initialize. Your chat history persists across switches.

### 🔊 Neural Text-to-Speech
[Kokoro TTS](https://github.com/hexgrad/kokoro) is an 82-million parameter neural TTS model that produces remarkably natural speech. It runs entirely in the browser via ONNX Runtime Web. The voice has proper sentence pacing, emphasis, and natural breathing patterns — not robotic at all.

### 🎤 Voice Input
Press the microphone button and speak. The browser's native Web Speech API handles transcription locally — no audio recordings are sent to any server. Works in all major browsers that support the Web Speech API.

### 🤖 Reactive SVG Avatar
The robot avatar is a complex, hand-crafted SVG with:
- **Glowing cyan eyes** that pulse with audio intensity
- **LED mouth bars** that animate in sync with speech frequencies
- **Floating particles** that react to bass and treble levels
- **Antenna effects** that pulse with the beat
- **Body movement** driven by audio volume
- **100+ triggered actions** — backflip, dance, explode, hadouken, moonwalk, tornado, teleport, and many more

### 🔄 Perfect Audio-Text-Animation Sync
This is Neural's signature feature. Most chatbots show text immediately while TTS lags behind. Neural buffers the response during generation, synthesizes the audio, and then reveals **text + voice + animation simultaneously** when the audio buffer starts playing. The result is a seamless, natural conversation experience.

### ⚙️ Real-Time Model Tuning
Adjust generation parameters in real-time through the settings panel:

| Parameter | Range | Default | What It Does |
|-----------|-------|---------|-------------|
| **Temperature** | 0.0 – 2.0 | 0.6 | Controls randomness. Low = focused and predictable. High = creative and varied. |
| **Top-P** | 0.1 – 1.0 | 0.9 | Nucleus sampling. Lower values restrict the model to higher-probability tokens. |
| **Max Tokens** | 64 – 160 | 160 | Hard cap on response length. Keeps responses concise and conversational. |
| **System Prompt** | Free text | Neural personality | Fully customizable. Change the AI's personality, rules, and behavior. |

### 📊 Performance HUD
Live statistics appear after each response:
- **Token count** — how many tokens were generated
- **Tokens/second** — real-time inference speed (typically 15–60 tok/s depending on GPU and model)
- **Response time** — total wall-clock time from send to completion
- **Conversation stats** — running message count and word count

### 💾 Persistent Chat History
Conversations are automatically saved to `localStorage` with full session management:
- **Auto-save** — every message is persisted immediately
- **Session titles** — auto-generated from the first message
- **Session switching** — jump between past conversations instantly
- **Delete sessions** — clean up with one click
- **Model tracking** — each session remembers which model was used

### 📱 Fully Responsive Mobile Layout
Neural adapts completely to mobile screens:
- **Compact header** — mini avatar, status dot, and system badges in a slim top bar
- **Hamburger sidebar** — slide-out drawer for chat history and system info
- **Full-screen chat** — zero wasted space, messages fill the viewport
- **Touch-optimized** — properly sized tap targets, smooth scrolling, no accidental clicks

### 🔒 Absolute Privacy
- Zero analytics, zero tracking, zero telemetry
- No server calls after initial model download
- No accounts, no sign-up, no login
- All data stored locally in your browser
- Fully open source — audit every line

---

## 🧠 Available Models

All models use `q4f16_1` quantization (4-bit weights, 16-bit activations) for optimal GPU performance.

| Model | Provider | Parameters | Download Size | GPU VRAM | Quality | Best For |
|-------|----------|-----------|---------------|----------|---------|----------|
| **Phi 3.5 Mini** | Microsoft | 3.8B | ~2.4 GB | ~3.7 GB | ★★★★★ | Highest quality, complex reasoning |
| **Llama 3.2 3B** | Meta | 3B | ~1.8 GB | ~3 GB | ★★★★☆ | Strong general-purpose reasoning |
| **Qwen 2.5 3B** | Alibaba | 3B | ~1.8 GB | ~3 GB | ★★★★☆ | Excellent multilingual support |
| **SmolLM2 1.7B** | HuggingFace | 1.7B | ~1 GB | ~2 GB | ★★★☆☆ | Best balance of speed and quality |
| **Qwen 2.5 1.5B** | Alibaba | 1.5B | ~1 GB | ~2 GB | ★★★☆☆ | Fast responses, good output |
| **Llama 3.2 1B** | Meta | 1B | ~700 MB | ~1.5 GB | ★★☆☆☆ | Quick and lightweight |
| **Qwen 2.5 0.5B** | Alibaba | 0.5B | ~350 MB | ~1 GB | ★☆☆☆☆ | Ultra-fast, minimal GPU needed |

> **💡 Tip:** Models are cached permanently in your browser after the first download. Switching between cached models takes seconds, not minutes.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     BROWSER (100% Client-Side)                       │
│                                                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐  │
│  │ Voice Input  │    │   WebLLM      │    │     Kokoro TTS          │  │
│  │             │    │              │    │                         │  │
│  │ Web Speech  │───▶│  WebGPU LLM  │───▶│  82M-param ONNX model  │  │
│  │ API (STT)   │    │  Inference   │    │  Neural speech synth   │  │
│  └─────────────┘    └──────────────┘    └───────────┬─────────────┘  │
│                                                     │                │
│                      ┌──────────────────────────────┤                │
│                      │     Sync Controller          │                │
│                      │                              │                │
│                      │  Buffers response text       │                │
│                      │  until audio.start()         │                │
│                      │  then reveals all at once:   │                │
│                      │  📝 Text + 🔊 Voice + 🎬 Anim │                │
│                      └──────────────┬───────────────┘                │
│                                     │                                │
│                           ┌─────────▼──────────┐                     │
│                           │   Web Audio API    │                     │
│                           │                    │                     │
│                           │   FFT Analysis     │                     │
│                           │   Bass│Mid│Treble  │                     │
│                           └─────────┬──────────┘                     │
│                                     │                                │
│  ┌──────────────────────────────────▼───────────────────────────────┐│
│  │                    SVG Avatar Engine                              ││
│  │                                                                  ││
│  │  👁️ Glowing eyes     🔊 LED mouth bars     ✨ Floating particles  ││
│  │  📡 Antenna pulse    🎨 Reactive colors     💫 Status glow       ││
│  │  🎬 100+ actions     🤸 Physics-based       🌊 Audio-reactive    ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    React UI Layer                                ││
│  │                                                                  ││
│  │  💬 Chat Interface    🧠 Model Picker    🔀 Hot Model Swap       ││
│  │  ⚙️ Settings Panel    📊 Stats HUD       💾 Chat History         ││
│  │  🎤 Voice Controls    📱 Mobile Layout   🎨 Design System        ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘

              ⬆️ Models downloaded once, cached permanently
              🚫 Zero server calls after initial load
              🔒 Your data never leaves your device
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 + TypeScript | Component architecture and type safety |
| **Build** | Vite | Lightning-fast dev server and optimized builds |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| **AI Inference** | WebLLM (MLC) + WebGPU | Run quantized LLMs directly on the GPU |
| **Text-to-Speech** | Kokoro TTS (ONNX Runtime) | 82M-param neural TTS in the browser |
| **Speech Input** | Web Speech API | Browser-native speech-to-text |
| **Audio Analysis** | Web Audio API (FFT) | Real-time frequency extraction for avatar |
| **State** | React hooks + Zustand | Lightweight state management |
| **Routing** | React Router v6 | Client-side navigation |
| **Icons** | Lucide React | Consistent, beautiful iconography |
| **Testing** | Vitest | Fast unit testing |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── SVGAvatar.tsx            # 🤖 Animated robot — 500-line SVG with
│   │                            #    audio-reactive eyes, mouth, particles,
│   │                            #    antenna, arms, flames, and 100+ action
│   │                            #    animations (backflip, explode, dance...)
│   │
│   ├── ChatBox.tsx              # 💬 Full chat interface — model picker,
│   │                            #    hot model switching, settings panel,
│   │                            #    markdown rendering, voice controls,
│   │                            #    stats HUD, and typing indicators
│   │
│   ├── AudioVisualizer.tsx      # 📊 Real-time audio frequency bars
│   │
│   └── ui/                      # 🎨 shadcn/ui component library
│
├── hooks/
│   ├── useWebLLM.ts             # 🧠 WebLLM engine lifecycle — model loading,
│   │                            #    streaming generation, token counting,
│   │                            #    settings management, and engine reset
│   │                            #    for hot model switching
│   │
│   ├── useKokoroTTS.ts          # 🔊 Kokoro TTS — model init, text-to-speech
│   │                            #    synthesis, audio playback with onStart
│   │                            #    callback for sync, and audio analysis
│   │
│   ├── useAudioAnalyzer.ts      # 🎵 Web Audio API FFT — extracts volume,
│   │                            #    bass, mid, and treble in real-time
│   │                            #    from any audio source
│   │
│   ├── useAvatarAnimations.ts   # 🎬 Action detection and animation system —
│   │                            #    natural language → animation mapping,
│   │                            #    100+ actions with physics-based easing
│   │
│   ├── useChatHistory.ts        # 💾 localStorage session management —
│   │                            #    auto-save, session CRUD, model tracking
│   │
│   └── use-mobile.tsx           # 📱 Responsive breakpoint detection
│
├── config/
│   └── models.ts                # 📋 Model registry — IDs, names, sizes,
│                                #    VRAM requirements, quality ratings
│
├── pages/
│   └── Index.tsx                # 🏠 Main layout — desktop sidebar with
│                                #    avatar + history, mobile layout with
│                                #    compact header + hamburger drawer,
│                                #    orchestrates sync between all systems
│
└── index.css                    # 🎨 Design system — CSS custom properties,
                                 #    glow effects, fonts (Space Grotesk +
                                 #    JetBrains Mono), dark theme tokens
```

---

## 🔒 Privacy

Neural was built with a **privacy-first architecture**. Here's exactly what happens with your data:

| What | Where It Goes | Who Can See It |
|------|--------------|----------------|
| Your messages | `localStorage` in your browser | Only you |
| AI model weights | Browser cache (IndexedDB) | Only you |
| Voice recordings | Processed locally by Web Speech API | Only you |
| TTS audio | Generated in-memory, never saved | Only you |
| Analytics/telemetry | ❌ None collected | Nobody |
| Network requests | ❌ None after model download | Nobody |

**There is no server.** There is no database. There is no analytics. There are no cookies. After the models download, you can disconnect from the internet entirely and Neural continues to work.

---

## 🏗️ Building & Deploying

```bash
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

The output is a static site. Deploy anywhere:
- **Vercel** — `vercel deploy`
- **Netlify** — drag-and-drop the `dist/` folder
- **GitHub Pages** — push `dist/` to `gh-pages` branch
- **Cloudflare Pages** — connect your repo
- **Any static host** — just serve the `dist/` directory

---

## 🤝 Contributing

Neural is open source and contributions are welcome. Some ideas:

- 🌍 **Multilingual TTS** — add language/voice options to Kokoro
- 🎭 **Custom avatars** — let users design their own robot
- 📷 **Vision models** — add image understanding via WebGPU
- 🧩 **Plugin system** — extensible action/animation framework
- 🎮 **Gamepad support** — trigger actions with controller input

---

## 📄 License

MIT — use it however you want, commercially or otherwise.

---

<p align="center">
  <strong>Neural</strong> — Your AI assistant that lives in your browser, not on someone else's server.
</p>

<p align="center">
  <sub>Built with 🧠 by <a href="https://github.com/witchcitygrower-hash">witchcitygrower-hash</a></sub>
</p>
