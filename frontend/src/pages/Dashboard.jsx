import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ─── Mock fallback for dev without backend ────────────────────────────────────
const MOCK = {
  total_score_kg_co2e: 3140,
  global_label: "Average",
  categories: {
    transport: { score_kg_co2e: 1420, label: "Moderate" },
    diet:      { score_kg_co2e: 1090, label: "High"     },
    energy:    { score_kg_co2e: 630,  label: "Moderate" },
  },
  suggestions: [
    "Switch to Metro or bus for daily commute — public transit cuts transport emissions by up to 70%.",
    "Replacing 4 meat meals/week with dal, paneer, or tofu saves 500+ kg CO₂e per year.",
    "Apply for PM Surya Ghar Yojana — free rooftop solar that offsets most home electricity emissions.",
  ],
  comparison: { india_avg_kg: 2200, global_avg_kg: 4700, your_score_kg: 3140 },
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_CONFIG = {
  transport: { label: "Transport", color: "#38bdf8", emoji: "🚗" },
  diet:      { label: "Diet",      color: "#fb923c", emoji: "🍱" },
  energy:    { label: "Energy",    color: "#facc15", emoji: "⚡" },
};

const LABEL_STYLE = {
  Low:          { text: "text-emerald-400",  bg: "bg-emerald-500/10",  border: "border-emerald-500/30"  },
  Moderate:     { text: "text-sky-400",      bg: "bg-sky-500/10",      border: "border-sky-500/30"      },
  High:         { text: "text-orange-400",   bg: "bg-orange-500/10",   border: "border-orange-500/30"   },
  "Very High":  { text: "text-red-400",      bg: "bg-red-500/10",      border: "border-red-500/30"      },
  Excellent:    { text: "text-emerald-400",  bg: "bg-emerald-500/10",  border: "border-emerald-500/30"  },
  "Below Average": { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Average:      { text: "text-sky-400",      bg: "bg-sky-500/10",      border: "border-sky-500/30"      },
  "Above Average": { text: "text-orange-400", bg: "bg-orange-500/10",  border: "border-orange-500/30"   },
  "High Impact":{ text: "text-red-400",      bg: "bg-red-500/10",      border: "border-red-500/30"      },
};

// ─── Tailwind helper ──────────────────────────────────────────────────────────
function LabelPill({ label }) {
  const s = LABEL_STYLE[label] ?? LABEL_STYLE.Average;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.text} ${s.bg} ${s.border}`}>
      {label}
    </span>
  );
}

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────
function DarkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl text-xs text-zinc-300">
      <p className="font-semibold text-zinc-100">{payload[0].payload.name}</p>
      <p className="mt-0.5">{payload[0].value.toLocaleString()} <span className="text-zinc-500">kg CO₂e</span></p>
    </div>
  );
}

function CompTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl text-xs text-zinc-300">
      <p className="font-semibold text-zinc-100">{payload[0].payload.name}</p>
      <p className="mt-0.5">{(payload[0].value / 1000).toFixed(2)} <span className="text-zinc-500">T CO₂e/yr</span></p>
    </div>
  );
}

// ─── Radial score ring (SVG) ──────────────────────────────────────────────────
function ScoreRing({ score, label }) {
  const MAX  = 10000;
  const pct  = Math.min(score / MAX, 1);
  const R    = 64;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * pct;
  const ringColor =
    pct < 0.22 ? "#34d399" :
    pct < 0.47 ? "#38bdf8" :
    pct < 0.70 ? "#fb923c" : "#f87171";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Track */}
        <circle cx="80" cy="80" r={R} fill="none" stroke="#27272a" strokeWidth="12" />
        {/* Fill */}
        <circle
          cx="80" cy="80" r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth="12"
          strokeDasharray={`${dash} ${CIRC}`}
          strokeDashoffset={CIRC / 4}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${ringColor}80)`, transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x="80" y="73" textAnchor="middle" fill="#f4f4f5" fontSize="20" fontWeight="700" fontFamily="system-ui">
          {(score / 1000).toFixed(2)}T
        </text>
        <text x="80" y="94" textAnchor="middle" fill="#71717a" fontSize="9.5" fontFamily="system-ui">
          kg CO₂e / year
        </text>
      </svg>
      <LabelPill label={label} />
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 ${className}`}>
      {title && (
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5">{title}</h3>
      )}
      {children}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const result   = location.state?.result ?? MOCK;

  const { total_score_kg_co2e, global_label, categories, suggestions, comparison } = result;

  // Recharts data — Category breakdown
  const categoryData = Object.entries(categories).map(([key, val]) => ({
    name:  CAT_CONFIG[key]?.label ?? key,
    value: val.score_kg_co2e,
    color: CAT_CONFIG[key]?.color ?? "#a1a1aa",
    label: val.label,
  }));

  // Recharts data — Comparison (use india_avg_kg if present, fallback graceful)
  const indiaAvg = comparison.india_avg_kg ?? 2200;
  const compData = [
    { name: "India Avg",  value: indiaAvg,                    color: "#34d399" },
    { name: "You",        value: comparison.your_score_kg,    color: "#38bdf8" },
    { name: "Global Avg", value: comparison.global_avg_kg,    color: "#a78bfa" },
  ];

  // Category totals for % bars
  const totalCat = categoryData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
              <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4"/>
              <path d="M16 3c1 2.5.5 5-1 7"/>
            </svg>
            Carbonly
          </div>
          <button
            onClick={() => navigate("/quiz")}
            className="text-xs px-4 py-1.5 rounded-full border border-zinc-700 text-zinc-400
                       hover:border-emerald-600/50 hover:text-emerald-400 transition-all"
          >
            Retake Quiz
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-10 pb-20 flex flex-col gap-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Your Carbon Report</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Annual estimated footprint — calibrated for India.</p>
        </div>

        {/* Hero row: score ring + benchmark stats */}
        <Card className="flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={total_score_kg_co2e} label={global_label} />
          <div className="flex-1 w-full">
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Your footprint compared to Indian and global benchmarks.
            </p>
            {[
              { label: "India national avg", kg: indiaAvg, color: "bg-emerald-400" },
              { label: "Global avg",         kg: 4700,     color: "bg-violet-400"  },
              { label: "Your score",         kg: total_score_kg_co2e, color: "bg-sky-400" },
            ].map((row) => {
              const pct = Math.min((row.kg / 10000) * 100, 100);
              return (
                <div key={row.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">{row.label}</span>
                    <span className="text-zinc-300 font-medium tabular-nums">
                      {(row.kg / 1000).toFixed(2)}T
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${row.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Two charts side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category breakdown bar chart */}
          <Card title="Breakdown by Category">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} barCategoryGap="30%" margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}T`}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) => `${(v / 1000).toFixed(2)}T`}
                    style={{ fill: "#71717a", fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Comparison bar chart */}
          <Card title="How You Compare">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compData} barCategoryGap="30%" margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}T`}
                />
                <Tooltip content={<CompTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {compData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) => `${(v / 1000).toFixed(2)}T`}
                    style={{ fill: "#71717a", fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Category detail cards */}
        <Card title="Category Detail">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(categories).map(([key, val]) => {
              const cfg  = CAT_CONFIG[key] ?? { label: key, color: "#a1a1aa", emoji: "•" };
              const pct  = totalCat > 0 ? (val.score_kg_co2e / totalCat) * 100 : 0;
              return (
                <div key={key} className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{cfg.emoji}</span>
                    <LabelPill label={val.label} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">{cfg.label}</p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: cfg.color }}>
                      {(val.score_kg_co2e / 1000).toFixed(2)}
                      <span className="text-sm font-normal text-zinc-500 ml-1">T CO₂e</span>
                    </p>
                  </div>
                  {/* Mini % bar */}
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600">{pct.toFixed(0)}% of your total</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Suggestions */}
        <Card title="🌱 Recommendations">
          <div className="flex flex-col gap-3">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-zinc-950/50 border border-zinc-800/50 rounded-xl px-4 py-3.5"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/25
                                 text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-400 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Retake CTA */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => navigate("/quiz")}
            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            Recalculate with new data
          </button>
        </div>
      </main>
    </div>
  );
}