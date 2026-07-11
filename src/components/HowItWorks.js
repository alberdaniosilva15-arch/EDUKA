"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FRAME_COUNT = 141;
const WINDOW_SIZE = 40;

const steps = [
  {
    num: "01",
    title: "Explica o que precisas",
    desc: "Diz à IA qual é o teu curso, o tema e o objectivo. Podes ser o mais detalhado possível.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    )
  },
  {
    num: "02",
    title: "A magia acontece",
    desc: "Os nossos agentes processam os dados, estruturam a informação e ajustam o tom ao ensino superior.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
    )
  },
  {
    num: "03",
    title: "Exporta e brilha",
    desc: "Recebe o resultado final com alta qualidade. Exporta para Word, PDF ou descarrega os slides em PPTX.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    )
  }
];

function getFramePath(index) {
  return `/frames/frame-${String(index).padStart(3, "0")}.webp`;
}

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const skeletonRef = useRef(null);
  const framesCacheRef = useRef(new Map());
  const latestFrameRef = useRef(0);
  const animContextRef = useRef(null);

  const [firstFramesLoaded, setFirstFramesLoaded] = useState(false);

  // ─── Helpers ───────────────────────────────────────────────

  const getImage = useCallback((index) => {
    const cache = framesCacheRef.current;
    if (!cache.has(index)) {
      const img = new window.Image();
      img.src = getFramePath(index);
      cache.set(index, img);
    }
    return cache.get(index);
  }, []);

  const cleanupCache = useCallback((currentIndex) => {
    const cache = framesCacheRef.current;
    for (const key of cache.keys()) {
      if (Math.abs(key - currentIndex) > WINDOW_SIZE) {
        cache.delete(key);
      }
    }
  }, []);

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const targetW = Math.round(rect.width * ratio);
    const targetH = Math.round(rect.height * ratio);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const img = getImage(index);
    latestFrameRef.current = index;
    cleanupCache(index);

    const paint = () => {
      // Paint with devicePixelRatio transform
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Object-fit: cover
      const hRatio = rect.width / img.naturalWidth;
      const vRatio = rect.height / img.naturalHeight;
      const r = Math.max(hRatio, vRatio);
      const cx = (rect.width - img.naturalWidth * r) / 2;
      const cy = (rect.height - img.naturalHeight * r) / 2;

      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, cx, cy, img.naturalWidth * r, img.naturalHeight * r);
    };

    if (img.complete && img.naturalWidth !== 0) {
      paint();
    } else {
      img.onload = () => {
        if (latestFrameRef.current === index) paint();
      };
    }
  }, [getImage, cleanupCache]);

  // ─── 1. IntersectionObserver → Preload progressivo ────────

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cancelled) {
          // Secção está perto — começa a carregar os primeiros frames
          let loaded = 0;
          const INITIAL_BATCH = 8;

          for (let i = 1; i <= INITIAL_BATCH; i++) {
            const img = getImage(i);
            const onDone = () => {
              loaded++;
              if (loaded >= 3 && !cancelled) {
                // Basta 3 frames carregarem para esconder o skeleton
                setFirstFramesLoaded(true);
                drawFrame(1);
              }
            };
            if (img.complete && img.naturalWidth !== 0) {
              onDone();
            } else {
              img.addEventListener("load", onDone, { once: true });
            }
          }

          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(section);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [getImage, drawFrame]);

  // ─── 2. GSAP ScrollTrigger + matchMedia ───────────────────

  useEffect(() => {
    if (!firstFramesLoaded) return;
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();

    // ── Desktop (> 768px, sem reduced-motion) ───
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          const frameIndex = Math.max(1, Math.min(FRAME_COUNT, Math.round(p * FRAME_COUNT)));
          drawFrame(frameIndex);

          // Pré-carrega a janela de frames próximos
          for (let i = Math.max(1, frameIndex - 5); i <= Math.min(FRAME_COUNT, frameIndex + 15); i++) {
            getImage(i);
          }

          // Sincroniza passos: 0-33% → step 1, 33-66% → step 2, 66-100% → step 3
          const activeStep = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
          const items = section.querySelectorAll(".timeline-item");
          items.forEach((item, i) => {
            gsap.to(item, {
              opacity: i === activeStep ? 1 : 0.25,
              scale: i === activeStep ? 1 : 0.97,
              duration: 0.5,
              ease: "power2.out",
              overwrite: "auto",
            });
          });
        },
      });

      // Resize handler para re-desenhar o canvas ao alterar dimensões
      const onResize = () => {
        drawFrame(latestFrameRef.current || 1);
      };
      window.addEventListener("resize", onResize);

      return () => {
        st.kill();
        window.removeEventListener("resize", onResize);
      };
    });

    // ── Mobile ou prefers-reduced-motion ───
    mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
      // Desenha um frame estático (meio do vídeo)
      drawFrame(Math.round(FRAME_COUNT / 2));

      // Fade-in suave dos passos
      const items = section.querySelectorAll(".timeline-item");
      gsap.set(items, { opacity: 0, y: 20 });

      items.forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 85%",
          onEnter: () => {
            gsap.to(item, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: i * 0.1,
              ease: "power2.out",
            });
          },
          once: true,
        });
      });
    });

    animContextRef.current = mm;

    return () => {
      mm.revert();
    };
  }, [firstFramesLoaded, drawFrame, getImage]);

  // ─── Render ───────────────────────────────────────────────

  return (
    <section className="how-it-works" id="como-funciona" ref={sectionRef}>
      <div className="hw-grid">
        {/* ── Coluna Esquerda: Texto + Timeline ── */}
        <div className="hw-text-col">
          <div className="hw-text-inner">
            <h2 className="section-title">
              Simples assim. <span className="gradient-text">Em segundos.</span>
            </h2>
            <p className="section-subtitle">
              Não precisas de ser um expert em Inteligência Artificial para tirares o máximo proveito do Eduka.
            </p>

            <div className="timeline">
              {steps.map((step, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="marker-dot" />
                    <div className="marker-line" />
                  </div>
                  <div className="timeline-content">
                    <div className="step-header">
                      <span className="step-num">{step.num}</span>
                      <span className="step-icon">{step.icon}</span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Coluna Direita: Canvas Sticky ── */}
        <div className="hw-visual-col">
          <div className="visual-wrapper">
            {/* Skeleton que aparece enquanto os frames carregam */}
            <div
              ref={skeletonRef}
              className={`skeleton-container${firstFramesLoaded ? " hidden" : ""}`}
              aria-hidden={firstFramesLoaded}
            >
              <div className="skeleton-shimmer">
                <div className="skeleton-circle" />
                <div className="skeleton-lines">
                  <div className="skeleton-bar" style={{ width: "60%" }} />
                  <div className="skeleton-bar" style={{ width: "80%" }} />
                  <div className="skeleton-bar" style={{ width: "45%" }} />
                </div>
              </div>
              <span className="skeleton-label">A carregar pré-visualização…</span>
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} className="hw-canvas" />

            {/* Vinheta sutil — não liquid glass pesado */}
            <div className="vignette-overlay" />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ═══════════════════════════════════════════
           SECTION
        ═══════════════════════════════════════════ */
        .how-it-works {
          padding: var(--space-20, 5rem) 0;
          position: relative;
          /* NÃO usar overflow: hidden aqui — senão o pin do GSAP parte */
        }

        .hw-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-12, 3rem);
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 var(--space-6, 1.5rem);
        }

        @media (min-width: 768px) {
          .hw-grid {
            grid-template-columns: 1fr 1.2fr;
            gap: var(--space-16, 4rem);
            align-items: start;
          }
        }

        /* ═══════════════════════════════════════════
           TEXT COL (Left)
        ═══════════════════════════════════════════ */
        .hw-text-col {
          display: flex;
          flex-direction: column;
        }

        .hw-text-inner {
          padding-top: var(--space-4, 1rem);
        }

        .section-title {
          text-align: left;
          font-size: var(--fs-4xl, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: var(--space-4, 1rem);
        }

        .section-subtitle {
          text-align: left;
          margin: 0 0 var(--space-12, 3rem) 0;
          max-width: 440px;
          color: var(--text-muted, #888);
          font-size: var(--fs-lg, 1.125rem);
          line-height: 1.6;
        }

        /* ═══════════════════════════════════════════
           TIMELINE — Limpa, Tipografia Forte
        ═══════════════════════════════════════════ */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: var(--space-10, 2.5rem);
          padding-left: var(--space-2, 0.5rem);
        }

        .timeline-item {
          display: flex;
          gap: var(--space-6, 1.5rem);
          position: relative;
          will-change: opacity, transform;
        }

        @media (min-width: 768px) {
          .timeline-item {
            opacity: 0.25;
            transition: none; /* GSAP controla */
          }
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
        }

        .marker-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: transparent;
          border: 2.5px solid var(--blue-500, #3b82f6);
          z-index: 2;
          margin-top: 6px;
        }

        .marker-line {
          position: absolute;
          top: 22px;
          bottom: calc(-1 * var(--space-10, 2.5rem));
          width: 1px;
          background: var(--glass-border, rgba(255,255,255,0.08));
          z-index: 1;
        }

        .timeline-item:last-child .marker-line {
          display: none;
        }

        .timeline-content {
          flex-grow: 1;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
          margin-bottom: var(--space-2, 0.5rem);
        }

        .step-num {
          font-family: var(--font-heading, sans-serif);
          font-size: var(--fs-3xl, 2rem);
          font-weight: 800;
          background: linear-gradient(135deg, var(--blue-400, #60a5fa), var(--cyan-400, #22d3ee));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .step-icon {
          color: var(--text-muted, #888);
          display: flex;
          align-items: center;
          opacity: 0.5;
        }

        .timeline-content h3 {
          font-size: var(--fs-xl, 1.25rem);
          font-weight: 600;
          margin-bottom: var(--space-1, 0.25rem);
          letter-spacing: -0.02em;
        }

        .timeline-content p {
          color: var(--text-muted, #888);
          font-size: var(--fs-base, 1rem);
          line-height: 1.65;
        }

        /* ═══════════════════════════════════════════
           VISUAL COL (Right) — Canvas
        ═══════════════════════════════════════════ */
        .hw-visual-col {
          position: relative;
          width: 100%;
          height: 50vh;
          min-height: 320px;
        }

        @media (min-width: 768px) {
          .hw-visual-col {
            position: sticky;
            top: 15vh;
            height: 70vh;
          }
        }

        .visual-wrapper {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-2xl, 1.5rem);
          overflow: hidden;
          position: relative;
          background: var(--bg-card, #111);
        }

        .hw-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* Vinheta sutil — bordas escuras no escuro, bordas claras no claro */
        .vignette-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.45);
          border-radius: inherit;
        }

        [data-theme="light"] .vignette-overlay {
          box-shadow: inset 0 0 60px rgba(255, 255, 255, 0.5);
        }

        /* ═══════════════════════════════════════════
           SKELETON LOADER
        ═══════════════════════════════════════════ */
        .skeleton-container {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: var(--bg-card, #111);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-6, 1.5rem);
          transition: opacity 0.6s ease, visibility 0.6s ease;
          border-radius: inherit;
        }

        .skeleton-container.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .skeleton-shimmer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4, 1rem);
        }

        .skeleton-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(
            110deg,
            var(--glass-border, rgba(255,255,255,0.06)) 30%,
            rgba(255,255,255,0.12) 50%,
            var(--glass-border, rgba(255,255,255,0.06)) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite ease-in-out;
        }

        .skeleton-lines {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .skeleton-bar {
          height: 10px;
          border-radius: 5px;
          min-width: 80px;
          background: linear-gradient(
            110deg,
            var(--glass-border, rgba(255,255,255,0.06)) 30%,
            rgba(255,255,255,0.12) 50%,
            var(--glass-border, rgba(255,255,255,0.06)) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite ease-in-out;
          animation-delay: 0.15s;
        }

        .skeleton-label {
          font-size: var(--fs-sm, 0.875rem);
          color: var(--text-muted, #666);
          opacity: 0.6;
          letter-spacing: 0.02em;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
