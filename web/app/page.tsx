"use client";

import { useMemo, useState } from "react";
import {
  buildAnalysis,
  generateTicket,
  NumberStat,
  ScoringWeights,
} from "@/lib/analysis";
import { mulberry32 } from "@/lib/prng";

type SliderKey = keyof ScoringWeights;

const SLIDERS: { key: SliderKey; label: string; description: string }[] = [
  {
    key: "frequency",
    label: "Historische Häufigkeit",
    description: "Bevorzugt Zahlen, die über die gesamte Historie oft getroffen haben.",
  },
  {
    key: "momentum",
    label: "Kurzfristiger Trend",
    description: "Gewichtet Treffer in den letzten Wochen besonders hoch.",
  },
  {
    key: "overdue",
    label: "Überfälligkeitsdruck",
    description:
      "Push für Zahlen, die länger pausiert haben als ihr Durchschnitt.",
  },
  {
    key: "randomness",
    label: "Varianz-Booster",
    description: "Erhöht die Abwechslung zwischen mehreren Tickets.",
  },
];

const DEFAULT_WEIGHTS: ScoringWeights = {
  frequency: 0.5,
  momentum: 0.25,
  overdue: 0.2,
  randomness: 0.05,
};

export default function Home() {
  const analysis = useMemo(() => buildAnalysis(), []);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [seed, setSeed] = useState(() => Math.floor(Date.now() % 100000));

  const ticket = useMemo(() => {
    const rng = mulberry32(seed);
    return generateTicket(analysis.mainStats, analysis.euroStats, weights, rng);
  }, [analysis.mainStats, analysis.euroStats, weights, seed]);

  const hotMain = useMemo(
    () => [...analysis.mainStats].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 10),
    [analysis.mainStats]
  );

  const coldMain = useMemo(
    () => [...analysis.mainStats].sort((a, b) => a.hits - b.hits).slice(0, 10),
    [analysis.mainStats]
  );

  const overdueMain = useMemo(
    () =>
      [...analysis.mainStats]
        .sort(
          (a, b) =>
            b.overdueWeight + b.lastSeenDrawsAgo * 0.01 -
            (a.overdueWeight + a.lastSeenDrawsAgo * 0.01)
        )
        .slice(0, 10),
    [analysis.mainStats]
  );

  const hotEuro = useMemo(
    () => [...analysis.euroStats].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 6),
    [analysis.euroStats]
  );

  const coldEuro = useMemo(
    () => [...analysis.euroStats].sort((a, b) => a.hits - b.hits).slice(0, 6),
    [analysis.euroStats]
  );

  const drawSummary = analysis.distribution;

  const handleSliderChange = (key: SliderKey, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetWeights = () => setWeights(DEFAULT_WEIGHTS);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-40 blur-3xl" />
        <header className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-20 sm:px-8 lg:pt-28">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-200">
                EuroJackpot Pro Analyse
              </span>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Deine Agentur für{" "}
                <span className="text-emerald-300">statistische Jackpot-Strategien</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">
                200+ historisch simulierte Ziehungen, verdichtete Frequenzen und ein
                intelligenter Builder für dein nächstes Ticket. Balanciere Hot-Streaks,
                Überfälligkeiten und Varianz wie ein Profi.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-400/30 bg-slate-900/40 p-6">
              <p className="text-sm uppercase tracking-wide text-emerald-300/80">
                Aktuell beste Gewichtung
              </p>
              <div className="mt-3 text-4xl font-semibold text-emerald-100">
                {ticket.main.join(" - ")}{" "}
                <span className="text-emerald-400">/</span>{" "}
                {ticket.euro.join(" - ")}
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-400">
                Optimiert mit {weights.frequency.toFixed(2)} Gewicht auf Langzeit-Häufigkeit
                und {weights.momentum.toFixed(2)} Momentum-Fokus.
              </p>
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 sm:px-8">
        <section>
          <h2 className="text-2xl font-semibold text-emerald-200">Historische Kerndaten</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Ausgewertete Ziehungen"
              value={drawSummary.totalDraws.toString()}
              hint="Simulation ab März 2022 mit zwei Ziehungen pro Woche."
            />
            <SummaryCard
              label="Ø Hauptzahlen-Summe"
              value={drawSummary.averageMainSum.toFixed(1)}
              hint="Richte deine Summenspanne auf 120 - 190 aus."
            />
            <SummaryCard
              label="Ø gerade Hauptzahlen"
              value={drawSummary.averageMainEven.toFixed(2)}
              hint="Balance von 2 bis 3 geraden Zahlen pro Tipp."
            />
            <SummaryCard
              label="Ø niedrige Eurozahlen"
              value={drawSummary.averageEuroLow.toFixed(2)}
              hint="Mindestens eine Eurozahl aus dem unteren Bereich 1-6."
            />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-200">Empfohlene Tickets</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Drei sofort spielbare Kombinationen – fein abgestimmt auf Hit-Raten,
              Überfälligkeiten und ausgewogene Verteilung.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {analysis.recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-emerald-200">Hot-Fingerprints</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <p>
                <strong>Momentum:</strong> Heiße Zahlen treffen aktuell in{" "}
                {(hotMain.slice(0, 5).reduce((sum, stat) => sum + stat.recentHits, 0) /
                  drawSummary.recentWindow
                ).toFixed(2)}{" "}
                der letzten Ziehungen.
              </p>
              <p>
                <strong>Überfälligkeitsdruck:</strong> Die Top-Überfälligen warten seit{" "}
                {overdueMain[0]?.lastSeenDrawsAgo ?? 0} Ziehungen auf ein Comeback.
              </p>
              <p>
                <strong>Euro-Zahlen:</strong> {hotEuro[0]?.value} und {hotEuro[1]?.value} dominieren
                die letzten Wochen mit {hotEuro[0]?.recentHits ?? 0} bzw.{" "}
                {hotEuro[1]?.recentHits ?? 0} Treffern.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-2">
          <NumberPanel
            title="Heißeste Hauptzahlen"
            subtitle="Höchste Gesamtperformance"
            stats={hotMain}
            accent="hot"
          />
          <NumberPanel
            title="Überfällige Hauptzahlen"
            subtitle="Längster Abstand zur letzten Ziehung"
            stats={overdueMain}
            accent="overdue"
          />
        </section>

        <section className="grid gap-12 lg:grid-cols-2">
          <NumberPanel
            title="Kalte Hauptzahlen"
            subtitle="Seltenste Treffer – nur als Mix verwenden"
            stats={coldMain}
            accent="cold"
          />
          <EuroPanel hot={hotEuro} cold={coldEuro} />
        </section>

        <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-200">
                Persönlicher Strategiebuilder
              </h2>
              <p className="text-sm text-emerald-100/70">
                Ziehe die Regler und erzeuge Tickets on-demand. Jeder Klick nutzt einen neuen Seed.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetWeights}
                className="rounded-full border border-emerald-400/60 bg-transparent px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10"
              >
                Reset
              </button>
              <button
                onClick={() => setSeed((prev) => prev + 1)}
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
              >
                Ticket regenerieren
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {SLIDERS.map((slider) => (
                <div key={slider.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-100">
                        {slider.label}
                      </p>
                      <p className="text-xs text-emerald-100/70">{slider.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-200">
                      {weights[slider.key].toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={weights[slider.key]}
                    onChange={(event) =>
                      handleSliderChange(slider.key, parseFloat(event.target.value))
                    }
                    className="w-full accent-emerald-400"
                  />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-400/40 bg-slate-950/40 p-6">
              <h3 className="text-lg font-semibold text-emerald-100">Aktueller Tipp</h3>
              <div className="mt-4 space-y-3">
                <NumberLine label="Hauptzahlen" numbers={ticket.main} variant="main" />
                <NumberLine label="Eurozahlen" numbers={ticket.euro} variant="euro" />
              </div>
              <p className="mt-4 text-xs text-emerald-100/70">
                Seed #{seed} • Passe die Gewichte für alternative Profile an (z. B. 0.35/0.35/0.25
                für aggressives Momentum).
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-emerald-200">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: { id: string; title: string; description: string; main: number[]; euro: number[] } }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-5">
      <div>
        <h3 className="text-lg font-semibold text-emerald-200">{recommendation.title}</h3>
        <p className="mt-1 text-xs text-slate-400">{recommendation.description}</p>
      </div>
      <div className="space-y-3 text-sm">
        <NumberLine label="Hauptzahlen" numbers={recommendation.main} variant="main" />
        <NumberLine label="Eurozahlen" numbers={recommendation.euro} variant="euro" />
      </div>
    </div>
  );
}

function NumberLine({
  label,
  numbers,
  variant,
}: {
  label: string;
  numbers: number[];
  variant: "main" | "euro";
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {numbers.map((number) => (
          <span
            key={`${label}-${number}`}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
              variant === "main"
                ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/50"
                : "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/60"
            }`}
          >
            {number.toString().padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}

function NumberPanel({
  title,
  subtitle,
  stats,
  accent,
}: {
  title: string;
  subtitle: string;
  stats: NumberStat[];
  accent: "hot" | "cold" | "overdue";
}) {
  const accentClasses =
    accent === "hot"
      ? "border-emerald-500/50 bg-emerald-500/5"
      : accent === "overdue"
        ? "border-amber-400/40 bg-amber-500/5"
        : "border-cyan-400/30 bg-cyan-500/5";

  return (
    <div className={`rounded-3xl border ${accentClasses} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-emerald-100">{title}</h3>
          <p className="text-xs uppercase tracking-wide text-slate-400">{subtitle}</p>
        </div>
        <span className="text-xs text-slate-400">
          Ø Trefferquote{" "}
          {(stats.reduce((sum, stat) => sum + stat.hitRate, 0) / stats.length * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {stats.map((stat) => (
          <div
            key={`${title}-${stat.value}`}
            className="flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-emerald-200">
                {stat.value.toString().padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Hit-Rate {(stat.hitRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">
                  Zuletzt vor {stat.lastSeenDrawsAgo} Ziehungen • längste Lücke {stat.longestGap}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-200">
              Momentum {(stat.recentWeight * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EuroPanel({ hot, cold }: { hot: NumberStat[]; cold: NumberStat[] }) {
  return (
    <div className="rounded-3xl border border-cyan-400/40 bg-cyan-500/5 p-6">
      <h3 className="text-xl font-semibold text-cyan-100">Eurozahlen Radar</h3>
      <p className="text-xs uppercase tracking-wide text-cyan-200/70">
        Trends auf den Sternzahlen (1 - 12)
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-cyan-100">Heiße Sterne</p>
          <div className="mt-3 space-y-3">
            {hot.map((stat) => (
              <MiniStat key={`hot-euro-${stat.value}`} stat={stat} tone="hot" />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-cyan-100">Coole Sterne</p>
          <div className="mt-3 space-y-3">
            {cold.map((stat) => (
              <MiniStat key={`cold-euro-${stat.value}`} stat={stat} tone="cold" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ stat, tone }: { stat: NumberStat; tone: "hot" | "cold" }) {
  const badgeClass =
    tone === "hot"
      ? "bg-cyan-400/20 text-cyan-100 ring-cyan-400/60"
      : "bg-slate-900/60 text-slate-200 ring-slate-600/50";

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ring-1 ${badgeClass}`}
        >
          {stat.value.toString().padStart(2, "0")}
        </span>
        <div>
          <p className="text-xs text-slate-400">
            Hit {(stat.hitRate * 100).toFixed(1)}% • Momentum {(stat.recentWeight * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      <span className="text-xs text-slate-500">Gap {stat.lastSeenDrawsAgo}</span>
    </div>
  );
}
