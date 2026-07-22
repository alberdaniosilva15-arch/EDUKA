"use client";

import { useEffect, useRef } from "react";
import ParticlesWebGL from "./ParticlesWebGL";

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
    ),
    color: "blue",
    title: "Gerador de Trabalhos",
    description: "Insere o tema, curso e nível. A IA gera uma estrutura completa com introdução, desenvolvimento, conclusão e bibliografia.",
    tag: "Fase 1",
    tagClass: "badge-green",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
    ),
    color: "cyan",
    title: "Melhorador de Texto",
    description: "Cola o teu texto e a IA melhora a clareza, gramática, estrutura e apresentação geral. Antes vs Depois.",
    tag: "Fase 1",
    tagClass: "badge-green",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    ),
    color: "gold",
    title: "Explicação Simples",
    description: "A IA explica temas difíceis numa linguagem mais fácil, com exemplos práticos e analogias do dia-a-dia.",
    tag: "Fase 1",
    tagClass: "badge-green",
  }
];

export default function Features() {
  const cardsRef = useRef([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    // Skip 3D tilt on mobile — no mousemove, causes jank on touch
    if (window.innerWidth < 768) return;

    const handleMouseMove = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseLeave = (card) => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    const listeners = cards.map(card => {
      const moveHandler = (e) => handleMouseMove(e, card);
      const leaveHandler = () => handleMouseLeave(card);
      card.addEventListener("mousemove", moveHandler);
      card.addEventListener("mouseleave", leaveHandler);
      return { card, moveHandler, leaveHandler };
    });

    return () => {
      listeners.forEach(({ card, moveHandler, leaveHandler }) => {
        card.removeEventListener("mousemove", moveHandler);
        card.removeEventListener("mouseleave", leaveHandler);
      });
    };
  }, []);

  return (
    <section className="features" id="funcionalidades">
      <div className="features-particles-layer">
        <ParticlesWebGL />
      </div>
      <div className="features-glow-1"></div>
      <div className="features-glow-2"></div>
      <div className="container">
        <h2 className="section-title reveal-on-scroll" style={{ textAlign: 'left' }}>
          <span className="liquid-metal-glass">Ferramentas que te fazem ir mais longe</span>
        </h2>
        <p className="section-subtitle reveal-on-scroll" data-delay="100" style={{ textAlign: 'left', margin: '0 0 var(--space-12) 0', maxWidth: '520px' }}>
          Cada ferramenta é alimentada por agentes de IA especializados,
          garantindo respostas de alta qualidade, adaptadas ao teu nível e curso.
        </p>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              key={i}
              ref={(el) => (cardsRef.current[i] = el)}
              className="feature-card liquid-glass-item-dark reveal-on-scroll"
              data-delay={i * 100}
            >
              <div className="feature-card-inner">
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
                <span className={`feature-tag badge ${f.tagClass}`}>
                  {f.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .features {
          padding: var(--space-24) 0;
          position: relative;
          overflow: hidden;
        }
        .features-glow-1 {
          position: absolute;
          top: 10%;
          left: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%);
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          pointer-events: none;
        }
        .features-glow-2 {
          position: absolute;
          bottom: 10%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%);
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          pointer-events: none;
        }
        .features-particles-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .features .container {
          position: relative;
          z-index: 1;
        }
        h2.section-title {
          font-family: var(--font-accent);
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-6);
        }
        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: 1.4fr 1fr;
            grid-template-rows: auto auto;
          }
          .features-grid > :first-child {
            grid-row: 1 / 3;
          }
        }
        /* Liquid Glass */
        .liquid-glass-item-dark {
          background: var(--glass-bg);
          backdrop-filter: saturate(180%) blur(32px);
          -webkit-backdrop-filter: saturate(180%) blur(32px);
          border: 1px solid var(--glass-border);
          border-top: 1px solid var(--glass-border);
          border-left: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 45px -5px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background 0.5s ease;
          will-change: transform;
        }
        .liquid-glass-item-dark:hover {
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px var(--glass-border);
        }
        .liquid-glass-item-dark::after {
          content: "";
          position: absolute;
          left: var(--mouse-x, -500px);
          top: var(--mouse-y, -500px);
          width: 400px;
          height: 400px;
          background: radial-gradient(
            circle closest-side,
            rgba(37, 99, 235, 0.15),
            transparent
          );
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .liquid-glass-item-dark:hover::after {
          opacity: 1;
        }
        .feature-card-inner {
          padding: var(--space-8);
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        @media (min-width: 768px) {
          .features-grid > :first-child .feature-card-inner {
            padding: var(--space-10) var(--space-8);
          }
          .features-grid > :first-child .feature-icon {
            width: 64px;
            height: 64px;
            font-size: var(--fs-3xl);
          }
          .features-grid > :first-child h3 {
            font-size: var(--fs-2xl);
          }
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-4);
        }
        .feature-icon.blue { background: rgba(37, 99, 235, 0.1); color: var(--blue-400); }
        .feature-icon.cyan { background: rgba(6, 182, 212, 0.1); color: var(--cyan-400); }
        .feature-icon.gold { background: rgba(245, 158, 11, 0.1); color: var(--gold-400); }
        .feature-icon.red { background: rgba(239, 68, 68, 0.1); color: var(--red-400); }
        .feature-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .feature-card-inner h3 {
          margin-bottom: var(--space-2);
          font-size: var(--fs-xl);
        }
        .feature-card-inner p {
          font-size: var(--fs-sm);
          margin-bottom: var(--space-4);
          flex-grow: 1;
        }
        .feature-tag {
          margin-top: auto;
        }
        
        /* Reveal animation states (GSAP ScrollTrigger takes over) */
        .reveal-on-scroll {
          opacity: 0;
        }
      `}</style>
    </section>
  );
}
