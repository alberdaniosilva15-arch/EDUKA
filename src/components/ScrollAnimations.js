"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollAnimations() {
  useEffect(() => {
    // Only run if not prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      const revealElements = document.querySelectorAll(".reveal-on-scroll");
      revealElements.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const revealElements = document.querySelectorAll(".reveal-on-scroll");

    revealElements.forEach((el) => {
      const delay = el.getAttribute("data-delay") ? parseInt(el.getAttribute("data-delay")) / 1000 : 0;
      const direction = el.getAttribute("data-direction");
      
      let startX = 0;
      let startY = 30;
      
      if (direction === "left") { startX = -50; startY = 0; }
      else if (direction === "right") { startX = 50; startY = 0; }
      
      gsap.fromTo(el, 
        { 
          opacity: 0, 
          x: startX,
          y: startY 
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          delay: delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%", // Starts animation when top of element is at 85% of viewport height
            once: true, // Only animate once
          }
        }
      );
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return null;
}
