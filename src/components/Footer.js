"use client";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-layout">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="gradient-text">🎓</span> Eduka
            </div>
            <p className="footer-desc">
              A plataforma académica com IA para estudantes angolanos.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-links-row">
              <a href="#funcionalidades">Ferramentas</a>
              <a href="#precos">Preços</a>
              <a href="#">Sobre</a>
              <a href="#">Termos</a>
              <a href="#">Privacidade</a>
            </div>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Eduka. Feito em Angola.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          position: relative;
          background: var(--bg-main);
          padding: var(--space-16) 0 var(--space-8);
          border-top: 1px solid var(--glass-border);
        }
        .footer-layout {
          display: flex;
          flex-direction: column;
          gap: var(--space-10);
          margin-bottom: var(--space-10);
        }
        @media (min-width: 768px) {
          .footer-layout {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
        }
        .footer-left {
          max-width: 280px;
        }
        .footer-logo {
          font-family: var(--font-heading);
          font-size: var(--fs-xl);
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }
        .footer-desc {
          color: var(--slate-500);
          font-size: var(--fs-sm);
          line-height: 1.6;
        }
        .footer-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        @media (min-width: 768px) {
          .footer-right {
            align-items: flex-end;
          }
        }
        .footer-links-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-5);
        }
        .footer-links-row a {
          color: var(--slate-400);
          font-size: var(--fs-sm);
          transition: color 0.2s;
        }
        .footer-links-row a:hover {
          color: var(--text-main);
        }
        .footer-social {
          display: flex;
          gap: var(--space-3);
        }
        .footer-social a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          color: var(--slate-500);
          transition: color 0.2s;
        }
        .footer-social a:hover {
          color: var(--blue-400);
        }
        .footer-bottom {
          padding-top: var(--space-6);
          border-top: 1px solid var(--glass-border);
          text-align: center;
          color: var(--slate-600);
          font-size: var(--fs-xs);
        }
      `}</style>
    </footer>
  );
}
