"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  
  // Track actual mouse position
  const mouse = useRef({ x: 0, y: 0 });
  
  // Track delayed follower position for lerp
  const delayedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only show on desktop
    if (window.innerWidth < 768) {
      setIsDesktop(false);
      return;
    }

    const onMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // Update dot immediately
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0, // instant
        });
      }
    };

    const xSet = gsap.quickSetter(followerRef.current, "x", "px");
    const ySet = gsap.quickSetter(followerRef.current, "y", "px");

    // RAF for smooth following
    const render = () => {
      // Lerp logic for the follower circle
      delayedMouse.current.x += (mouse.current.x - delayedMouse.current.x) * 0.15;
      delayedMouse.current.y += (mouse.current.y - delayedMouse.current.y) * 0.15;
      
      xSet(delayedMouse.current.x);
      ySet(delayedMouse.current.y);
      
      requestAnimationFrame(render);
    };
    
    // Start RAF
    const rafId = requestAnimationFrame(render);

    const onMouseOver = (e) => {
      const tag = e.target.tagName.toLowerCase();
      // Hide custom cursor over inputs for native text cursor
      if (tag === "input" || tag === "textarea" || tag === "select") {
        setIsHovering(false);
        if (cursorRef.current) cursorRef.current.style.opacity = "0";
        if (followerRef.current) followerRef.current.style.opacity = "0";
      } else if (
        tag === "a" ||
        tag === "button" ||
        e.target.closest("a") ||
        e.target.closest("button")
      ) {
        if (cursorRef.current) cursorRef.current.style.opacity = "1";
        if (followerRef.current) followerRef.current.style.opacity = "1";
        setIsHovering(true);
      } else {
        if (cursorRef.current) cursorRef.current.style.opacity = "1";
        if (followerRef.current) followerRef.current.style.opacity = "1";
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor-dot"
        style={{
          transform: `translate(-50%, -50%) scale(${isHovering ? 0 : 1})`,
        }}
      />
      <div
        ref={followerRef}
        className={`custom-cursor-circle ${isHovering ? "is-glass" : ""}`}
        style={{
          transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`,
          borderColor: isHovering ? "rgba(37, 99, 235, 0.5)" : "var(--glass-border)"
        }}
      />
      <style jsx global>{`
        .custom-cursor-dot {
          position: fixed;
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          background-color: var(--blue-400);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transition: transform 0.15s ease-out;
          mix-blend-mode: difference;
        }
        .custom-cursor-circle {
          position: fixed;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          background-color: transparent;
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          transition: transform 0.2s ease-out, background-color 0.2s ease, border-color 0.2s ease, backdrop-filter 0.2s ease;
        }
        /* Orbe de liquid glass ao passar sobre links/botões */
        .custom-cursor-circle.is-glass {
          background-color: rgba(37, 99, 235, 0.12);
          backdrop-filter: saturate(180%) blur(8px);
          -webkit-backdrop-filter: saturate(180%) blur(8px);
          box-shadow: inset 0 0 0 1px var(--glass-border);
        }
        /* Garantir que há cursor nos botões para a UX ser correta */
        a, button, select {
          cursor: pointer;
        }
        input, textarea {
          cursor: text;
        }
      `}</style>
    </>
  );
}
