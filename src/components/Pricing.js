"use client";

import { useState } from "react";

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="pricing" id="precos">
      <div className="container">
        <h2 className="section-title reveal-on-scroll" style={{ textAlign: 'left' }}>Investe no teu <span className="gradient-text">Sucesso</span></h2>
        <p className="section-subtitle reveal-on-scroll" data-delay="100" style={{ textAlign: 'left', margin: '0 0 var(--space-8) 0', maxWidth: '480px' }}>
          Escolhe o plano ideal para a tua jornada académica. Podes cancelar a qualquer momento.
        </p>

        <div className="pricing-toggle reveal-on-scroll" data-delay="200">
          <span className={!annual ? "active" : ""}>Mensal</span>
          <button 
            className={`toggle-btn ${annual ? "annual" : ""}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle billing period"
          >
            <div className="toggle-slider"></div>
          </button>
          <span className={annual ? "active" : ""}>Anual <span className="discount-badge">-20%</span></span>
        </div>

        <div className="pricing-grid">
          {/* Grátis */}
          <div className="pricing-card glass-card reveal-on-scroll" data-delay="300">
            <h3>Caloiro 🎒</h3>
            <div className="price">
              <span className="currency">AOA</span>
              <span className="amount">0</span>
              <span className="period">/mês</span>
            </div>
            <p className="plan-desc">Perfeito para experimentar a plataforma.</p>
            <ul className="plan-features">
              <li><CheckIcon /> 3 Trabalhos por mês</li>
              <li><CheckIcon /> Melhorador de Texto (Limitado)</li>
              <li><CheckIcon /> Explicações Simples</li>
              <li className="disabled"><CrossIcon /> Gerador de Slides</li>
              <li className="disabled"><CrossIcon /> Acesso prioritário</li>
            </ul>
            <a href="/registar" className="btn btn-secondary w-100">Começar Grátis</a>
          </div>

          {/* Pro */}
          <div className="pricing-card glass-card popular reveal-on-scroll" data-delay="400">
            <div className="popular-badge">Mais Popular ✨</div>
            <h3>Mestre 🎓</h3>
            <div className="price">
              <span className="currency">AOA</span>
              <span className="amount">{annual ? "3.600" : "4.500"}</span>
              <span className="period">/mês</span>
            </div>
            <p className="plan-desc">Para estudantes que querem excelência.</p>
            <ul className="plan-features">
              <li><CheckIcon /> Trabalhos Ilimitados</li>
              <li><CheckIcon /> Melhorador Avançado</li>
              <li><CheckIcon /> Gerador de Slides PPTX</li>
              <li><CheckIcon /> Resumo de PDFs</li>
              <li><CheckIcon /> Suporte Prioritário</li>
            </ul>
            <a href="/registar?plan=pro" className="btn btn-primary w-100">Subscrever Mestre</a>
          </div>
        </div>
      </div>
      <style jsx>{`
        .pricing {
          padding: var(--space-24) 0;
          position: relative;
        }
        .pricing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          margin-bottom: var(--space-12);
          font-weight: 600;
        }
        .pricing-toggle span {
          color: var(--slate-400);
          transition: color 0.3s;
        }
        .pricing-toggle span.active {
          color: var(--text-main);
        }
        .toggle-btn {
          width: 60px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }
        .toggle-btn.annual {
          background: var(--blue-500);
          border-color: var(--blue-400);
        }
        .toggle-slider {
          width: 24px;
          height: 24px;
          background: var(--text-main);
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 4px;
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .toggle-btn.annual .toggle-slider {
          transform: translateX(28px);
        }
        .discount-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981 !important;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: var(--fs-xs);
          margin-left: 8px;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-8);
          max-width: 800px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pricing-card {
          padding: var(--space-8);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .pricing-card.popular {
          transform: scale(1.05);
          border-color: rgba(37, 99, 235, 0.5);
          box-shadow: 0 0 40px rgba(37, 99, 235, 0.1);
          z-index: 10;
        }
        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--gradient-text);
          color: var(--text-main);
          font-weight: 800;
          font-size: var(--fs-sm);
          padding: 4px 16px;
          border-radius: var(--radius-full);
          white-space: nowrap;
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
        }
        .pricing-card h3 {
          font-size: var(--fs-2xl);
          margin-bottom: var(--space-4);
        }
        .price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: var(--space-2);
        }
        .currency {
          font-size: var(--fs-lg);
          color: var(--slate-400);
        }
        .amount {
          font-size: var(--fs-5xl);
          font-weight: 800;
          font-family: var(--font-heading);
          color: var(--text-main);
        }
        .period {
          color: var(--slate-400);
        }
        .plan-desc {
          font-size: var(--fs-sm);
          margin-bottom: var(--space-6);
        }
        .plan-features {
          list-style: none;
          margin-bottom: var(--space-8);
          flex-grow: 1;
        }
        .plan-features li {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
          font-size: var(--fs-sm);
        }
        .plan-features li.disabled {
          color: var(--text-muted);
        }
        .w-100 {
          width: 100%;
        }
      `}</style>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
