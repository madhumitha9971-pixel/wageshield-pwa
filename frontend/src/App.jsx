import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, ShieldAlert, Rocket, Flame, Wallet, Users,
  PhoneCall, FileWarning, CheckCircle2, Sparkles, ExternalLink, AlertTriangle
} from "lucide-react";
import HashChain3D from "./components/HashChain3D";
import VoiceShield from "./components/VoiceShield";
import ComplaintModal from "./components/ComplaintModal";
import {
  auditLedger, appendEntry, tamperBlock, coSignBlock, seedDemoTour
} from "./utils/cryptoLedger";

export default function App() {
  const [tab, setTab] = useState("vault"); // vault | safety | benefits
  const [audit, setAudit] = useState({ chainValid: true, entries: [], summary: {} });
  const [showPdf, setShowPdf] = useState(false);
  const [witnessName, setWitnessName] = useState("Selvam R. (Co-Worker)");
  const [sosActive, setSosActive] = useState(false);
  const [banner, setBanner] = useState("");

  const refresh = useCallback(async () => {
    const res = await auditLedger();
    setAudit(res);
  }, []);

  useEffect(() => {
    (async () => {
      const current = await auditLedger();
      if (current.entries.length === 0) {
        await seedDemoTour();
      }
      await refresh();
    })();
  }, [refresh]);

  const handleSeedTour = async () => {
    await seedDemoTour();
    await refresh();
    setTab("vault");
    setBanner("60s Tour Ready: 3 blocks sealed. Try 'Simulate DB Tamper' on Block #2 to break the 3D chain!");
  };

  const handleAddEntry = async (data) => {
    await appendEntry(data);
    await refresh();
    setBanner("New voice entry cryptographically sealed into SHA-256 chain!");
  };

  const handleTamper = async (id) => {
    tamperBlock(id, 800);
    await refresh();
    setBanner(`ALERT: Database record #${id} modified! SHA-256 chain integrity broken at Block #${id}.`);
  };

  const handleWitnessSign = async (id) => {
    coSignBlock(id, witnessName);
    await refresh();
    setBanner(`Block #${id} co-signed by ${witnessName}. Cyan witness halo added to 3D block!`);
  };

  const { entries, summary, chainValid, brokenAtId } = audit;

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 font-sans">
      {/* Top Enterprise Header */}
      <header className="border-b border-slate-800/90 bg-[#111C2E]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-cyan-400/15 p-2 rounded-xl border border-cyan-400/40">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-tight text-white">WAGESHIELD</h1>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  WORKER PROTECTED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Work. Earn. Prove. Protect.</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-[#0B1220] p-1 rounded-xl border border-slate-800">
            {[
              { id: "vault", label: "ProofVault & 3D Chain" },
              { id: "safety", label: "HeatShield & SafeWork SOS" },
              { id: "benefits", label: "Income & SocialShield" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tab === item.id
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedTour}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl"
            >
              <Rocket className="w-4 h-4" /> Reset Demo Tour
            </button>
            <button
              onClick={() => setShowPdf(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl"
            >
              Export Demand Notice
            </button>
          </div>
        </div>
      </header>

      {banner && (
        <div className="bg-cyan-500/15 border-b border-cyan-500/30 text-cyan-200 text-xs py-2 px-4 text-center font-medium">
          {banner}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* AI Wage Risk Radar KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111C2E] border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">Total Earnings Logged</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              ₹{summary.totalPaid?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Agreed Total: ₹{summary.totalPromised?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-[#111C2E] border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">Unpaid Wage Discrepancy</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              ₹{summary.promisedShortfall?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Statutory Floor Deficit: ₹{summary.legalMinShortfall || 0}
            </p>
          </div>

          <div className="bg-[#111C2E] border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">ProofVault Chain Status</p>
            <div className="flex items-center gap-2 mt-1">
              {chainValid ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span className="text-lg font-black text-emerald-400">SEALED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                  <span className="text-lg font-black text-rose-500">BROKEN #{brokenAtId}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.witnessCount || 0} of {entries.length} blocks witness-signed
            </p>
          </div>

          <div className="bg-[#111C2E] border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">HeatShield Worksite Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-lg font-black text-orange-400">38°C • HIGH</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">15m shade break due every hour</p>
          </div>
        </section>

        {/* TAB 1: PROOFVAULT 3D + VOICESHIELD + WITNESS */}
        {tab === "vault" && (
          <>
            <HashChain3D entries={entries} />
            <VoiceShield onSealEntry={handleAddEntry} summary={summary} />

            {/* Witness Co-Sign Bar */}
            <div className="bg-[#111C2E] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Co-Worker Witness Signer:</span>
                <input
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  className="bg-[#0B1220] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Co-signing adds a second cryptographic attestation & cyan orbital halo in 3D
              </span>
            </div>

            {/* Cryptographic Ledger Cards */}
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-2xl border transition ${
                    entry.isValid
                      ? "bg-[#111C2E] border-slate-800"
                      : "bg-rose-950/40 border-rose-500"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded text-cyan-400">
                          Block #{entry.id}
                        </span>
                        <h3 className="font-bold text-white">{entry.employer}</h3>
                        {entry.witnessName ? (
                          <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {entry.witnessName}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleWitnessSign(entry.id)}
                            className="text-xs bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 px-2.5 py-0.5 rounded-full font-semibold"
                          >
                            + Co-Sign as Witness
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 italic">"{entry.transcript}"</p>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
                        <span>Shift: <strong>{entry.hours}h</strong></span>
                        <span>Agreed: <strong>₹{entry.promisedInr}</strong></span>
                        <span>Paid: <strong className="text-amber-400">₹{entry.paidInr}</strong></span>
                        <span className="text-rose-400">
                          Shortfall: <strong>₹{entry.promisedShortfall}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleTamper(entry.id)}
                        className="text-xs bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-semibold"
                      >
                        <FileWarning className="w-3.5 h-3.5" /> Simulate DB Tamper
                      </button>
                      <span className="font-mono text-[10px] text-slate-500">
                        SHA-256: {entry.entryHash.slice(0, 22)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: HEATSHIELD & SAFEWORK SOS */}
        {tab === "safety" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#111C2E] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="font-bold text-lg">HeatShield — Outdoor Climate Protection</h2>
              </div>
              <p className="text-xs text-slate-400">
                Protecting Tamil Nadu outdoor construction workers against extreme heat stress and heat-related wage loss.
              </p>
              <div className="bg-[#0B1220] p-4 rounded-xl border border-orange-500/30 space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Chengalpattu / Chennai Zone</span>
                  <span className="text-orange-400">38°C (Feels like 42°C)</span>
                </div>
                <p className="text-xs text-slate-300">
                  • Mandatory 15-minute shaded hydration rest every 60 minutes between 12:00 PM – 3:30 PM.
                </p>
                <p className="text-xs text-emerald-400">
                  • Nearest Public Cooling & Water Point: Amma Unavagam & Primary Health Centre (450m).
                </p>
              </div>
            </div>

            <div className="bg-[#111C2E] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-400" />
                <h2 className="font-bold text-lg">SafeWork SOS & Incident Vault</h2>
              </div>
              <p className="text-xs text-slate-400">
                One-tap GPS emergency broadcast to trusted family contacts and state labour helpline (155214).
              </p>
              <button
                onClick={() => setSosActive(!sosActive)}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition ${
                  sosActive
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50"
                }`}
              >
                {sosActive
                  ? "SOS ACTIVE — GPS & AUDIO EVIDENCE SHARED WITH FAMILY & UNION"
                  : "TRIGGER SAFEWORK EMERGENCY SOS"}
              </button>
              {sosActive && (
                <div className="text-xs bg-rose-950/50 border border-rose-500/40 p-3 rounded-xl text-rose-200">
                  Live Coordinates 12.6096° N, 80.0561° E locked. Incident timestamped in ProofVault.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INCOMESHIELD & SOCIALSHIELD */}
        {tab === "benefits" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#111C2E] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-lg">IncomeShield — Volatility & Buffer Planner</h2>
              </div>
              <div className="bg-[#0B1220] p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recommended 14-Day Emergency Buffer</span>
                  <span className="font-bold text-emerald-400">₹7,560</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Recoverable Unpaid Claims</span>
                  <span className="font-bold text-amber-400">₹{summary.promisedShortfall || 0}</span>
                </div>
                <p className="text-slate-400 pt-2">
                  Recovering your documented unpaid wages covers{" "}
                  <strong className="text-white">
                    {Math.min(100, Math.round(((summary.promisedShortfall || 0) / 7560) * 100))}%
                  </strong>{" "}
                  of your two-week family safety net.
                </p>
              </div>
            </div>

            <div className="bg-[#111C2E] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-lg">SocialShield — Official Welfare Navigator</h2>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  {
                    title: "e-Shram National Unorganised Worker Card",
                    desc: "₹2 Lakh accidental insurance + portable social security across states.",
                    url: "https://eshram.gov.in/",
                  },
                  {
                    title: "TN Construction Workers Welfare Board (TNCWWB)",
                    desc: "Education, maternity, pension & tool-kit assistance for registered workers.",
                    url: "https://labour.tn.gov.in/",
                  },
                ].map((scheme) => (
                  <div
                    key={scheme.title}
                    className="bg-[#0B1220] border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-bold text-white">{scheme.title}</h3>
                      <p className="text-slate-400 mt-0.5">{scheme.desc}</p>
                    </div>
                    <a
                      href={scheme.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold shrink-0"
                    >
                      Apply <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-500">
        WageShield provides cryptographic evidence documentation as an{" "}
        <strong>evidence aid, not legal advice</strong>.
      </footer>

      {showPdf && <ComplaintModal audit={audit} onClose={() => setShowPdf(false)} />}
    </div>
  );
}
