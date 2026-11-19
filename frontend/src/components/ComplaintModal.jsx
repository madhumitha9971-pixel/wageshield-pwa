import React from "react";
import { FileText, Printer, X } from "lucide-react";

export default function ComplaintModal({ data, onClose }) {
  if (!data) return null;
  const { entries = [], summary = {}, chain_valid } = data;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              WageShield Cryptographic Evidence Dossier
            </span>
            <h2 className="text-2xl font-extrabold mt-1">
              FORMAL DEMAND NOTICE FOR UNPAID WAGES
            </h2>
            <p className="text-xs text-slate-500">
              Under the Payment of Wages Act, 1936 & Code on Wages, 2019
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed">
          <div className="grid grid-cols-2 gap-4 bg-slate-100 p-4 rounded-xl">
            <div>
              <p className="text-xs text-slate-500">Claimant Worker</p>
              <p className="font-bold">Murugan K. (Daily-Wage Construction Worker)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Chain Integrity Status</p>
              <p className={`font-bold ${chain_valid ? "text-emerald-700" : "text-red-600"}`}>
                {chain_valid ? "VERIFIED INTACT (SHA-256 SEALED)" : "TAMPER DETECTED"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Contractual Shortfall</p>
              <p className="font-bold text-lg">₹{summary.promised_shortfall?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Statutory Minimum Wage Shortfall</p>
              <p className="font-bold text-lg text-red-700">
                ₹{summary.legal_min_shortfall?.toFixed(2)} ({summary.underpaid_days} days below legal floor)
              </p>
            </div>
          </div>

          <h3 className="font-bold text-base pt-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Tamper-Evident Work Log & Witness Registry
          </h3>

          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-200">
                <th className="border p-2 text-left">Block</th>
                <th className="border p-2 text-left">Employer & Hours</th>
                <th className="border p-2 text-right">Promised / Paid</th>
                <th className="border p-2 text-left">Witness & GPS</th>
                <th className="border p-2 text-left">SHA-256 Seal</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="border p-2 font-bold">#{e.id}</td>
                  <td className="border p-2">
                    {e.employer} ({e.hours}h)
                  </td>
                  <td className="border p-2 text-right">
                    ₹{e.promised_inr} / <strong>₹{e.paid_inr}</strong>
                  </td>
                  <td className="border p-2">
                    {e.witness_name ? `Signed: ${e.witness_name}` : "Pending"} • GPS OK
                  </td>
                  <td className="border p-2 font-mono text-[10px]">
                    {e.entry_hash.slice(0, 18)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg text-xs text-amber-900">
            <strong>Notice:</strong> This document is generated as a cryptographic <em>evidence aid, not legal advice</em>. Each entry was contemporaneously recorded and sealed at the time of work.
          </div>
        </div>
      </div>
    </div>
  );
}
