"use client";

import { useEffect, useState, useRef } from "react";

export default function Stats() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    const sectionNode = sectionRef.current;

    if (sectionNode) {
      observer.observe(sectionNode);
    }

    return () => {
      if (sectionNode) observer.unobserve(sectionNode);
    };
  }, []);

  return (
    <section className="stats-section reveal-on-scroll" ref={sectionRef}>
      <div className="stats-noise-bg"></div>
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="stats-grid">
          <StatBox icon="👨‍🎓" label="Estudantes Activos" target={1200} suffix="+" trigger={inView} delay={0} placeholder="—" />
          <StatBox icon="📄" label="Trabalhos Gerados" target={5000} suffix="+" trigger={inView} delay={200} placeholder="—" />
          <StatBox icon="🎯" label="Taxa de Satisfação" target={98} suffix="%" trigger={inView} delay={400} placeholder="—" />
          <StatBox icon="🇦🇴" label="Províncias" target={18} suffix="" trigger={inView} delay={600} placeholder="—" />
        </div>
      </div>
      <style jsx>{`
        .stats-section {
          padding: var(--space-20) 0;
          position: relative;
          background: linear-gradient(to bottom, transparent, rgba(37, 99, 235, 0.05), transparent);
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          overflow: hidden;
        }
        .stats-noise-bg {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          z-index: 1;
          mix-blend-mode: overlay;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-8);
          perspective: 1000px;
        }
        @media(min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </section>
  );
}

function StatBox({ icon, label, target, suffix, trigger, delay, placeholder }) {
  const [count, setCount] = useState(0);
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    if (!trigger || !target) return;

    let start = 0;
    const duration = 2000;
    const incrementTime = 20;
    const steps = duration / incrementTime;
    const increment = target / steps;

    const timer = setTimeout(() => {
      const counter = setInterval(() => {
        start += increment;
        if (start >= target) {
          clearInterval(counter);
          setCount(target);
        } else {
          setCount(Math.ceil(start));
        }
      }, incrementTime);
    }, delay);

    return () => clearTimeout(timer);
  }, [trigger, target, delay]);

  const handleMouseMove = (e) => {
    if (!cardRef.current || !innerRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    innerRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    innerRef.current.style.boxShadow = `
      ${-rotateY}px ${rotateX}px 20px rgba(0, 0, 0, 0.2),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1)
    `;
  };

  const handleMouseLeave = () => {
    if (!innerRef.current) return;
    innerRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
    innerRef.current.style.boxShadow = `
      0 10px 30px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px var(--glass-border)
    `;
  };

  return (
    <div 
      className="stat-box-wrapper reveal-on-scroll" 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-delay={delay}
    >
      <div className="stat-box-inner" ref={innerRef}>
        <div className="stat-icon">{icon}</div>
        <div className="stat-number gradient-text">
          {placeholder || <>{count.toLocaleString('pt-PT')}{suffix}</>}
        </div>
        <div className="stat-label">{label}</div>
        {placeholder && <div className="stat-pending">métrica a confirmar</div>}
      </div>
      <style jsx>{`
        .stat-box-wrapper {
          perspective: 1000px;
          transform-style: preserve-3d;
          width: 100%;
        }
        .stat-box-inner {
          text-align: center;
          padding: var(--space-6) var(--space-4);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transform: rotateX(0deg) rotateY(0deg);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), inset 0 0 0 1px var(--glass-border);
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
          will-change: transform;
          transform-style: preserve-3d;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .stat-icon {
          font-size: var(--fs-3xl);
          margin-bottom: var(--space-3);
          transform: translateZ(30px); /* 3D pop effect */
        }
        .stat-number {
          font-family: var(--font-heading);
          font-size: var(--fs-4xl);
          font-weight: 800;
          margin-bottom: var(--space-2);
          transform: translateZ(20px);
        }
        .stat-label {
          color: var(--slate-400);
          font-size: var(--fs-sm);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transform: translateZ(10px);
        }
        .stat-pending {
          color: var(--slate-600);
          font-size: var(--fs-xs);
          font-style: italic;
          margin-top: var(--space-1);
        }
      `}</style>
    </div>
  );
}
