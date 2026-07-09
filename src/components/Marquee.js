"use client";

export default function Marquee() {
  return (
    <div className="marquee-container">
      <div className="marquee-content">
        <span>Eduka Premium ✦ Experiência Académica de Excelência ✦ Inteligência Artificial ✦ </span>
        <span>Eduka Premium ✦ Experiência Académica de Excelência ✦ Inteligência Artificial ✦ </span>
        <span>Eduka Premium ✦ Experiência Académica de Excelência ✦ Inteligência Artificial ✦ </span>
        <span>Eduka Premium ✦ Experiência Académica de Excelência ✦ Inteligência Artificial ✦ </span>
      </div>
      <style jsx>{`
        .marquee-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: rgba(20, 25, 35, 0.8);
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          padding: 1.5rem 0;
          display: flex;
          align-items: center;
          white-space: nowrap;
          z-index: 10;
        }

        .marquee-content {
          display: flex;
          animation: scroll 25s linear infinite;
        }

        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }

        span {
          font-family: var(--font-heading);
          font-size: var(--fs-xl);
          font-weight: 300;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 1rem;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
