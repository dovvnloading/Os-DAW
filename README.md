<div align="center">

# OS-DAW
### Browser-Based Digital Audio Workstation

<br />

<img width="100%" alt="Os-Daw Interface Hero" src="https://github.com/user-attachments/assets/46623fc7-6a39-46e5-b2c5-996565337214" />

<br />
<br />

![Status](https://img.shields.io/badge/Status-Experimental_Prototype-orange?style=for-the-badge)
![License](https://img.shields.io/github/license/dovvnloading/Os-DAW?style=for-the-badge&color=blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

---

## Project Status & Manifesto

> **This repository is an experimental prototype.**

Os-Daw was built as a technical exploration to test the limits of the modern Web Audio API and React's rendering capabilities in a high-frequency state environment. It is not intended to replace commercial desktop software but rather to serve as a playground for developers interested in audio programming, DSP (Digital Signal Processing) in the browser, and UI/UX design for complex creative tools.

**Contribution Policy:**
There are no strict rules. This codebase is open for practice, experimentation, and learning. Feel free to fork the repository, refactor the audio engine, redesign the interface, or implement features solely to see if they are possible. All pull requests and forks are welcome in the spirit of open-source education.

---

## Overview

**Os-Daw** is a zero-dependency Digital Audio Workstation running entirely in the browser. It combines a custom-written TypeScript audio engine with a responsive React interface to deliver a production environment that includes synthesis, sampling, mixing, and arrangement.

Beyond standard production tools, Os-Daw integrates **Google Gemini** to provide context-aware AI assistance, allowing the system to analyze the current project state (BPM, track settings, synth parameters) and offer intelligent debugging or creative suggestions.

## Key Features

### Core Production
*   **Step Sequencer:** A 16-step rhythmic grid with immediate per-step feedback and playhead tracking.
*   **Pattern & Song Modes:** A dual-workflow system allowing for loop-based composition and linear timeline arrangement.
*   **Sample Management:** Native drag-and-drop support for WAV, MP3, and OGG files, alongside a procedural drum synthesis engine.
*   **Automation:** Real-time parameter manipulation for filters, envelopes, and effects during playback.

### Synthesis Engine
*   **Triple Oscillator Architecture:** Three oscillators per track offering Sine, Square (with PWM), Sawtooth (with Unison), and Triangle (with Wavefolding) options.
*   **Advanced Modulation:** Dedicated LFOs assignable to Pitch, Filter Cutoff, or Amplitude.
*   **ADSR Shaping:** precise Envelope control for amplitude shaping.
*   **Filter Topography:** Multi-mode filters (LowPass, HighPass, BandPass, Notch) with variable resonance.

### Signal Processing
*   **Mixing Console:** An analog-style mixer view with faders, panning, mute/solo groups, and stereo LED metering.
*   **FX Rack:** A dedicated effects chain per track featuring:
    *   3-Band Parametric EQ.
    *   Distortion & Saturation.
    *   Bitcrushing (Sample Rate Reduction).
    *   Stereo Chorus.
    *   Delay & Convolution Reverb.
*   **Master Bus:** Integrated dynamics processing to manage headroom and prevent digital clipping.

---

## Interface Tour

### The Timeline Arrangement
The timeline view moves beyond loop-based sequencing, offering a linear canvas for arranging patterns into full compositions. It features a scalable grid, playhead tracking, and block management.

<img width="100%" alt="Timeline View" src="https://github.com/user-attachments/assets/1febddea-fad7-42ae-8db6-a563a209979d" />

<br />

### The Mixing Console
Designed to mimic hardware desks, the mixer provides a high-level overview of the project's gain staging. It separates the creative composition process from the technical mixing process.

<img width="100%" alt="Mixer View" src="https://github.com/user-attachments/assets/c3db8bc5-4787-4e29-9995-371aa185539a" />

<br />

### The Synthesizer & Sound Design
The detail view allows for granular control over the sound generation engine. Users can visualize waveforms, adjust oscillator blending, and map modulation sources.

<img width="100%" alt="Synthesizer Editor" src="https://github.com/user-attachments/assets/9a91d672-7459-4c69-9927-6c44612806b9" />

---

## Technical Architecture

The core of Os-Daw operates on a detached logic separate from the UI thread to ensure timing accuracy.

### The Audio Engine
Located in `services/audioEngine.ts`, the engine wraps the native `AudioContext`.
*   **Lookahead Scheduling:** Uses the "scheduling ahead" technique to queue audio events slightly before their playback time, mitigating JavaScript garbage collection jitters.
*   **Node Graph:** Audio nodes are created and routed dynamically based on track types (Synth vs. Sampler).
*   **Visualizers:** An `AnalyserNode` taps the master output to drive real-time FFT (Fast Fourier Transform) and Oscilloscope renderings on an HTML5 Canvas.

### State Management
The application manages complex state (Tracks, Patterns, Timeline Blocks) via React hooks, ensuring that UI updates do not block the audio processing thread.

### AI Layer
The Assistant component captures a snapshot of the `ProjectState` JSON object. When a user queries the AI, this state is injected into the prompt context, allowing the Large Language Model (LLM) to "see" the settings of the DAW and provide specific advice rather than generic answers.

---

## Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **npm** or **yarn**

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/dovvnloading/Os-DAW.git
    cd Os-DAW
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration (Optional)**
    To enable the AI Assistant features, create a `.env.local` file in the root directory:
    ```env
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
    *Note: The DAW functions fully without an API key; only the chat assistant will be disabled.*

4.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Open your browser to `http://localhost:3000`.

---

## License

This project is open-sourced under the **Apache 2.0 License**.

You are free to use, modify, distribute, and sell this software, provided that you include the original copyright notice, a copy of the license, and a statement of any significant changes made to the code.
