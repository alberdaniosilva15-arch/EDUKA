"use client";

import { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    name: "João Silva",
    university: "Universidade Agostinho Neto",
    quote: "O Eduka mudou a minha forma de estudar. Os trabalhos que gero servem como base perfeita para as minhas pesquisas. É incrivelmente rápido e adaptado à nossa realidade."
  },
  {
    id: 2,
    name: "Maria Costa",
    university: "Universidade Católica de Angola",
    quote: "A funcionalidade de 'Explicar' é fantástica. Temas que eu não encontrava explicação simples em português de Angola, a IA do Eduka consegue explicar-me como se fosse um professor ao meu lado."
  },
  {
    id: 3,
    name: "Paulo Mendes",
    university: "ISUTIC",
    quote: "Como estudante de engenharia, a qualidade matemática da IA é surpreendente. Uso muito para melhorar os meus relatórios técnicos e corrigir gramática."
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <section className="testimonials reveal-on-scroll" id="depoimentos">
      <div className="container">
        <h2 className="section-title">O que dizem os <span className="gradient-text">estudantes</span></h2>
        <p className="section-subtitle">Junta-te a milhares de universitários que já usam o Eduka para acelerar a sua aprendizagem.</p>

        <div
          className="carousel-container"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div 
            className="carousel-track" 
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {testimonials.map((t, i) => (
              <div key={t.id} className="carousel-slide">
                <div className="testimonial-card glass-card">
                  <p className="testimonial-text">{t.quote}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {t.name.charAt(0)}
                    </div>
                    <div className="author-info">
                      <h4>{t.name}</h4>
                      <span>{t.university}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="carousel-indicators">
            {testimonials.map((_, i) => (
              <button 
                key={i} 
                className={`indicator ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .testimonials {
          padding: var(--space-20) 0;
          overflow: hidden;
        }
        .carousel-container {
          max-width: 800px;
          margin: 0 auto;
          overflow: hidden;
          position: relative;
        }
        .carousel-track {
          display: flex;
          transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .carousel-slide {
          min-width: 100%;
          padding: var(--space-4);
        }
        .testimonial-card {
          padding: var(--space-8);
          position: relative;
          text-align: left;
        }
        .testimonial-text {
          font-size: var(--fs-lg);
          color: var(--text-main);
          position: relative;
          z-index: 1;
          margin-bottom: var(--space-6);
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
        }
        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--gradient-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: var(--slate-900);
          font-size: var(--fs-xl);
        }
        .author-info {
          text-align: left;
        }
        .author-info h4 {
          font-size: var(--fs-base);
          margin-bottom: 2px;
        }
        .author-info span {
          font-size: var(--fs-xs);
          color: var(--slate-400);
        }
        .carousel-indicators {
          display: flex;
          justify-content: center;
          gap: var(--space-2);
          margin-top: var(--space-6);
        }
        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          background: var(--glass-bg);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .indicator.active {
          width: 24px;
          border-radius: var(--radius-full);
          background: var(--blue-400);
        }
      `}</style>
    </section>
  );
}
