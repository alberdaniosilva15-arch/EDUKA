"use client";

import { useState } from "react";
import { exportToTxt, downloadAsFile } from "@/lib/utils";
import { exportToDocx, exportToPdf } from "@/lib/document-export";

export default function ExportMenu({ markdown, filename = "Trabalho-Eduka" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    setIsOpen(false);
    
    try {
      if (format === 'docx') {
        await exportToDocx(markdown, filename);
      } else if (format === 'pdf') {
        await exportToPdf(markdown, filename);
      } else if (format === 'txt') {
        exportToTxt(markdown, filename);
      } else if (format === 'md') {
        downloadAsFile(markdown, filename + ".md", "text/markdown");
      }
    } catch (e) {
      console.error("Export failed:", e);
      alert("Houve um erro ao exportar o ficheiro.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-menu-container">
      <button 
        className="btn btn-primary export-btn" 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        {isExporting ? (
          <><span className="spinner-small"></span> A exportar...</>
        ) : (
          <>📥 Exportar <span className={`arrow${isOpen ? ' open' : ''}`}>▼</span></>
        )}
      </button>

      {isOpen && (
        <>
          <div className="export-overlay" onClick={() => setIsOpen(false)}></div>
          <div className="export-dropdown glass-card animate-fade-in">
            <button onClick={() => handleExport('docx')} className="export-option">
              <span className="icon">📄</span> Word (.docx)
            </button>
            <button onClick={() => handleExport('pdf')} className="export-option">
              <span className="icon">📕</span> PDF (.pdf)
            </button>
            <button onClick={() => handleExport('txt')} className="export-option">
              <span className="icon">📝</span> Texto (.txt)
            </button>
            <button onClick={() => handleExport('md')} className="export-option">
              <span className="icon">💻</span> Markdown (.md)
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .export-menu-container {
          position: relative;
          display: inline-block;
        }
        .export-btn {
          min-width: 140px;
        }
        .arrow {
          font-size: 0.8em;
          transition: transform 0.3s;
          display: inline-block;
        }
        .arrow.open {
          transform: rotate(180deg);
        }
        .export-overlay {
          position: fixed;
          inset: 0;
          z-index: 99;
        }
        .export-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          display: flex;
          flex-direction: column;
          padding: var(--space-2);
          z-index: 100;
          transform-origin: top right;
        }
        .export-option {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          padding: var(--space-3);
          background: transparent;
          border: none;
          color: var(--text-main);
          font-family: var(--font-body);
          font-size: var(--fs-sm);
          text-align: left;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .export-option:hover {
          background: var(--glass-bg);
          color: var(--text-main);
        }
        .icon {
          font-size: 1.2em;
        }
        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--glass-border);
          border-top-color: var(--text-main);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
