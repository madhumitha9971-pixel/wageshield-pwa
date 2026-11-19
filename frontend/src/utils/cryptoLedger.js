const STORAGE_KEY = "wageshield_v2_ledger";
export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export const STATE_MIN_WAGES = {
  "Tamil Nadu": { unskilled: 540, skilled: 720, code: "TN G.O. (2D) No. 14" },
  "Maharashtra": { unskilled: 510, skilled: 680, code: "MH Min Wages Act" },
  "Karnataka": { unskilled: 565, skilled: 710, code: "KA Labour Dept" },
  "Delhi": { unskilled: 692, skilled: 848, code: "NCT Delhi Floor" },
};

export async function computeSHA256(prevHash, payload) {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const raw = new TextEncoder().encode(`${prevHash}|${canonical}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", raw);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildSealPayload(entry) {
  return {
    timestamp: entry.timestamp,
    workerName: entry.workerName,
    employer: entry.employer,
    state: entry.state,
    skillLevel: entry.skillLevel,
    hours: Number(entry.hours),
    promisedInr: Number(entry.promisedInr),
    paidInr: Number(entry.paidInr),
    gps: entry.gps,
    transcript: entry.transcript,
  };
}

export function loadRawEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveRawEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function appendEntry(data) {
  const existing = loadRawEntries();
  const prevHash = existing.length > 0 ? existing[existing.length - 1].entryHash : GENESIS_HASH;
  const entry = {
    id: existing.length + 1,
    timestamp: data.timestamp || new Date().toISOString(),
    workerName: data.workerName || "Murugan K.",
    employer: data.employer || "Kaveri Infra & Builders",
    state: data.state || "Tamil Nadu",
    skillLevel: data.skillLevel || "unskilled",
    hours: Number(data.hours || 9),
    promisedInr: Number(data.promisedInr || 750),
    paidInr: Number(data.paidInr ?? 400),
    gps: data.gps || "12.6096° N, 80.0561° E • Location Consistent",
    transcript: data.transcript || "",
    witnessName: data.witnessName || null,
    witnessSignedAt: data.witnessSignedAt || null,
    prevHash,
  };
  entry.entryHash = await computeSHA256(prevHash, buildSealPayload(entry));
  const updated = [...existing, entry];
  saveRawEntries(updated);
  return updated;
}

export async function auditLedger() {
  const rows = loadRawEntries();
  let expectedPrev = GENESIS_HASH;
  let chainValid = true;
  let brokenAtId = null;

  let totalPromised = 0;
  let totalPaid = 0;
  let legalMinShortfall = 0;
  let underpaidDays = 0;

  const verified = [];
  for (const row of rows) {
    const recomputed = await computeSHA256(expectedPrev, buildSealPayload(row));
    const blockOk = row.prevHash === expectedPrev && row.entryHash === recomputed;
    if (!blockOk && chainValid) {
      chainValid = false;
      brokenAtId = row.id;
    }

    const rates = STATE_MIN_WAGES[row.state] || STATE_MIN_WAGES["Tamil Nadu"];
    const floor = row.skillLevel === "skilled" ? rates.skilled : rates.unskilled;
    const legalDeficit = Math.max(0, floor - Number(row.paidInr));

    totalPromised += Number(row.promisedInr);
    totalPaid += Number(row.paidInr);
    legalMinShortfall += legalDeficit;
    if (Number(row.paidInr) < floor) underpaidDays += 1;

    verified.push({
      ...row,
      isValid: blockOk && chainValid,
      legalFloor: floor,
      promisedShortfall: Math.max(0, Number(row.promisedInr) - Number(row.paidInr)),
      legalDeficit,
    });

    expectedPrev = row.entryHash;
  }

  return {
    chainValid,
    brokenAtId,
    entries: verified,
    summary: {
      totalPromised,
      totalPaid,
      promisedShortfall: Math.max(0, totalPromised - totalPaid),
      legalMinShortfall,
      underpaidDays,
      witnessCount: verified.filter((e) => e.witnessName).length,
    },
  };
}

export function tamperBlock(id, tamperedPaidInr) {
  const rows = loadRawEntries().map((r) =>
    r.id === id ? { ...r, paidInr: Number(tamperedPaidInr) } : r
  );
  saveRawEntries(rows);
}

export function coSignBlock(id, witnessName) {
  const rows = loadRawEntries().map((r) =>
    r.id === id
      ? { ...r, witnessName, witnessSignedAt: new Date().toISOString() }
      : r
  );
  saveRawEntries(rows);
}

export function parseVoiceTranscript(text) {
  const nums = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  // Heuristic: hours usually <= 16, wages >= 100
  const hours = nums.find((n) => n > 0 && n <= 16) || 9;
  const money = nums.filter((n) => n >= 50);
  const promisedInr = money[0] || 800;
  const paidInr = money.length > 1 ? money[1] : 0;

  let employer = "Sri Balaji Constructions";
  if (/kaveri|காவேரி/i.test(text)) employer = "Kaveri Infra & Builders";
  else if (/sharma|शर्मा/i.test(text)) employer = "Sharma Civil Contractors";
  else if (/metro|மெட்ரோ/i.test(text)) employer = "MetroLink Sub-Contractors";

  return { employer, hours, promisedInr, paidInr, transcript: text };
}

export async function seedDemoTour() {
  localStorage.removeItem(STORAGE_KEY);
  await appendEntry({
    employer: "Kaveri Infra & Builders",
    hours: 9,
    promisedInr: 800,
    paidInr: 450,
    transcript: "காவேரி பில்டர்ஸ் சைட்டில் 9 மணி நேரம் வேலை. 800 ரூபாய் பேசினார்கள், 450 தான் கொடுத்தார்கள்.",
    witnessName: "Selvam R. (Co-Worker)",
    witnessSignedAt: new Date().toISOString(),
  });
  await appendEntry({
    employer: "Kaveri Infra & Builders",
    hours: 10,
    promisedInr: 800,
    paidInr: 0,
    transcript: "இன்று 10 மணி நேரம் சென்டரிங் வேலை, சம்பளம் நாளை தருகிறேன் என்று சொல்லிவிட்டார்கள்.",
  });
  await appendEntry({
    employer: "Kaveri Infra & Builders",
    hours: 8,
    promisedInr: 800,
    paidInr: 500,
    transcript: "8 hours centering work at OMR site. Promised 800, paid only 500 cash.",
    witnessName: "Karthik S. (Site Mason)",
    witnessSignedAt: new Date().toISOString(),
  });
}
