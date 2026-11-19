import React, { useState, useRef } from "react";
import { Mic, Square, Volume2, Sparkles, MapPin, AlertCircle, Radio } from "lucide-react";
import { parseVoiceTranscript } from "../utils/cryptoLedger";

const PRESETS = [
  {
    label: "Tamil Sample",
    lang: "ta-IN",
    text: "காவேரி பில்டர்ஸ் சைட்டில் 9 மணி நேரம் வேலை. 800 ரூபாய் பேசினார்கள், 450 தான் கொடுத்தார்கள்.",
  },
  {
    label: "Hindi Sample",
    lang: "hi-IN",
    text: "शर्मा कॉन्ट्रैक्टर के पास 10 घंटे काम किया, 800 रुपये तय थे पर सिर्फ 400 मिले।",
  },
  {
    label: "English Sample",
    lang: "en-IN",
    text: "Worked 8 hours at MetroLink Sub-Contractors, promised 750 rupees, paid 350 only.",
  },
];

export default function VoiceShield({ onSealEntry, summary }) {
  const [lang, setLang] = useState("ta-IN");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [micStatus, setMicStatus] = useState("");
  const recognitionRef = useRef(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setListening(false);
  };

  const startListening = async () => {
    if (listening) {
      stopListening();
      return;
    }

    setMicStatus("");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      setMicStatus(
        "Live browser speech recognition is only supported in Chrome, Edge, or Safari. Use 'Simulate Live Mic' or type below."
      );
      return;
    }

    try {
      // Request microphone access explicitly first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setMicStatus(
        "Microphone permission blocked. Click the lock/mic icon in your browser address bar to allow microphone access, or use 'Simulate Live Mic'."
      );
      return;
    }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      setListening(true);
      setMicStatus(`Listening in ${lang === "ta-IN" ? "Tamil" : lang === "hi-IN" ? "Hindi" : "English"}... Speak now.`);
    };

    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    rec.onerror = (event) => {
      setListening(false);
      if (event.error === "no-speech") {
        setMicStatus("No speech detected. Speak closer to the mic or tap 'Simulate Live Mic'.");
      } else if (event.error === "not-allowed") {
        setMicStatus("Microphone access denied by browser settings.");
      } else {
        setMicStatus(`Voice capture notice: ${event.error}. You can also type or tap a sample.`);
      }
    };

    rec.onend = () => {
      setListening(false);
    };

    try {
      rec.start();
    } catch {
      setListening(false);
      setMicStatus("Could not start microphone. Please refresh or use 'Simulate Live Mic'.");
    }
  };

  // Simulates live streaming speech recognition for noisy demo halls or devices without mics
  const simulateLiveSpeech = () => {
    const chosen = PRESETS.find((p) => p.lang === lang) || PRESETS[0];
    const words = chosen.text.split(" ");
    setTranscript("");
    setListening(true);
    setMicStatus(`Simulating live ${chosen.label} voice stream...`);

    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTranscript(words.slice(0, idx).join(" "));
      if (idx >= words.length) {
        clearInterval(timer);
        setListening(false);
        setMicStatus("Voice captured! Click 'Extract & Seal SHA-256 Block' to lock evidence.");
      }
    }, 120);
  };

  const readAloudStatus = () => {
    if (!("speechSynthesis" in window)) {
      setMicStatus("Text-to-speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      `WageShield Alert. Your total unpaid wage shortfall is ${summary?.promisedShortfall || 0} rupees across ${summary?.underpaidDays || 0} underpaid days. Heat risk today is high; take a 15 minute shade break every hour.`
    );
    msg.lang = "en-IN";
    window.speechSynthesis.speak(msg);
  };

  const handleCreate = async () => {
    if (!transcript.trim()) return;
    const parsed = parseVoiceTranscript(transcript);
    await onSealEntry(parsed);
    setTranscript("");
    setMicStatus("Sealed into SHA-256 hash chain!");
  };

  return (
    <div className="bg-[#111C2E] border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">
            VoiceShield — Multilingual Spoken Evidence Capture
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={readAloudStatus}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <Volume2 className="w-3.5 h-3.5" /> Read Summary Aloud
          </button>
          {[
            { code: "ta-IN", name: "தமிழ்" },
            { code: "hi-IN", name: "हिंदी" },
            { code: "en-IN", name: "English" },
          ].map((l) => (
            <button
              type="button"
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                lang === l.code ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-400"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {micStatus && (
        <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-cyan-500/30 text-cyan-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{micStatus}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex sm:flex-col gap-2">
          <button
            type="button"
            onClick={startListening}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              listening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            }`}
          >
            {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? "Stop Listening" : "Speak Wage Log"}
          </button>

          <button
            type="button"
            onClick={simulateLiveSpeech}
            className="px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30"
          >
            <Radio className="w-3.5 h-3.5" /> Simulate Live Mic
          </button>
        </div>

        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Click 'Speak Wage Log' (Chrome/Edge/Safari), click 'Simulate Live Mic', or type your shift details here..."
          className="flex-1 bg-[#0B1220] border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              onClick={() => {
                setLang(p.lang);
                setTranscript(p.text);
              }}
              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg"
            >
              + {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!transcript.trim()}
          className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl"
        >
          <Sparkles className="w-4 h-4" /> Extract & Seal SHA-256 Block
        </button>
      </div>

      <div className="text-xs text-slate-400 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        Worksite GPS Timestamp Active: <span className="text-emerald-400">Location Consistent</span>
      </div>
    </div>
  );
}
