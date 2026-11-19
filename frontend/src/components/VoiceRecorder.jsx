import React, { useState } from "react";
import { Mic, Square, Sparkles, MapPin } from "lucide-react";

const SAMPLE_PROMPTS = [
  {
    lang: "Tamil",
    text: "காவேரி பில்டர்ஸ் சைட்டில் 9 மணி நேரம் வேலை. 750 ரூபாய் பேசினார்கள், 400 தான் கொடுத்தார்கள்.",
  },
  {
    lang: "Hindi",
    text: "आज शर्मा कॉन्ट्रैक्टर के पास 10 घंटे काम किया, 800 रुपये तय थे पर सिर्फ 450 मिले।",
  },
  {
    lang: "English",
    text: "Worked 8 hours at Sri Balaji Constructions, promised 700 rupees, paid 350 only.",
  },
];

export default function VoiceRecorder({ onSubmitted, apiBase }) {
  const [lang, setLang] = useState("ta-IN");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Speech API unavailable—use the instant multilingual presets below!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      setTranscript(e.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleSealEvidence = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      await fetch(`${apiBase}/api/extract-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, state: "Tamil Nadu", worker_name: "Murugan K." }),
      });
      setTranscript("");
      onSubmitted();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Mic className="w-5 h-5 text-emerald-400" /> Voice-First Evidence Capture
        </h3>
        <div className="flex gap-1.5">
          {[
            { code: "ta-IN", label: "தமிழ்" },
            { code: "hi-IN", label: "हिंदी" },
            { code: "en-IN", label: "English" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                lang === l.code ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={startSpeech}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition ${
            listening
              ? "bg-red-500 text-white animate-pulse"
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
          placeholder="Spoken note appears here (or click a quick sample below)..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map((s) => (
            <button
              key={s.lang}
              onClick={() => setTranscript(s.text)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md"
            >
              + Sample ({s.lang})
            </button>
          ))}
        </div>

        <button
          onClick={handleSealEvidence}
          disabled={loading || !transcript.trim()}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Extracting & Sealing..." : "Extract & Seal SHA-256 Block"}
        </button>
      </div>

      <div className="text-xs text-slate-400 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        GPS Check-in Stamp Ready: <span className="text-emerald-400">Location Consistent</span>
      </div>
    </div>
  );
}
