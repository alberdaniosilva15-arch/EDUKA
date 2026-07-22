"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();

    // Listener para mudancas na autenticacao
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Logout] Falha ao encerrar sessão:", error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <span className="gradient-text">🎓</span>
          <span>Eduka</span>
        </Link>

        <ul className={`navbar-links ${mobileOpen ? "mobile-open" : ""}`}>
          <li>
            <Link href="/#funcionalidades" className="ios-glass-nav-link">Ferramentas</Link>
          </li>
          <li>
            <Link href="/chat" className="ios-glass-nav-link">Chat Eduka</Link>
          </li>
          <li>
            <Link href="/#precos" className="ios-glass-nav-link">Preços</Link>
          </li>
          {user && (
            <li>
              <Link href="/ferramentas" className="navbar-tools-link">Painel</Link>
            </li>
          )}
        </ul>

        <div className="navbar-cta">
          <ThemeToggle />
          {!loading && (
            <>
              {user ? (
                <button onClick={handleLogout} className="btn btn-ghost">
                  Sair
                </button>
              ) : (
                <div className="cat-cta-wrapper">
                  <div className="cat-arm" aria-hidden="true">
                    <div className="cat-forearm">
                      <div className="cat-paw-pads" />
                    </div>
                  </div>
                
                  <Link
                    href="/registar"
                    className="btn liquid-metal-btn"
                    id="cta-navbar"
                  >
                    Começar grátis
                  </Link>
                </div>
              )}
            </>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <Link href="/#funcionalidades" onClick={() => setMobileOpen(false)}>Ferramentas</Link>
            <Link href="/chat" onClick={() => setMobileOpen(false)}>Chat Eduka</Link>
            <Link href="/#precos" onClick={() => setMobileOpen(false)}>Preços</Link>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {user ? (
                <>
                  <Link href="/ferramentas" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
                    Painel
                  </Link>
                  <button onClick={handleLogout} className="btn">
                    Sair
                  </button>
                </>
              ) : (
                <div className="cat-cta-wrapper">
                  <div className="cat-arm" aria-hidden="true">
                    <div className="cat-forearm">
                      <div className="cat-paw-pads" />
                    </div>
                  </div>
                
                  <Link
                    href="/registar"
                    className="btn liquid-metal-btn"
                    onClick={() => setMobileOpen(false)}
                  >
                    Começar grátis
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
