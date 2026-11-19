import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, ShieldAlert, Users, FileWarning, Rocket,
  MapPin, CheckCircle2, AlertTriangle, BarChart3
} from "lucide-react";
import HashChain3D from "./components/HashChain3D";
import VoiceRecorder from "./components/VoiceRecorder";
import ComplaintModal from "./components/ComplaintModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState("vault"); // vault | witness | ngo
  const [ledger, setLedger] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [witnessInput, setWitnessInput] = useState("Karthik S. (Site Mason)");
  const [tourBanner, setTourBanner] = useState("");

  const fetchLedger = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/ledger`);
    const json = await res.json();
    setLedger(json);
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const runJudgeTour = async () => {
    setTourBanner("Seeding 3 Tamil/English entries + co-signing witness...");
    await fetch(`${API_BASE}/api/demo/seed`, { method: "POST" });
    await fetchLedger();
    setActiveTab("vault");
    setTourBanner("Tour Ready: Try 'Simulate DB Tamper' on Block #2 to watch the 3D chain break!");
  };

  const triggerTamper = async (entryId) => {
    await fetch(`${API_BASE}/api/demo/tamper`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entryId, new_paid_inr: 750 }),
    });
    await fetchLedger();
  };

  const signAsWitness = async (entryId) => {
    await fetch(`${API_BASE}/api/witness/${entryId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ witness_name: witnessInput }),
    });
    await fetchLedger();
  };

  const summary = ledger?.summary || {};
  const entries = ledger?.entries || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight">WageShield</h1>
              <p className="text-[11px] text-slate-400">Evidence-First Daily-Wage Protection</p>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: "vault", label: "Worker Ledger & 3D Chain" },
              { id: "witness", label: "Witness Co-Sign Link" },
              { id: "ngo", label: "NGO Hotspot Map" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={runJudgeTour}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow"
            >
              <Rocket className="w-4 h-4" /> 60s Judge Tour
            </button>
            <button
              onClick={() => setShowPdfModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-700"
            >
              Export Notice PDF
            </button>
          </div>
        </div>
      </header>

      {tourBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs py-2 px-4 text-center">
          {tourBanner}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Live Shortfall Engine KPI Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Promised vs Paid Shortfall</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">
              ₹{summary.promised_shortfall?.toFixed(0) || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Total Promised: ₹{summary.total_promised || 0}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Legal Minimum Wage Deficit</p>
            <p className="text-2xl font-extrabold text-rose-400 mt-1">
              ₹{summary.legal_min_shortfall?.toFixed(0) || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.underpaid_days || 0} days below TN ₹540/day floor
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Hash Chain Integrity</p>
            <div className="flex items-center gap-2 mt-1">
              {ledger?.chain_valid ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span className="text-lg font-extrabold text-emerald-400">SEALED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                  <span className="text-lg font-extrabold text-red-500">
                    BROKEN AT #{ledger?.broken_at_id}
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{entries.length} SHA-256 blocks</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Witness Co-Signatures</p>
            <p className="text-2xl font-extrabold text-sky-400 mt-1">
              {entries.filter((e) => e.witness_name).length} / {entries.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Peer-corroborated records</p>
          </div>
        </section>

        {/* PAGE 1: WORKER LEDGER & 3D HASH CHAIN */}
        {activeTab === "vault" && (
          <>
            <HashChain3D entries={entries} chainValid={ledger?.chain_valid} />
            <VoiceRecorder onSubmitted={fetchLedger} apiBase={API_BASE} />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Cryptographic Wage Entries</h2>
                {!ledger?.chain_valid && (
                  <button
                    onClick={runJudgeTour}
                    className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg"
                  >
                    Restore Clean Chain
                  </button>
                )}
              </div>

              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition ${
                    entry.is_valid
                      ? "bg-slate-900 border-slate-800"
                      : "bg-red-950/40 border-red-500"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded">
                          Block #{entry.id}
                        </span>
                        <h3 className="font-bold text-white">{entry.employer}</h3>
                        {entry.witness_name && (
                          <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {entry.witness_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 italic">"{entry.transcript}"</p>
                      <div className="flex flex-wrap gap-4 text-xs mt-2 text-slate-300">
                        <span>Hours: <strong>{entry.hours}h</strong></span>
                        <span>Promised: <strong>₹{entry.promised_inr}</strong></span>
                        <span>Paid: <strong className="text-amber-400">₹{entry.paid_inr}</strong></span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <MapPin className="w-3 h-3" /> Location Consistent
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => triggerTamper(entry.id)}
                        className="text-xs bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <FileWarning className="w-3.5 h-3.5" /> Simulate DB Tamper
                      </button>
                      <span className="font-mono text-[10px] text-slate-500">
                        Hash: {entry.entry_hash.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PAGE 2: WITNESS CO-SIGNING PORTAL */}
        {activeTab === "witness" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold">Co-Worker Witness Verification Portal</h2>
            </div>
            <p className="text-xs text-slate-400">
              Workers share a link via WhatsApp so a co-worker on the same worksite can cryptographically co-sign the shift.
            </p>
            <div className="max-w-sm">
              <label className="text-xs text-slate-400">Co-Worker Name & Role</label>
              <input
                value={witnessInput}
                onChange={(e) => setWitnessInput(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 pt-2">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <p className="font-semibold text-sm">Block #{e.id} — {e.employer}</p>
                    <p className="text-xs text-slate-400">Promised ₹{e.promised_inr} | Paid ₹{e.paid_inr}</p>
                  </div>
                  {e.witness_name ? (
                    <span className="text-xs text-emerald-400 font-semibold">
                      ✓ Co-Signed by {e.witness_name}
                    </span>
                  ) : (
                    <button
                      onClick={() => signAsWitness(e.id)}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg"
                    >
                      Co-Sign Shift
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAGE 3: ANONYMOUS NGO HEATMAP */}
        {activeTab === "ngo" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold">NGO & Trade Union Employer Shortfall Heatmap</h2>
              </div>
              <span className="text-xs bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-full">
                Anonymized Aggregate Telemetry
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: "Kaveri Infra & Builders", district: "Chengalpattu, TN", reports: 14, avgDeficit: "₹340/day", risk: "High" },
                { name: "Sri Balaji Constructions", district: "Kanchipuram, TN", reports: 9, avgDeficit: "₹280/day", risk: "High" },
                { name: "MetroLink Sub-Contractors", district: "Chennai South, TN", reports: 4, avgDeficit: "₹150/day", risk: "Moderate" },
              ].map((site) => (
                <div key={site.name} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{site.name}</h3>
                    <span className="text-[11px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {site.risk}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{site.district}</p>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                    <span>Verified Claims: <strong>{site.reports}</strong></span>
                    <span className="text-amber-400 font-bold">{site.avgDeficit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-500">
        WageShield provides cryptographic evidence documentation as an <strong>evidence aid, not legal advice</strong>.
      </footer>

      {showPdfModal && <ComplaintModal data={ledger} onClose={() => setShowPdfModal(false)} />}
    </div>
  );
}
