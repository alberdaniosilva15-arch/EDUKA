"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FREE_MODELS } from "@/lib/free-models";

const STORAGE_KEY = "eduka-chat-conversations-v1";

const starterPrompts = [
  { label: "Escrever", prompt: "Ajuda-me a estruturar um trabalho academico sobre " },
  { label: "Aprender", prompt: "Explica este tema como se eu estivesse a estudar para uma prova: " },
  { label: "Codigo", prompt: "Ajuda-me a entender este codigo passo a passo: " },
  { label: "Pesquisar", prompt: "Investiga e resume as principais ideias sobre " },
];

function createConversation(firstMessage = "") {
  const title = firstMessage.trim() ? firstMessage.trim().slice(0, 46) : "Nova conversa";
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    messages: [],
    updatedAt: Date.now(),
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(FREE_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        setConversations(stored);
        setActiveId(stored[0]?.id || null);
      }
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 25)));
  }, [conversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeId, conversations, loading]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) || null,
    [conversations, activeId]
  );

  const activeMessages = activeConversation?.messages || [];
  const selectedModel = FREE_MODELS.find(m => m.id === model) || FREE_MODELS[0];
  const modelDescription = selectedModel.speed === "rapido" 
    ? "Rapido para duvidas curtas, resumos e estudo diario." 
    : "Mais forte para explicacoes, trabalhos e raciocinio longo.";
  const fullDescription = selectedModel.vision ? `${modelDescription} Suporta analise visual.` : modelDescription;

  function upsertConversation(nextConversation) {
    setConversations((current) => {
      const exists = current.some((conversation) => conversation.id === nextConversation.id);
      const updated = exists
        ? current.map((conversation) => conversation.id === nextConversation.id ? nextConversation : conversation)
        : [nextConversation, ...current];
      return updated.sort((a, b) => b.updatedAt - a.updatedAt);
    });
    setActiveId(nextConversation.id);
  }

  function startNewChat() {
    const next = createConversation();
    upsertConversation(next);
    setInput("");
    setError("");
    setAttachedFiles([]);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  // File attachment handling
  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files || []);
    const validFiles = [];

    for (const file of selected) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setError("Tipo de ficheiro nao suportado. Apenas PNG, JPEG, WebP e PDF.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Ficheiro muito grande. Maximo 10MB.");
        continue;
      }
      validFiles.push(file);
    }

    setAttachedFiles((prev) => [...prev, ...validFiles].slice(0, 5)); // max 5 files
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachedFile(index) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function readFileAsBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  async function sendMessage(text = input) {
    const content = text.trim();
    if ((!content && attachedFiles.length === 0) || loading) return;

    setLoading(true);
    setError("");
    setInput("");

    // Read attached files as base64
    let filesData = [];
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        const dataUrl = await readFileAsBase64(file);
        filesData.push({
          name: file.name,
          type: file.type,
          data: dataUrl,
        });
      }
    }

    const base = activeConversation || createConversation(content || "Envio de ficheiro");
    const userMessage = {
      role: "user",
      content: content || "Analisa este(s) ficheiro(s)",
      files: filesData.length > 0 ? filesData : undefined,
    };
    const nextConversation = {
      ...base,
      title: base.messages.length ? base.title : (content || "Ficheiro").slice(0, 46),
      messages: [...base.messages, userMessage],
      updatedAt: Date.now(),
    };
    upsertConversation(nextConversation);
    setAttachedFiles([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: nextConversation.messages,
          files: filesData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel obter resposta.");
      }

      upsertConversation({
        ...nextConversation,
        messages: [...nextConversation.messages, data.message],
        updatedAt: Date.now(),
      });
    } catch (err) {
      setError(err.message);
      upsertConversation(nextConversation);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="chat-shell">
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <Link href="/" className="chat-logo">
            <img src="/eduka-logo.png" alt="Eduka" className="logo-img" />
            <span>Eduka</span>
          </Link>
          <button className="icon-button" onClick={startNewChat} aria-label="Nova conversa">
            +
          </button>
        </div>

        <button className="new-chat" onClick={startNewChat}>
          <span>+</span>
          Novo bate-papo
        </button>

        <nav className="chat-nav" aria-label="Navegacao do chat">
          <Link href="/chat" className="active">Conversas</Link>
          <Link href="/ferramentas">Ferramentas</Link>
          <Link href="/ferramentas/slides">Slides</Link>
          <Link href="/ferramentas/trabalho">Trabalhos</Link>
        </nav>

        <div className="recent-heading">Recentes</div>
        <div className="conversation-list">
          {conversations.length === 0 && (
            <p className="empty-recent">Sem conversas ainda.</p>
          )}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`conversation-item${conversation.id === activeId ? " selected" : ""}`}
              onClick={() => setActiveId(conversation.id)}
              title={conversation.title}
            >
              {conversation.title}
            </button>
          ))}
        </div>

        <div className="sidebar-account">
          <img src="/eduka-logo.png" alt="Eduka" className="avatar-img" />
          <div>
            <strong>Eduka</strong>
            <span>plano gratuito</span>
          </div>
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-topbar">
          <Link href="/ferramentas" className="back-panel">Painel</Link>
          <div className="plan-pill">Plano gratuito</div>
          <select
            className="model-select"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            aria-label="Escolher modelo"
          >
            {FREE_MODELS.map((item) => (
               <option key={item.id} value={item.id}>
                 {item.name} {item.vision ? "👁️" : ""}
               </option>
            ))}
          </select>
        </header>

        <div className="message-region" ref={scrollRef}>
          {activeMessages.length === 0 ? (
            <div className="empty-chat">
              <img src="/eduka-logo.png" alt="Eduka" className="eduka-logo-center" />
              <h1>{getGreeting()}, como estudamos hoje?</h1>
              <p>{fullDescription}</p>
            </div>
          ) : (
            <div className="messages">
              {activeMessages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
                  <div className="message-avatar">{message.role === "user" ? "TU" : "IA"}</div>
                  <div className="message-bubble">
                    {/* Show attached files preview */}
                    {message.files && message.files.length > 0 && (
                      <div className="message-files">
                        {message.files.map((file, fi) => (
                          <div key={fi} className="message-file-preview">
                            {file.type === "application/pdf" ? (
                              <span className="file-badge">📄 PDF: {file.name}</span>
                            ) : (
                              <img
                                src={file.data}
                                alt={file.name}
                                className="message-image"
                                style={{ maxWidth: "300px", maxHeight: "200px", borderRadius: "8px", marginBottom: "8px" }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.content}
                  </div>
                </article>
              ))}
              {loading && (
                <article className="message assistant">
                  <div className="message-avatar">IA</div>
                  <div className="message-bubble thinking">
                    <span></span><span></span><span></span>
                    A pensar com {selectedModel.name}
                  </div>
                </article>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {error && <div className="chat-error">{error}</div>}
          
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="attached-files-bar">
              {attachedFiles.map((file, i) => (
                <div key={i} className="attached-file-chip">
                  {file.type === "application/pdf" ? "📄" : "🖼️"}
                  <span className="attached-filename">{file.name}</span>
                  <button
                    className="attached-remove"
                    onClick={() => removeAttachedFile(i)}
                    aria-label="Remover ficheiro"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form className="composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <div className="composer-input-row">
              <button
                type="button"
                className="attach-btn"
                onClick={handleAttachClick}
                aria-label="Anexar ficheiro"
                title="Anexar imagem ou PDF"
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Como posso ajudar nos estudos hoje?"
                rows={1}
              />
            </div>
            <div className="composer-actions">
              <span className="model-caption">{selectedModel.name} {selectedModel.vision ? "(Visao Inclusa)" : ""}</span>
              <button type="submit" disabled={(!input.trim() && attachedFiles.length === 0) || loading} aria-label="Enviar mensagem">
                Enviar
              </button>
            </div>
          </form>
          <div className="quick-prompts">
            {starterPrompts.map((item) => (
              <button key={item.label} onClick={() => setInput(item.prompt)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .chat-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 304px minmax(0, 1fr);
          background: var(--bg-main);
          color: var(--text-main);
          overflow: hidden;
        }
        .chat-sidebar {
          height: 100vh;
          border-right: 1px solid var(--glass-border);
          background: var(--glass-bg);
          display: flex;
          flex-direction: column;
          padding: 18px 14px;
          gap: 16px;
        }
        .sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chat-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
        }
        .logo-img {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          object-fit: contain;
        }
        .avatar-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }
        .logo-mark,
        .avatar,
        .message-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #f4d35e;
          color: #101010;
          font-weight: 800;
        }
        .logo-mark {
          width: 34px;
          height: 34px;
          font-size: 16px;
        }
        .icon-button,
        .new-chat,
        .conversation-item,
        .quick-prompts button,
        .composer button {
          font: inherit;
          border: 0;
          cursor: pointer;
        }
        .icon-button {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--glass-bg);
          color: var(--text-main);
          font-size: 24px;
        }
        .new-chat {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 44px;
          padding: 0 12px;
          border-radius: 10px;
          background: transparent;
          color: var(--text-main);
          text-align: left;
          font-weight: 700;
        }
        .new-chat:hover,
        .chat-nav a:hover,
        .conversation-item:hover {
          background: var(--glass-bg);
        }
        .chat-nav {
          display: grid;
          gap: 4px;
        }
        .chat-nav a {
          padding: 10px 12px;
          border-radius: 10px;
          color: var(--text-main);
          font-weight: 600;
        }
        .chat-nav a.active {
          background: rgba(244, 211, 94, 0.1);
          color: #ffe7a4;
        }
        .recent-heading {
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .conversation-list {
          min-height: 0;
          overflow: auto;
          display: grid;
          gap: 4px;
          padding-right: 3px;
        }
        .conversation-item {
          width: 100%;
          min-height: 38px;
          padding: 8px 10px;
          border-radius: 9px;
          color: var(--text-main);
          background: transparent;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conversation-item.selected {
          background: var(--glass-bg);
        }
        .empty-recent {
          color: var(--text-muted);
          font-size: 13px;
          padding: 0 8px;
        }
        .sidebar-account {
          margin-top: auto;
          padding-top: 14px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 42px;
          height: 42px;
          font-size: 13px;
          background: #e9e2cf;
        }
        .eduka-logo-center {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          object-fit: contain;
          margin-bottom: 18px;
          box-shadow: 0 18px 50px rgba(230, 109, 67, 0.28);
        }
        .sidebar-account div {
          display: grid;
          line-height: 1.25;
        }
        .sidebar-account span:last-child {
          color: var(--text-muted);
          font-size: 13px;
        }
        .chat-main {
          height: 100vh;
          min-width: 0;
          display: grid;
          grid-template-rows: 70px minmax(0, 1fr) auto;
          position: relative;
        }
        .chat-topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          padding: 0 22px;
        }
        .back-panel {
          width: fit-content;
          color: var(--text-muted);
          font-size: 14px;
        }
        .plan-pill {
          justify-self: center;
          padding: 8px 12px;
          border-radius: 10px;
          background: var(--glass-bg);
          color: var(--text-muted);
          font-size: 14px;
        }
        .model-select {
          justify-self: end;
          min-width: 172px;
          height: 38px;
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          background: var(--glass-bg);
          color: var(--text-main);
          padding: 0 10px;
          outline: none;
        }
        .message-region {
          min-height: 0;
          overflow: auto;
          padding: 30px 20px 18px;
        }
        .empty-chat {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding-bottom: 70px;
        }
        .empty-chat h1 {
          font-size: clamp(32px, 4vw, 56px);
          font-weight: 500;
          color: var(--text-main);
          margin: 0;
          overflow-wrap: anywhere;
        }
        .empty-chat p {
          max-width: 520px;
          margin-top: 10px;
          color: var(--text-muted);
        }
        .messages {
          width: min(900px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 24px;
        }
        .message {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        .message.user {
          grid-template-columns: minmax(0, 1fr) 38px;
        }
        .message.user .message-avatar {
          grid-column: 2;
          grid-row: 1;
          background: #e9e2cf;
        }
        .message.user .message-bubble {
          grid-column: 1;
          justify-self: end;
          background: var(--glass-bg);
        }
        .message-avatar {
          width: 38px;
          height: 38px;
          font-size: 12px;
          background: #f4d35e;
        }
        .message-bubble {
          max-width: 760px;
          padding: 16px 18px;
          border-radius: 18px;
          background: var(--glass-bg);
          color: var(--text-main);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.68;
          border: 1px solid var(--glass-border);
        }
        .thinking {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }
        .thinking span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f4d35e;
          animation: bounceDot 1.2s infinite;
        }
        .thinking span:nth-child(2) {
          animation-delay: .15s;
        }
        .thinking span:nth-child(3) {
          animation-delay: .3s;
        }
        .composer-wrap {
          width: min(880px, calc(100% - 36px));
          margin: 0 auto 24px;
        }
        .chat-error {
          margin-bottom: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(220, 38, 38, 0.14);
          color: #fecaca;
          border: 1px solid rgba(248, 113, 113, 0.24);
        }
        .attached-files-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: var(--glass-bg);
          border-radius: 12px;
        }
        .attached-file-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--glass-bg);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 13px;
        }
        .attached-filename {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-main);
        }
        .attached-remove {
          background: none;
          border: none;
          color: #f87171;
          cursor: pointer;
          font-size: 14px;
          padding: 0 2px;
          line-height: 1;
        }
        .composer {
          min-height: 118px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 26px;
          padding: 18px;
          box-shadow: var(--shadow-lg);
        }
        .composer-input-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .attach-btn {
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          padding: 6px 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .attach-btn:hover {
          opacity: 1;
        }
        .composer textarea {
          width: 100%;
          min-height: 42px;
          max-height: 170px;
          resize: vertical;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-main);
          font: inherit;
          font-size: 17px;
          line-height: 1.55;
        }
        .composer textarea::placeholder {
          color: var(--text-muted);
        }
        .composer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 12px;
        }
        .model-caption {
          color: var(--text-muted);
          font-size: 13px;
        }
        .composer button {
          min-width: 86px;
          min-height: 38px;
          border-radius: 12px;
          background: #f4d35e;
          color: #181818;
          font-weight: 800;
        }
        .composer button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }
        .quick-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 12px;
        }
        .quick-prompts button {
          min-height: 34px;
          padding: 0 14px;
          border-radius: 10px;
          background: var(--glass-bg);
          color: var(--text-main);
          font-weight: 700;
        }
        .quick-prompts button:hover {
          background: var(--glass-border);
        }
        /* Image/file in messages */
        :global(.message-image) {
          display: block;
          max-width: 100%;
          border-radius: 8px;
        }
        :global(.file-badge) {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 6px;
        }
        @keyframes bounceDot {
          0%, 80%, 100% { opacity: .35; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }
        @media (max-width: 900px) {
          .chat-shell {
            grid-template-columns: 1fr;
          }
          .chat-sidebar {
            display: none;
          }
          .chat-topbar {
            grid-template-columns: auto 1fr;
            padding: 0 14px;
          }
          .plan-pill {
            display: none;
          }
          .model-select {
            min-width: 142px;
          }
          .message-region {
            padding: 18px 12px;
          }
          .message,
          .message.user {
            grid-template-columns: 32px minmax(0, 1fr);
          }
          .message.user .message-avatar,
          .message.user .message-bubble {
            grid-column: auto;
            grid-row: auto;
          }
          .message-avatar {
            width: 32px;
            height: 32px;
            font-size: 10px;
          }
          .composer-wrap {
            width: calc(100% - 20px);
            margin-bottom: 12px;
          }
          .empty-chat {
            padding-bottom: 20px;
          }
        }
      `}</style>
    </main>
  );
}
