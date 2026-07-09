"use client";

import { useEffect, useRef } from "react";

export default function ParticlesWebGL() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Mouse interaction
    let mouse = { x: null, y: null, radius: 150 };

    const init = () => {
      canvas.width = width;
      canvas.height = height;
      particles = [];
      const numberOfParticles = Math.min((width * height) / 15000, 100);
      
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 1;
        const speedX = (Math.random() - 0.5) * 0.5;
        const speedY = (Math.random() - 0.5) * 0.5;
        particles.push({ x, y, size, speedX, speedY, baseSpeedX: speedX, baseSpeedY: speedY });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // Interaction
        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - p.x;
          let dy = mouse.y - p.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouse.radius;
            const force = (maxDistance - distance) / maxDistance;
            const directionX = forceDirectionX * force * 2;
            const directionY = forceDirectionY * force * 2;
            
            p.x -= directionX;
            p.y -= directionY;
          }
        }
        
        // Move
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Bounce
        if (p.x > width || p.x < 0) p.speedX *= -1;
        if (p.y > height || p.y < 0) p.speedY *= -1;
        
        ctx.fillStyle = "rgba(34, 211, 238, 0.4)"; // Cyan
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Connections
        for (let j = i; j < particles.length; j++) {
          let p2 = particles[j];
          let dx = p.x - p2.x;
          let dy = p.y - p2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.strokeStyle = `rgba(37, 99, 235, ${1 - dist/100})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };
    
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    init();
    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 0
      }} 
    />
  );
}
