'use client';

import { useEffect, useRef } from 'react';

/*
  LOGIN BACKGROUND — DEEP SPACE NEBULA WITH STARS
  Cleaner, more cinematic: slow-drifting colorful nebula clouds, 
  twinkling stars at different depths, soft pulsing core, 
  gentle magnetic cursor interaction
*/

export default function LoginBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        let w = window.innerWidth;
        let h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;

        const mouse = { x: w / 2, y: h / 2, active: false };

        // === DEEP STARS (3 depth layers) ===
        interface Star {
            x: number; y: number; size: number; alpha: number;
            twinkle: number; twinkleSpeed: number; depth: number;
        }
        const stars: Star[] = [];
        for (let i = 0; i < 300; i++) {
            const depth = Math.random();
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.3 + depth * 2,
                alpha: 0.2 + depth * 0.6,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.01 + Math.random() * 0.04,
                depth,
            });
        }

        // === NEBULA CLOUDS ===
        interface Nebula {
            x: number; y: number; radius: number;
            color1: number[]; color2: number[];
            driftX: number; driftY: number;
            breathPhase: number; breathSpeed: number;
        }
        const nebulae: Nebula[] = [
            { x: w * 0.25, y: h * 0.35, radius: 300, color1: [99, 102, 241], color2: [139, 92, 246], driftX: 0.15, driftY: 0.08, breathPhase: 0, breathSpeed: 0.003 },
            { x: w * 0.75, y: h * 0.25, radius: 250, color1: [16, 185, 129], color2: [14, 165, 233], driftX: -0.12, driftY: 0.1, breathPhase: 1.5, breathSpeed: 0.004 },
            { x: w * 0.6, y: h * 0.7, radius: 280, color1: [168, 85, 247], color2: [244, 63, 94], driftX: 0.1, driftY: -0.06, breathPhase: 3, breathSpeed: 0.002 },
            { x: w * 0.15, y: h * 0.75, radius: 200, color1: [59, 130, 246], color2: [16, 185, 129], driftX: 0.08, driftY: 0.12, breathPhase: 4.5, breathSpeed: 0.005 },
            { x: w * 0.5, y: h * 0.4, radius: 350, color1: [139, 92, 246], color2: [99, 102, 241], driftX: -0.05, driftY: -0.03, breathPhase: 2, breathSpeed: 0.002 },
        ];

        // === SHOOTING STARS ===
        interface Shooter {
            x: number; y: number; vx: number; vy: number;
            life: number; maxLife: number; size: number;
        }
        const shooters: Shooter[] = [];
        let shootTimer = 0;

        // === PULSING CORE (center glow) ===
        let corePhase = 0;

        // === FLOATING LIGHT WISPS ===
        interface Wisp {
            x: number; y: number; vx: number; vy: number;
            size: number; color: string; alpha: number; life: number;
        }
        const wisps: Wisp[] = [];
        for (let i = 0; i < 15; i++) {
            const colors = ['99,102,241', '139,92,246', '16,185,129', '168,85,247', '14,165,233'];
            wisps.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: 30 + Math.random() * 60,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 0.03 + Math.random() * 0.05,
                life: Math.random() * Math.PI * 2,
            });
        }

        let time = 0;

        function animate() {
            time += 0.016;
            shootTimer -= 0.016;
            corePhase += 0.008;
            ctx.clearRect(0, 0, w, h);

            // === NEBULA CLOUDS ===
            nebulae.forEach(n => {
                n.breathPhase += n.breathSpeed;
                n.x += n.driftX;
                n.y += n.driftY;
                // Wrap around
                if (n.x > w + n.radius) n.x = -n.radius;
                if (n.x < -n.radius) n.x = w + n.radius;
                if (n.y > h + n.radius) n.y = -n.radius;
                if (n.y < -n.radius) n.y = h + n.radius;

                const breathe = 1 + 0.12 * Math.sin(n.breathPhase);
                const r = n.radius * breathe;

                // Layer 1 — outer glow
                const g1 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
                g1.addColorStop(0, `rgba(${n.color1[0]},${n.color1[1]},${n.color1[2]}, 0.07)`);
                g1.addColorStop(0.4, `rgba(${n.color2[0]},${n.color2[1]},${n.color2[2]}, 0.035)`);
                g1.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.fillStyle = g1;
                ctx.fill();

                // Layer 2 — bright core
                const g2 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 0.4);
                g2.addColorStop(0, `rgba(${n.color1[0]},${n.color1[1]},${n.color1[2]}, 0.06)`);
                g2.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = g2;
                ctx.fill();
            });

            // === FLOATING WISPS ===
            wisps.forEach(wi => {
                wi.life += 0.01;
                wi.x += wi.vx;
                wi.y += wi.vy;
                if (wi.x < -wi.size) wi.x = w + wi.size;
                if (wi.x > w + wi.size) wi.x = -wi.size;
                if (wi.y < -wi.size) wi.y = h + wi.size;
                if (wi.y > h + wi.size) wi.y = -wi.size;

                const a = wi.alpha * (0.5 + 0.5 * Math.sin(wi.life));
                const g = ctx.createRadialGradient(wi.x, wi.y, 0, wi.x, wi.y, wi.size);
                g.addColorStop(0, `rgba(${wi.color}, ${a})`);
                g.addColorStop(1, `rgba(${wi.color}, 0)`);
                ctx.beginPath();
                ctx.arc(wi.x, wi.y, wi.size, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            });

            // === STARS WITH TWINKLING ===
            stars.forEach(s => {
                s.twinkle += s.twinkleSpeed;
                const a = s.alpha * (0.4 + 0.6 * Math.sin(s.twinkle));

                // Parallax from mouse
                let px = s.x;
                let py = s.y;
                if (mouse.active) {
                    const parallax = s.depth * 8;
                    px += (mouse.x - w / 2) * parallax / w * -1;
                    py += (mouse.y - h / 2) * parallax / h * -1;
                }

                // Tiny glow for bigger stars
                if (s.size > 1.2) {
                    const sg = ctx.createRadialGradient(px, py, 0, px, py, s.size * 4);
                    sg.addColorStop(0, `rgba(180, 190, 255, ${a * 0.2})`);
                    sg.addColorStop(1, 'rgba(180, 190, 255, 0)');
                    ctx.beginPath();
                    ctx.arc(px, py, s.size * 4, 0, Math.PI * 2);
                    ctx.fillStyle = sg;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(px, py, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(220, 225, 255, ${a})`;
                ctx.fill();
            });

            // === CENTER PULSING CORE ===
            const corePulse = 0.6 + 0.4 * Math.sin(corePhase);
            const coreR = 120 * corePulse;
            const coreG = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, coreR);
            coreG.addColorStop(0, `rgba(99, 102, 241, ${0.06 * corePulse})`);
            coreG.addColorStop(0.5, `rgba(139, 92, 246, ${0.03 * corePulse})`);
            coreG.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, coreR, 0, Math.PI * 2);
            ctx.fillStyle = coreG;
            ctx.fill();

            // === SHOOTING STARS ===
            if (shootTimer <= 0) {
                const startX = Math.random() * w * 0.6 + w * 0.2;
                const angle = Math.PI * 0.15 + Math.random() * 0.3;
                const speed = 6 + Math.random() * 6;
                shooters.push({
                    x: startX, y: -10,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0, maxLife: 0.6 + Math.random() * 0.6,
                    size: 1.5 + Math.random() * 1.5,
                });
                shootTimer = 3 + Math.random() * 5;
            }
            for (let i = shooters.length - 1; i >= 0; i--) {
                const s = shooters[i];
                s.life += 0.016;
                if (s.life >= s.maxLife) { shooters.splice(i, 1); continue; }
                s.x += s.vx;
                s.y += s.vy;
                const fade = 1 - (s.life / s.maxLife);
                // Trail
                const trailLen = 60;
                const grad = ctx.createLinearGradient(
                    s.x, s.y,
                    s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * trailLen,
                    s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * trailLen
                );
                grad.addColorStop(0, `rgba(255, 255, 255, ${fade * 0.8})`);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(
                    s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * trailLen,
                    s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * trailLen
                );
                ctx.strokeStyle = grad;
                ctx.lineWidth = s.size;
                ctx.stroke();
                // Head glow
                const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
                hg.addColorStop(0, `rgba(255, 255, 255, ${fade * 0.6})`);
                hg.addColorStop(1, 'rgba(200, 200, 255, 0)');
                ctx.beginPath();
                ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = hg;
                ctx.fill();
            }

            // === MAGNETIC CURSOR GLOW ===
            if (mouse.active) {
                const curGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
                curGlow.addColorStop(0, 'rgba(99, 102, 241, 0.06)');
                curGlow.addColorStop(0.4, 'rgba(139, 92, 246, 0.025)');
                curGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2);
                ctx.fillStyle = curGlow;
                ctx.fill();

                // Orbiting sparkles
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 * i) / 6 + time * 0.8;
                    const r = 35 + 12 * Math.sin(time * 2 + i * 1.2);
                    const sparkA = 0.3 + 0.2 * Math.sin(time * 3 + i);
                    ctx.beginPath();
                    ctx.arc(mouse.x + Math.cos(a) * r, mouse.y + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(180, 170, 255, ${sparkA})`;
                    ctx.fill();
                }
            }

            animRef.current = requestAnimationFrame(animate);
        }

        const onMouse = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
        const onLeave = () => { mouse.active = false; };
        const onResize = () => {
            w = window.innerWidth; h = window.innerHeight;
            canvas.width = w; canvas.height = h;
        };
        window.addEventListener('mousemove', onMouse);
        window.addEventListener('mouseleave', onLeave);
        window.addEventListener('resize', onResize);
        animate();

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('mousemove', onMouse);
            window.removeEventListener('mouseleave', onLeave);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="bg-canvas" />;
}
