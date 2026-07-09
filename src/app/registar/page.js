"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Client-side rate limiting
const REGISTER_ATTEMPTS_KEY = 'eduka_register_attempts';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutos

function getRegisterAttempts() {
  if (typeof window === 'undefined') return { count: 0, lockedUntil: 0 };
  try {
    const data = JSON.parse(localStorage.getItem(REGISTER_ATTEMPTS_KEY) || '{}');
    return { count: data.count || 0, lockedUntil: data.lockedUntil || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function recordFailedAttempt() {
  const data = getRegisterAttempts();
  const newCount = data.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : 0;
  localStorage.setItem(REGISTER_ATTEMPTS_KEY, JSON.stringify({
    count: newCount,
    lockedUntil,
  }));
  return { count: newCount, lockedUntil };
}

function resetAttempts() {
  localStorage.removeItem(REGISTER_ATTEMPTS_KEY);
}

export default function RegistarPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Verificar lockout ao carregar
  useEffect(() => {
    const { lockedUntil } = getRegisterAttempts();
    if (lockedUntil && Date.now() < lockedUntil) {
      setLockoutTime(lockedUntil - Date.now());
    }
  }, []);

  // Timer para lockout
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const timer = setInterval(() => {
      const remaining = lockoutTime - 1000;
      if (remaining <= 0) {
        setLockoutTime(0);
        clearInterval(timer);
      } else {
        setLockoutTime(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Validar password complexity
  function validatePassword(pw) {
    if (pw.length < 8) return "Palavra-passe deve ter pelo menos 8 caracteres.";
    if (!/[A-Z]/.test(pw)) return "Palavra-passe deve conter pelo menos uma maiúscula.";
    if (!/[0-9]/.test(pw)) return "Palavra-passe deve conter pelo menos um número.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pw)) return "Palavra-passe deve conter pelo menos um símbolo.";
    return null;
  }

  // Password strength indicator
  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*(),.?\":{}|<>]/.test(pw)) score++;
    
    if (score <= 2) return { level: 'fraca', color: '#ef4444', width: '33%' };
    if (score <= 3) return { level: 'média', color: '#f59e0b', width: '66%' };
    return { level: 'forte', color: '#22c55e', width: '100%' };
  }

  async function handleRegister(e) {
    e.preventDefault();

    // Verificar lockout
    const { lockedUntil } = getRegisterAttempts();
    if (lockedUntil && Date.now() < lockedUntil) {
      const minutes = Math.ceil((lockedUntil - Date.now()) / 60000);
      setError(`Conta bloqueada temporariamente. Tenta novamente em ${minutes} minutos.`);
      return;
    }

    setLoading(true);
    setError("");

    // Validar password
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nome,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      // Registar tentativa falhada
      const { count, lockedUntil } = recordFailedAttempt();

      if (lockedUntil) {
        setLockoutTime(lockedUntil - Date.now());
        setError("Demasiadas tentativas. Conta bloqueada por 30 minutos.");
      } else {
        if (authError.message.includes("already registered")) {
          setError("Este email já está registado. Tenta entrar.");
        } else {
          setError(authError.message);
        }
      }
      setLoading(false);
      return;
    }

    // Registo bem-sucedido — resetar tentativas
    resetAttempts();
    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleLogin() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  const isLocked = lockoutTime > 0;
  const lockoutMinutes = Math.ceil(lockoutTime / 60000);
  const passwordStrength = getPasswordStrength(password);

  if (success) {
    return (
      <>
        <Navbar />
        <div className="auth-page">
          <div className="auth-container glass-card animate-fade-in-up">
            <div className="auth-header">
              <div className="auth-icon">✉️</div>
              <h1>Verifica o teu email</h1>
              <p>
                Enviámos um link de confirmação para <strong>{email}</strong>.
                <br />
                Clica no link para activar a tua conta.
              </p>
            </div>
            <Link href="/login" className="btn btn-primary auth-submit">
              Ir para o Login
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-container glass-card animate-fade-in-up">
          <div className="auth-header">
            <div className="auth-icon">🚀</div>
            <h1>Cria a tua conta</h1>
            <p>Junta-te a milhares de estudantes angolanos</p>
          </div>

          {isLocked && (
            <div className="auth-error auth-locked">
              <span>🔒</span> Conta bloqueada. Tenta novamente em {lockoutMinutes} minuto{lockoutMinutes > 1 ? 's' : ''}.
            </div>
          )}

          {error && (
            <div className="auth-error" id="register-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="register-name">Nome completo</label>
              <input
                id="register-name"
                type="text"
                placeholder="O teu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="name"
                disabled={isLocked}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                placeholder="teu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLocked}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Palavra-passe</label>
              <div className="password-input-wrapper">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isLocked}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>
                    Força: {passwordStrength.level}
                  </span>
                </div>
              )}
              <small className="password-hint">Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 símbolo</small>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading || isLocked}
              id="register-submit"
            >
              {loading ? (
                <span className="auth-spinner">⏳ A criar conta...</span>
              ) : (
                "Criar conta grátis"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="btn auth-google"
            id="register-google"
            type="button"
            disabled={isLocked}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <p className="auth-switch">
            Já tens conta?{" "}
            <Link href="/login" id="link-to-login">
              Entra aqui
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
