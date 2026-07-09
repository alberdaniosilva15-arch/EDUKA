"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="theme-toggle-btn" style={{ opacity: 0 }} />;
  }

  return (
    <>
      <button
        className="theme-toggle-btn"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Alternar tema"
      >
        {theme === 'light' ? '🌞' : '🌙'}
      </button>
      <style jsx>{`
        .theme-toggle-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          cursor: pointer;
          font-size: 1.2rem;
          transition: all var(--duration-normal) var(--ease-smooth);
          margin-right: 12px;
        }
        .theme-toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </>
  );
}
