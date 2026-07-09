"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval = null;
    let timeout = null;
    let currentProgress = 0;

    interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);
        
        timeout = setTimeout(() => {
          setLoading(false);
        }, 400);
      } else {
        setProgress(currentProgress);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  if (!loading && progress === 100) return null;

  return (
    <>
      <div className={`preloader ${progress === 100 ? 'preloader-fade-out' : ''}`}>
        <div className="preloader-content">
          <div className="preloader-logo">
            <span className="preloader-icon">🎓</span> Eduka
          </div>
          <div className="preloader-bar-container">
            <div 
              className="preloader-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="preloader-percentage">{Math.floor(progress)}%</div>
        </div>
      </div>
      <style jsx global>{`
        .preloader {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background-color: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.6s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .preloader-fade-out {
          opacity: 0;
          pointer-events: none;
        }
        .preloader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          width: 80%;
          max-width: 300px;
        }
        .preloader-logo {
          font-family: var(--font-heading);
          font-size: var(--fs-3xl);
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          letter-spacing: -0.02em;
        }
        .preloader-icon {
          animation: bounce 2s infinite;
        }
        .preloader-bar-container {
          width: 100%;
          height: 2px;
          background: var(--glass-bg);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .preloader-bar {
          height: 100%;
          background: var(--gradient-text);
          border-radius: var(--radius-full);
          transition: width 0.1s ease-out;
        }
        .preloader-percentage {
          font-family: var(--font-mono);
          font-size: var(--fs-xs);
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
