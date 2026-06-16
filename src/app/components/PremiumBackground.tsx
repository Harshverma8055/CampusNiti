'use client';

import { useEffect, useRef, useCallback } from 'react';

/*
  PREMIUM BACKGROUND — Clean, Professional, Subtle
  Features:
  - Soft animated gradient orbs (CSS-driven, no canvas)
  - Fine dot-grid pattern for depth
  - Gentle magnetic cursor glow that follows the mouse
  - Subtle grain overlay for texture
  - Performant: uses CSS transforms + GPU-accelerated animations
*/

export default function PremiumBackground() {
    const glowRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const mouseRef = useRef({ x: -200, y: -200 });
    const currentRef = useRef({ x: -200, y: -200 });

    const animate = useCallback(() => {
        // Smooth interpolation for cursor glow
        currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.08;
        currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.08;

        if (glowRef.current) {
            glowRef.current.style.transform = `translate(${currentRef.current.x - 200}px, ${currentRef.current.y - 200}px)`;
        }

        rafRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const onMouse = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };
        const onLeave = () => {
            mouseRef.current.x = -200;
            mouseRef.current.y = -200;
        };

        window.addEventListener('mousemove', onMouse);
        window.addEventListener('mouseleave', onLeave);
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('mousemove', onMouse);
            window.removeEventListener('mouseleave', onLeave);
        };
    }, [animate]);

    return (
        <div className="premium-bg" aria-hidden="true">
            {/* Gradient Orbs — soft, slow-moving blurs */}
            <div className="premium-bg__orb premium-bg__orb--1" />
            <div className="premium-bg__orb premium-bg__orb--2" />
            <div className="premium-bg__orb premium-bg__orb--3" />
            <div className="premium-bg__orb premium-bg__orb--4" />

            {/* Fine dot grid */}
            <div className="premium-bg__grid" />

            {/* Noise/grain texture */}
            <div className="premium-bg__noise" />

            {/* Subtle horizontal glow line */}
            <div className="premium-bg__accent-line" />

            {/* Magnetic cursor glow */}
            <div ref={glowRef} className="premium-bg__cursor-glow" />
        </div>
    );
}
