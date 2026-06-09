import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

const STATS = [
  { value: "4.7T", label: "kg CO₂ global avg/year" },
  { value: "2×", label: "India exceeds global avg" },
  { value: "80%", label: "reducible with lifestyle shifts" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated particle field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -Math.random() * 0.4 - 0.1,
      o: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(134,239,172,${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < 0 || p.x > w) p.dx *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div className="landing-root">
      <canvas ref={canvasRef} className="landing-canvas" />

      <nav className="landing-nav">
        <span className="landing-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
            <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4"/>
            <path d="M16 3c1 2.5.5 5-1 7"/>
          </svg>
          Carbonly
        </span>
        <button className="landing-nav-cta" onClick={() => navigate("/quiz")}>
          Get Started
        </button>
      </nav>

      <main className="landing-main">
        <div className="landing-badge">🌍 Free Carbon Assessment</div>
        <h1 className="landing-h1">
          Know Your<br />
          <span className="landing-h1-accent">Carbon Weight</span>
        </h1>
        <p className="landing-sub">
          Answer 9 questions. Get a personalised footprint score with<br />
          actionable steps to reduce your impact on the planet.
        </p>
        <button className="landing-cta" onClick={() => navigate("/quiz")}>
          Calculate Our Footprint
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <p className="landing-note">~2 minutes · No account needed</p>
      </main>

      <section className="landing-stats">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .landing-root {
          min-height: 100vh;
          background: #0a0f0a;
          color: #e8f5e8;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .landing-canvas {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
        }
        .landing-nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.5rem 3rem;
          border-bottom: 1px solid rgba(134,239,172,0.08);
        }
        .landing-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 1.25rem;
          color: #86efac;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .landing-nav-cta {
          background: transparent;
          border: 1px solid rgba(134,239,172,0.3);
          color: #86efac;
          padding: 0.45rem 1.2rem;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .landing-nav-cta:hover { background: rgba(134,239,172,0.08); }

        .landing-main {
          position: relative; z-index: 10;
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 4rem 1.5rem 2rem;
        }
        .landing-badge {
          display: inline-block;
          background: rgba(134,239,172,0.08);
          border: 1px solid rgba(134,239,172,0.2);
          color: #86efac;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          padding: 0.35rem 1rem;
          border-radius: 100px;
          margin-bottom: 2rem;
          animation: fadeUp 0.6s ease both;
        }
        .landing-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.8rem, 8vw, 6rem);
          font-weight: 800;
          line-height: 1.05;
          margin: 0 0 1.5rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .landing-h1-accent {
          background: linear-gradient(135deg, #86efac 0%, #4ade80 50%, #16a34a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .landing-sub {
          font-size: 1.05rem;
          color: #9ca3af;
          line-height: 1.7;
          max-width: 500px;
          margin: 0 0 2.5rem;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .landing-cta {
          display: inline-flex; align-items: center; gap: 0.6rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.9rem 2.2rem;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 40px rgba(34,197,94,0.25);
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .landing-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 60px rgba(34,197,94,0.4);
        }
        .landing-note {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #4b5563;
          animation: fadeUp 0.6s 0.4s ease both;
        }

        .landing-stats {
          position: relative; z-index: 10;
          display: flex; justify-content: center; gap: 1px;
          border-top: 1px solid rgba(134,239,172,0.08);
          padding: 0;
        }
        .stat-card {
          flex: 1; max-width: 260px;
          display: flex; flex-direction: column; align-items: center;
          padding: 2rem 1.5rem;
          border-right: 1px solid rgba(134,239,172,0.08);
        }
        .stat-card:last-child { border-right: none; }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 2rem; font-weight: 800;
          color: #86efac;
        }
        .stat-label {
          font-size: 0.8rem; color: #6b7280;
          margin-top: 0.25rem; text-align: center;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}