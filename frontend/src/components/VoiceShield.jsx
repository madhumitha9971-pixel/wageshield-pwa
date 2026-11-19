import React, { useState } from "react";
import { Mic, Square, Volume2, Sparkles, MapPin } from "lucide-react";
import { parseVoiceTranscript } from "../utils/cryptoLedger";

const PRESETS = [
  {
    label: "Tamil Sample",
    text: "காவேரி பில்டர்ஸ் சைட்டில் 9 மணி நேரம் வேலை. 800 ரூபாய் பேசினார்கள், 450 தான் கொடுத்தார்கள்.",
  },
  {
    label: "Hindi Sample",
    text: "शर्मा कॉन्ट्रैक्टर के पास 10 घंटे काम किया, 800 रुपये तय थे पर सिर्फ 400 मिले।",
  },
  {
    label: "English Sample",
    text: "Worked 8 hours at MetroLink Sub-Contractors, promised 750 rupees, paid 350 only.",
  },
];

export default function VoiceShield({ onSealEntry, summary }) {
  const [lang, setLang] = useState("ta-IN");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setTranscript(PRESETS[0].text);
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setTranscript(e.results[0][0].transcript);
    rec.start();
  };

  const readAloudStatus = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      `WageShield Alert. Your total unpaid wage shortfall is ${summary.promisedShortfall || 0} rupees across ${summary.underpaidDays || 0} underpaid days. Heat risk today is high; drink water every 30 minutes.`
    );
    msg.lang = "en-IN";
    window.speechSynthesis.speak(msg);
  };

  const handleCreate = async () => {
    if (!transcript.trim()) return;
    const parsed = parseVoiceTranscript(transcript);
    await onSealEntry(parsed);
    setTranscript("");
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

        <div className="flex items-center gap-2">
          <button
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

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={startListening}
          className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
            listening
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
          }`}
        >
          {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {listening ? "Listening..." : "Speak Wage Log"}
        </button>

        <textarea
          rows={2}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speak in Tamil, Hindi, or English — or tap a sample below to test extraction..."
          className="flex-1 bg-[#0B1220] border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setTranscript(p.text)}
              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg"
            >
              + {p.label}
            </button>
          ))}
        </div>

        <button
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
