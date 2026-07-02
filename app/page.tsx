"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types matching the API contract ────────────────────────────────────────

interface Case {
  case_id: string;
  pattern: string;
}

interface Cluster {
  root_cause: string;
  fps_location: string;
  beneficiaries_affected: number;
  confidence: "high" | "medium" | "low";
  cases: Case[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// The deployed event store currently holds seeded synthetic events, not real
// citizen diagnoses. Say so on-screen — judges/officials must never mistake
// simulation for field data. Set NEXT_PUBLIC_DATA_BADGE=off once real events
// accumulate on persistent storage.
const SHOW_SIMULATED_BADGE = process.env.NEXT_PUBLIC_DATA_BADGE !== "off";

const ROOT_CAUSE_LABELS: Record<string, string> = {
  no_issues: "Documents Consistent",
  name_mismatch: "Name Mismatch",
  dob_mismatch: "DOB Mismatch",
  seeding_gap: "Aadhaar Seeding Gap",
  ekyc_incomplete: "e-KYC Incomplete",
  biometric_failure: "Biometric Failure",
  unknown: "Unknown",
};

const ROOT_CAUSE_DESCRIPTIONS: Record<string, string> = {
  no_issues: "No document mismatch detected — not a systemic defect.",
  name_mismatch:
    "Name spelled differently across Aadhaar vs ration card — the flagship case.",
  dob_mismatch: "Date of birth differs across the two documents.",
  seeding_gap: "Aadhaar not seeded / linked to the ration card.",
  ekyc_incomplete: "e-KYC not completed — entitlement held.",
  biometric_failure: "Repeated fingerprint / iris auth failure.",
  unknown: "Pattern does not match any known defect — flagged for manual review.",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  medium: "bg-amber-100 text-amber-800 ring-amber-300",
  low: "bg-red-100 text-red-800 ring-red-300",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterConf, setFilterConf] = useState<string>("all");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The backend defaults to min_confidence=medium, so "All" must be sent
      // explicitly as "low" (low-and-above = everything).
      const params =
        filterConf === "all"
          ? "?min_confidence=low"
          : `?min_confidence=${filterConf}`;
      const res = await fetch(`${API_BASE}/clusters${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data: Cluster[] = await res.json();
      setClusters(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch clusters");
      setClusters([]);
    } finally {
      setLoading(false);
    }
  }, [filterConf]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const totalBeneficiaries = clusters.reduce(
    (sum, c) => sum + c.beneficiaries_affected,
    0,
  );

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Mou — Officials Dashboard
            </h1>
            <p className="text-sm text-zinc-500">
              Systemic defect clusters ranked by beneficiaries affected
            </p>
          </div>
          <div className="flex items-center gap-2">
            {SHOW_SIMULATED_BADGE && (
              <span
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200"
                title="Clusters below are seeded from a synthetic pilot simulation, not live citizen diagnoses."
              >
                Simulated pilot data
              </span>
            )}
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
              {loading ? "…" : `${clusters.length} cluster${clusters.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Summary bar */}
        {!loading && !error && clusters.length > 0 && (
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">
              {totalBeneficiaries}
            </span>{" "}
            total beneficiaries affected across{" "}
            <span className="font-semibold text-zinc-900">
              {clusters.length}
            </span>{" "}
            cluster{clusters.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-600">
            Min confidence:
          </label>
          <select
            value={filterConf}
            onChange={(e) => {
              setFilterConf(e.target.value);
              setExpandedIdx(null);
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All</option>
            <option value="high">High only</option>
            <option value="medium">Medium & above</option>
            <option value="low">Low & above</option>
          </select>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">{error}</p>
            <p className="mt-2 text-sm text-red-600">
              Make sure the backend is running at{" "}
              <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-sm">
                {API_BASE}
              </code>
            </p>
            <button
              onClick={fetchClusters}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && clusters.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
            <p className="text-zinc-400">No clusters available.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Seed some data via{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">
                python backend/seed.py
              </code>
            </p>
          </div>
        )}

        {/* Cluster list */}
        {!loading && !error && clusters.length > 0 && (
          <div className="space-y-3">
            {clusters.map((cluster, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <div
                  key={`${cluster.root_cause}-${cluster.fps_location}-${idx}`}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Cluster header — clickable */}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    {/* Rank */}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                      {idx + 1}
                    </span>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-zinc-900">
                          {ROOT_CAUSE_LABELS[cluster.root_cause] ??
                            cluster.root_cause}
                        </span>
                        <span className="truncate text-sm text-zinc-500">
                          {cluster.fps_location}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {ROOT_CAUSE_DESCRIPTIONS[cluster.root_cause] ?? ""}
                      </p>
                    </div>

                    {/* Count */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-zinc-800">
                        {cluster.beneficiaries_affected}
                      </div>
                      <div className="text-xs text-zinc-400">
                        beneficiar
                        {cluster.beneficiaries_affected !== 1 ? "ies" : "y"}
                      </div>
                    </div>

                    {/* Confidence badge */}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CONFIDENCE_COLORS[cluster.confidence]}`}
                    >
                      {cluster.confidence}
                    </span>

                    {/* Expand icon */}
                    <svg
                      className={`h-4 w-4 shrink-0 text-zinc-400 transition ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded cases */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100">
                      {cluster.cases.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-zinc-400">
                          No case details available.
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                              <th className="px-4 py-3 pl-10">Case ID</th>
                              <th className="px-4 py-3">Pattern</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cluster.cases.map((c) => (
                              <tr
                                key={c.case_id}
                                className="border-b border-zinc-50 text-zinc-700 last:border-0"
                              >
                                <td className="px-4 py-2.5 pl-10 font-mono text-xs text-zinc-500">
                                  {c.case_id}
                                </td>
                                <td className="px-4 py-2.5 text-sm">
                                  {c.pattern || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
