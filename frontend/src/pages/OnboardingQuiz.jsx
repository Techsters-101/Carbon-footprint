import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Initial state ────────────────────────────────────────────────────────────
const INITIAL = {
  transport_car_km_per_week:      "",
  transport_train_km_per_month:   "",
  transport_flights_per_year:     "",
  diet_meat_meals_per_week:       "",
  diet_delivery_orders_per_month: "",
  energy_bill_inr_per_month:      "",
  energy_devices_hours_per_day:   "",
};

const STEPS = [
  { id: "transport", label: "Transport",        emoji: "🚗" },
  { id: "diet",      label: "Diet & Lifestyle", emoji: "🍱" },
  { id: "energy",    label: "Energy & Tech",    emoji: "⚡" },
];

const toNum = (v, fallback = 0) => { const n = parseFloat(v); return isNaN(n) ? fallback : n; };

// ─── Reusable field components ────────────────────────────────────────────────
function FieldGroup({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-600 leading-relaxed">{hint}</p>}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, prefix, suffix }) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-emerald-400 text-sm font-semibold pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3 text-sm text-zinc-100",
          "placeholder:text-zinc-700 outline-none transition-all duration-200",
          "focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30",
          prefix ? "pl-8 pr-4" : suffix ? "pl-4 pr-14" : "px-4",
        ].join(" ")}
      />
      {suffix && (
        <span className="absolute right-3 text-zinc-500 text-xs pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function PresetChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-0.5">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(String(o.value))}
          className={[
            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
            String(value) === String(o.value)
              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Step panels ──────────────────────────────────────────────────────────────
function TransportStep({ form, set }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Transport</h2>
        <p className="text-sm text-zinc-500 mt-1">How do you get around day-to-day and year-round?</p>
      </div>
      <FieldGroup label="Personal vehicle — km per week" hint="Include daily commute + errands. Urban Indian commuter avg: ~80 km/week.">
        <NumberInput value={form.transport_car_km_per_week} onChange={(v) => set("transport_car_km_per_week", v)} placeholder="e.g. 100" suffix="km/wk" />
        <PresetChips value={form.transport_car_km_per_week} onChange={(v) => set("transport_car_km_per_week", v)}
          options={[{ label: "0 (no car)", value: 0 }, { label: "~50", value: 50 }, { label: "~100", value: 100 }, { label: "~200", value: 200 }]} />
      </FieldGroup>
      <FieldGroup label="AC / Chair Car train — km per month" hint="Add up intercity rail trips: Rajdhani, Shatabdi, Duronto, etc.">
        <NumberInput value={form.transport_train_km_per_month} onChange={(v) => set("transport_train_km_per_month", v)} placeholder="e.g. 400" suffix="km/mo" />
        <PresetChips value={form.transport_train_km_per_month} onChange={(v) => set("transport_train_km_per_month", v)}
          options={[{ label: "None", value: 0 }, { label: "~200", value: 200 }, { label: "~500", value: 500 }, { label: "~1000", value: 1000 }]} />
      </FieldGroup>
      <FieldGroup label="Flights per year" hint="Count each one-way sector. Delhi–Mumbai = 1 flight.">
        <NumberInput value={form.transport_flights_per_year} onChange={(v) => set("transport_flights_per_year", v)} placeholder="e.g. 4" suffix="flights" />
        <PresetChips value={form.transport_flights_per_year} onChange={(v) => set("transport_flights_per_year", v)}
          options={[{ label: "0", value: 0 }, { label: "2", value: 2 }, { label: "6", value: 6 }, { label: "12+", value: 12 }]} />
      </FieldGroup>
    </div>
  );
}

function DietStep({ form, set }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Diet & Lifestyle</h2>
        <p className="text-sm text-zinc-500 mt-1">Food choices are often the biggest lever for change.</p>
      </div>
      <FieldGroup label="Meat-containing meals per week" hint="Chicken, mutton, fish, eggs, seafood. India avg: 5–7 meals/week for non-vegetarians.">
        <NumberInput value={form.diet_meat_meals_per_week} onChange={(v) => set("diet_meat_meals_per_week", v)} placeholder="e.g. 7" suffix="meals/wk" />
        <PresetChips value={form.diet_meat_meals_per_week} onChange={(v) => set("diet_meat_meals_per_week", v)}
          options={[{ label: "Vegetarian (0)", value: 0 }, { label: "Occasionally (3)", value: 3 }, { label: "Often (7)", value: 7 }, { label: "Daily (14)", value: 14 }]} />
      </FieldGroup>
      <FieldGroup label="Food delivery orders per month" hint="Zomato, Swiggy, etc. Each order includes packaging + 2-wheeler delivery emissions.">
        <NumberInput value={form.diet_delivery_orders_per_month} onChange={(v) => set("diet_delivery_orders_per_month", v)} placeholder="e.g. 8" suffix="orders/mo" />
        <PresetChips value={form.diet_delivery_orders_per_month} onChange={(v) => set("diet_delivery_orders_per_month", v)}
          options={[{ label: "Rarely (2)", value: 2 }, { label: "Weekly (4)", value: 4 }, { label: "Often (10)", value: 10 }, { label: "Daily (30)", value: 30 }]} />
      </FieldGroup>
    </div>
  );
}

function EnergyStep({ form, set }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50 tracking-tight">Energy & Tech</h2>
        <p className="text-sm text-zinc-500 mt-1">Home electricity and screen time both leave a footprint.</p>
      </div>
      <FieldGroup label="Monthly household electricity bill" hint="From your BESCOM / MSEDCL / TATA Power bill. 2–3 BHK avg: ₹800–₹2,500/mo.">
        <NumberInput value={form.energy_bill_inr_per_month} onChange={(v) => set("energy_bill_inr_per_month", v)} placeholder="e.g. 1500" prefix="₹" />
        <PresetChips value={form.energy_bill_inr_per_month} onChange={(v) => set("energy_bill_inr_per_month", v)}
          options={[{ label: "₹500", value: 500 }, { label: "₹1,000", value: 1000 }, { label: "₹2,000", value: 2000 }, { label: "₹4,000+", value: 4000 }]} />
      </FieldGroup>
      <FieldGroup label="Daily electronics usage — hours active / charging" hint="Combined hours for laptop, phone, wireless headphones, tablet. WFH workers avg 10–14h.">
        <NumberInput value={form.energy_devices_hours_per_day} onChange={(v) => set("energy_devices_hours_per_day", v)} placeholder="e.g. 8" suffix="hrs/day" />
        <PresetChips value={form.energy_devices_hours_per_day} onChange={(v) => set("energy_devices_hours_per_day", v)}
          options={[{ label: "Light (2h)", value: 2 }, { label: "Average (6h)", value: 6 }, { label: "Heavy (10h)", value: 10 }, { label: "WFH (16h)", value: 16 }]} />
      </FieldGroup>
    </div>
  );
}

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={[
              "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 border",
              i < current  ? "bg-emerald-500 border-emerald-500 text-white" :
              i === current ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]" :
                              "bg-zinc-900 border-zinc-800 text-zinc-600",
            ].join(" ")}>
              {i < current ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : <span className="text-xs font-semibold">{i + 1}</span>}
            </div>
            <span className={[
              "text-[10px] font-medium whitespace-nowrap",
              i === current ? "text-emerald-400" : i < current ? "text-emerald-600" : "text-zinc-700",
            ].join(" ")}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={[
              "flex-1 h-px mx-2 mb-4 transition-colors duration-300",
              i < current ? "bg-emerald-600/50" : "bg-zinc-800",
            ].join(" ")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingQuiz() {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const navigate              = useNavigate();

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      transport_car_km_per_week:      toNum(form.transport_car_km_per_week),
      transport_train_km_per_month:   toNum(form.transport_train_km_per_month),
      transport_flights_per_year:     toNum(form.transport_flights_per_year),
      diet_meat_meals_per_week:       Math.round(toNum(form.diet_meat_meals_per_week)),
      diet_delivery_orders_per_month: Math.round(toNum(form.diet_delivery_orders_per_month)),
      energy_bill_inr_per_month:      toNum(form.energy_bill_inr_per_month),
      energy_devices_hours_per_day:   toNum(form.energy_devices_hours_per_day),
    };
    try {
      const res = await fetch("https://carbon-footprint-dk7t.onrender.com/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || `Server error ${res.status}`); }
      const data = await res.json();
      navigate("/dashboard", { state: { result: data } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <button
        onClick={() => navigate("/")}
        className="self-start mb-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5"
        style={{ marginLeft: "max(0px, calc(50% - 240px))" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </button>

      <div className="w-full max-w-[480px] bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="h-0.5 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-7 pb-6">
          <StepBar current={step} />

          <div key={step}>
            {step === 0 && <TransportStep form={form} set={set} />}
            {step === 1 && <DietStep      form={form} set={set} />}
            {step === 2 && <EnergyStep    form={form} set={set} />}
          </div>

          {error && (
            <div className="mt-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠</span><span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 mt-7">
            <button
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-xl border border-zinc-800 text-sm text-zinc-500
                         hover:border-zinc-700 hover:text-zinc-400 transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500
                           text-sm font-semibold text-white transition-all active:scale-[0.98]"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500
                           text-sm font-semibold text-white transition-all active:scale-[0.98]
                           disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Calculating…
                  </>
                ) : "Calculate Score 🌱"}
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-zinc-700">Step {step + 1} of {STEPS.length}</p>
    </div>
  );
}