"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Client-side rate limiting (anti-brute force)
const LOGIN_ATTEMPTS_KEY = 'eduka_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

function getLoginAttempts() {
  if (typeof window === 'undefined') return { count: 0, lockedUntil: 0 };
  try {
    const data = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    return { count: data.count || 0, lockedUntil: data.lockedUntil || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function recordFailedAttempt() {
  const data = getLoginAttempts();
  const newCount = data.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : 0;
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({
    count: newCount,
    lockedUntil,
  }));
  return { count: newCount, lockedUntil };
}

function resetAttempts() {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/ferramentas";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState("email"); // "email" ou "phone"
  const [step, setStep] = useState(1); // 1: inserir dados, 2: inserir OTP (apenas phone)
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockoutTime, setLockoutTime] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Verificar lockout ao carregar
  useEffect(() => {
    const { count, lockedUntil } = getLoginAttempts();
    setAttempts(count);
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
        setAttempts(0);
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
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();

    // Verificar lockout
    const { lockedUntil } = getLoginAttempts();
    if (lockedUntil && Date.now() < lockedUntil) {
      const minutes = Math.ceil((lockedUntil - Date.now()) / 60000);
      setError(`Conta bloqueada temporariamente. Tenta novamente em ${minutes} minutos.`);
      return;
    }

    setLoading(true);
    setError("");

    // Validar password se for email
    if (loginMethod === "email") {
      const pwError = validatePassword(password);
      if (pwError) {
        setError(pwError);
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();

    if (loginMethod === "email") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Registar tentativa falhada
        const { count, lockedUntil } = recordFailedAttempt();
        setAttempts(count);

        if (lockedUntil) {
          setLockoutTime(lockedUntil - Date.now());
          setError("Demasiadas tentativas. Conta bloqueada por 15 minutos.");
        } else {
          const remaining = MAX_ATTEMPTS - count;
          setError(
            authError.message === "Invalid login credentials"
              ? `Email ou palavra-passe incorrectos. (${remaining} tentativas restantes)`
              : authError.message
          );
        }
        setLoading(false);
        return;
      }

      // Login bem-sucedido — resetar tentativas
      resetAttempts();
      router.push(redirectTo);
      router.refresh();
    } else if (loginMethod === "phone") {
      if (step === 1) {
        // Enviar OTP para o telefone
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: phone,
        });

        if (otpError) {
          setError(otpError.message);
          setLoading(false);
          return;
        }

        setStep(2);
        setLoading(false);
      } else if (step === 2) {
        // Verificar OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
          phone: phone,
          token: otp,
          type: 'sms',
        });

        if (verifyError) {
          setError("Código inválido. Tenta novamente.");
          setLoading(false);
          return;
        }

        // Login bem-sucedido — resetar tentativas
        resetAttempts();
        router.push(redirectTo);
        router.refresh();
      }
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
      },
    });
  }

  const isLocked = lockoutTime > 0;
  const lockoutMinutes = Math.ceil(lockoutTime / 60000);

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-container glass-card animate-fade-in-up">
          <div className="auth-header">
            <div className="auth-icon">🎓</div>
            <h1>Bem-vindo de volta</h1>
            <p>Entra na tua conta para continuar a estudar</p>
          </div>

          {isLocked && (
            <div className="auth-error auth-locked">
              <span>🔒</span> Conta bloqueada. Tenta novamente em {lockoutMinutes} minuto{lockoutMinutes > 1 ? 's' : ''}.
            </div>
          )}

          {error && (
            <div className="auth-error" id="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {step === 1 && (
            <div className="auth-methods-toggle" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                className={`btn ${loginMethod === 'email' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setLoginMethod('email'); setError(""); }}
                style={{ flex: 1 }}
              >
                Email
              </button>
              <button 
                type="button" 
                className={`btn ${loginMethod === 'phone' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setLoginMethod('phone'); setError(""); }}
                style={{ flex: 1 }}
              >
                Telemóvel
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            {loginMethod === "email" ? (
              <>
                <div className="form-group">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
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
                  <label htmlFor="login-password">Palavra-passe</label>
                  <div className="password-input-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="current-password"
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
                  <small className="password-hint">Mínimo 8 caracteres, 1 maiúscula, 1 número</small>
                </div>
              </>
            ) : (
              <>
                {step === 1 ? (
                  <div className="form-group">
                    <label htmlFor="login-phone">Número de Telemóvel</label>
                    <input
                      id="login-phone"
                      type="tel"
                      placeholder="+351912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      disabled={isLocked}
                    />
                    <small className="password-hint">Inclui o indicativo do país (ex: +351 para Portugal)</small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="login-otp">Código de Verificação (SMS)</label>
                    <input
                      id="login-otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={isLocked}
                    />
                    <small className="password-hint">Insere o código que recebeste por SMS</small>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginTop: '10px', padding: 0 }}
                    >
                      Alterar número de telemóvel
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading || isLocked}
              id="login-submit"
            >
              {loading ? (
                <span className="auth-spinner">⏳ A processar...</span>
              ) : (
                loginMethod === "phone" && step === 1 ? "Enviar Código por SMS" : "Entrar"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="btn auth-google"
            id="login-google"
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
            Não tens conta?{" "}
            <Link href="/registar" id="link-to-register">
              Cria uma agora
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
