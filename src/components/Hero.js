"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "./MagneticButton";

export default function Hero() {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const textLinesRef = useRef([]);
  const badgeRef = useRef(null);
  const descRef = useRef(null);
  const trustSignalsRef = useRef(null);
  const ctaRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    // Only run if not prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    // On mobile, skip heavy GSAP animations — they cause jank
    if (window.innerWidth < 768) return;

    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Initial state
    gsap.set(badgeRef.current, { y: -20, opacity: 0 });
    gsap.set(textLinesRef.current, { y: 40, opacity: 0, clipPath: "inset(100% 0 0 0)" });
    gsap.set(descRef.current, { y: 20, opacity: 0 });
    gsap.set(trustSignalsRef.current.children, { y: 20, opacity: 0, scale: 0.95 });
    gsap.set(ctaRef.current, { scale: 0.9, opacity: 0 });
    gsap.set(indicatorRef.current, { opacity: 0 });

    // Animation sequence
    tl.to(badgeRef.current, { y: 0, opacity: 1, duration: 0.8, delay: 0.2 })
      .to(textLinesRef.current, {
        y: 0,
        opacity: 1,
        clipPath: "inset(0% 0 0 0)",
        duration: 0.8,
        stagger: 0.15
      }, "-=0.4")
      .to(descRef.current, { y: 0, opacity: 1, duration: 0.8 }, "-=0.4")
      .to(trustSignalsRef.current.children, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.1
      }, "-=0.4")
      .to(ctaRef.current, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)" }, "-=0.2")
      .to(indicatorRef.current, { opacity: 0.7, duration: 1 }, "-=0.2");

    // Video Parallax effect
    gsap.to(videoRef.current, {
      y: "20%",
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Fade out indicator on scroll
    gsap.to(indicatorRef.current, {
      opacity: 0,
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "200px top",
        scrub: true
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section ref={heroRef} className="hero" id="hero">
      {/* Background Video */}
      <div className="hero-video-wrapper">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/universo123.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Overlay para legibilidade */}
      <div className="hero-overlay"></div>

      <div className="hero-content-wrapper">
        <div className="hero-left hero-liquid-glass-ui">
          <div ref={badgeRef} className="hero-badge ios-glass-badge">
            <span className="dot"></span>
            &quot;A imaginação é mais importante que o conhecimento.&quot; — Einstein
          </div>

          <div className="hero-liquid-text">
            <h1 className="liquid-line" ref={el => textLinesRef.current[0] = el}>
              <span className="ios-glass-text-block">Estuda melhor.</span>
            </h1>
            <h1 className="liquid-line" ref={el => textLinesRef.current[1] = el}>
              <span className="ios-glass-text-block">Produz mais.</span>
            </h1>
            <h1 className="liquid-line" ref={el => textLinesRef.current[2] = el}>
              <span className="ios-glass-text-block">Vai mais longe.</span>
            </h1>
          </div>

          <p ref={descRef} className="hero-description ios-glass-desc">
            Assistente académico com inteligência artificial. Organiza ideias,
            gera trabalhos de qualidade e explica temas complexos — tudo
            adaptado ao contexto angolano.
          </p>

          <div ref={trustSignalsRef} className="hero-trust-signals">
            <span className="trust-badge ios-glass-badge">
              <span className="trust-icon">⚡</span>
              Resposta em segundos
            </span>
            <span className="trust-badge ios-glass-badge">
              <span className="trust-icon">🎓</span>
              Nível universitário
            </span>
            <span className="trust-badge ios-glass-badge">
              <span className="trust-icon">🇦🇴</span>
              Feito em Angola
            </span>
          </div>

          <div className="hero-cta-row" ref={ctaRef}>
            <MagneticButton>
              <Link
                href="/ferramentas"
                className="btn btn-primary btn-lg ios-glass-btn-primary"
                id="cta-hero-primary"
              >
                <span className="btn-icon">🚀</span>
                Começar Agora — Grátis
              </Link>
            </MagneticButton>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div ref={indicatorRef} className="hero-scroll-indicator">
        <span className="text">Descobre mais</span>
        <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </section>
  );
}
