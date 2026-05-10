<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0f,50:1a1a2e,100:16213e&height=200&section=header&text=BookPilot%20AI&fontSize=70&fontColor=e2c07d&fontAlignY=38&desc=AI-Curated%20Reading%2C%20Entirely%20In%20Your%20Browser&descAlignY=58&descColor=8b8fa8&animation=fadeIn" width="100%"/>

<br/>

<!-- Badges -->
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Transformers.js](https://img.shields.io/badge/Transformers.js-2.17-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/docs/transformers.js)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://bookpilotai.vercel.app)

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-bookpilotai.vercel.app-e2c07d?style=for-the-badge)](https://bookpilotai.vercel.app)

<br/>

```
  📖  Type what you feel like reading.
  🤖  AI understands the meaning, not just the words.
  ✨  Get recommendations that actually fit.
  🔒  Everything runs in your browser. Nothing leaves your device.
```

</div>

---

## ✦ What is BookPilot AI?

**BookPilot AI** is a semantic book recommendation engine that runs **entirely in your browser** — no backend, no API keys, no server costs.

You describe what you want to read in plain English. The AI understands the *meaning* behind your words and finds books that match — even when they share zero keywords with your query.

> *"a quiet story about grief and unexpected friendship"* → surfaces books you'd never find with a keyword search.

The magic: transformer-based sentence embeddings via **@xenova/transformers**, running locally over **WebAssembly**.

---

## ⚡ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   You type:  "a story about resilience set after war"       │
│                          │                                  │
│                          ▼                                  │
│            ┌─────────────────────────┐                      │
│            │  Transformer Model      │  ← runs in browser   │
│            │  (@xenova/transformers) │    via WebAssembly   │
│            └─────────────────────────┘                      │
│                          │                                  │
│              Query → Dense Vector [0.23, -0.81, ...]        │
│                          │                                  │
│                          ▼                                  │
│         Cosine similarity against all book embeddings       │
│                          │                                  │
│                          ▼                                  │
│         📚  Ranked results, best match first                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**No query ever leaves your device.**

---

## 🧠 Semantic Search vs. Keyword Search

| | Keyword Search | **BookPilot AI** |
|---|---|---|
| Matching | Exact token match | Conceptual meaning |
| Synonyms | ❌ Fails | ✅ Handles naturally |
| Vague queries | ❌ Returns nothing | ✅ Returns the best fit |
| Privacy | Query sent to server | ✅ Never leaves device |
| Infrastructure | Server required | ✅ Runs in browser |
| Cold start | Instant | ~3–10s (cached after) |

---

## 🛠️ Tech Stack

```yaml
Frontend:     React 19 + Vite 8
AI / NLP:     @xenova/transformers 2.17   # Hugging Face, in the browser
Animations:   Framer Motion 12
Icons:        Lucide React 1.14
Deployment:   Vercel (Edge CDN)
Languages:    JavaScript 55% · CSS 43% · HTML 2%
```

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/amaan-exe/bookai.git
cd bookai

# Install
npm install

# Run locally
npm run dev
```

> First search will download the embedding model (~20–80 MB). It's cached after that — subsequent queries respond in under 500ms.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
bookai/
├── public/          # Static assets
├── src/
│   ├── components/  # React components
│   ├── workers/     # Web Workers for model inference
│   └── main.jsx     # Entry point
├── index.html       # App shell
├── vite.config.js   # Vite + React plugin config
└── package.json
```

---

## ✨ Features

- 🔍 **Semantic search** — understands intent, not just keywords
- 🧠 **On-device inference** — transformer model runs in WebAssembly
- 🔒 **Zero data collection** — queries never leave the browser
- 💨 **Instant after first load** — model weights cached by browser
- 🎞️ **Smooth animations** — staggered results via Framer Motion
- 📱 **Responsive** — works on desktop and mobile
- 🆓 **Free to run** — no API costs, no backend

---

## 👥 Team

| Name | Roll No |
|---|---|
| Md Amanullah | 202456266 |
| Ashish Kumar | 202456244 |
| Aditya Kumar | 202456245 |

*NIST University, Berhampur — B.Tech Project, April 2026*
*Under the guidance of Dr. Gayatri Panda*

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:16213e,50:1a1a2e,100:0a0a0f&height=100&section=footer" width="100%"/>

*Built with React + Vite + Transformers.js · Deployed on Vercel*

</div>
