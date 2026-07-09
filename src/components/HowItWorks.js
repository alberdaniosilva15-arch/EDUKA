"use client";

export default function HowItWorks() {
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

  return (
    <section className="how-it-works" id="como-funciona">
      <div className="container">
        <h2 className="section-title reveal-on-scroll" style={{ textAlign: 'left' }}>
          Simples assim. <span className="gradient-text">Em segundos.</span>
        </h2>
        <p className="section-subtitle reveal-on-scroll" data-delay="100" style={{ textAlign: 'left', margin: '0 0 var(--space-12) 0', maxWidth: '480px' }}>
          Não precisas de ser um expert em Inteligência Artificial para tirares o máximo proveito do Eduka.
        </p>

        <div className="timeline">
          {steps.map((step, i) => (
            <div key={i} className="timeline-item reveal-on-scroll" data-delay={i * 200} data-direction={i % 2 === 0 ? "left" : "right"}>
              <div className="timeline-marker">
                <div className="marker-dot"></div>
                <div className="marker-line"></div>
              </div>
              <div className="timeline-content glass-card">
                <div className="step-header">
                  <span className="step-num" data-text={step.num}>{step.num}</span>
                  <span className="step-icon">{step.icon}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .how-it-works {
          padding: var(--space-24) 0;
          background: radial-gradient(circle at center, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
        }
        .timeline {
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          padding-left: var(--space-4);
        }
        .timeline-item {
          display: flex;
          gap: var(--space-8);
          position: relative;
        }
        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .marker-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-main);
          border: 4px solid var(--blue-500);
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
          z-index: 2;
        }
        .marker-line {
          position: absolute;
          top: 24px;
          bottom: calc(-1 * var(--space-8));
          width: 2px;
          background: linear-gradient(to bottom, var(--blue-500), rgba(37, 99, 235, 0.1));
          z-index: 1;
        }
        .timeline-item:last-child .marker-line {
          display: none;
        }
        .timeline-content {
          padding: var(--space-6);
          flex-grow: 1;
          position: relative;
        }
        .timeline-content::before {
          content: '';
          position: absolute;
          top: 10px;
          left: -10px;
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
          border-right: 10px solid var(--glass-bg);
        }
        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }
        .step-num {
          font-family: var(--font-heading);
          font-size: var(--fs-4xl);
          font-weight: 800;
          color: transparent;
          -webkit-text-stroke: 1px var(--glass-border);
          position: relative;
        }
        .step-num::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          background: linear-gradient(135deg, var(--blue-400), var(--cyan-400));
          -webkit-background-clip: text;
          color: transparent;
          opacity: 0.3;
          filter: blur(8px);
          z-index: -1;
        }
        .step-icon {
          color: var(--blue-400);
          background: rgba(37, 99, 235, 0.1);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timeline-content h3 {
          font-size: var(--fs-xl);
          margin-bottom: var(--space-2);
        }
      `}</style>
    </section>
  );
}
