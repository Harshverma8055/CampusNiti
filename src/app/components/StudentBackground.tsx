'use client';

import { useEffect, useRef } from 'react';

/*
  STUDENT BACKGROUND — GALAXY / NEBULA / GROWTH
  Features: spiral galaxy rotation, nebula clouds, shooting stars,
  aurora waves, rising energy trails, gravitational cursor lensing
*/

export default function StudentBackground() {
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

        // === GALAXY SPIRAL STARS ===
        interface GalaxyStar {
            angle: number; dist: number; speed: number; size: number;
            color: string; alpha: number; arm: number;
        }
        const galaxyStars: GalaxyStar[] = [];
        const starColors = ['139,92,246', '168,85,247', '245,158,11', '16,185,129', '99,102,241', '244,63,94', '14,165,233'];
        for (let i = 0; i < 250; i++) {
            const arm = Math.floor(Math.random() * 3);
            const armOffset = (arm / 3) * Math.PI * 2;
            galaxyStars.push({
                angle: armOffset + Math.random() * 2,
                dist: 30 + Math.random() * Math.max(w, h) * 0.45,
                speed: 0.001 + Math.random() * 0.003,
                size: 0.5 + Math.random() * 2.5,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                alpha: 0.15 + Math.random() * 0.6,
                arm,
            });
        }

        // === NEBULA CLOUDS ===
        interface Nebula {
            x: number; y: number; radius: number; color1: string;
            color2: string; phase: number; phaseSpeed: number;
        }
        const nebulae: Nebula[] = [
            { x: w * 0.2, y: h * 0.3, radius: 200, color1: '139,92,246', color2: '99,102,241', phase: 0, phaseSpeed: 0.003 },
            { x: w * 0.75, y: h * 0.6, radius: 180, color1: '16,185,129', color2: '14,165,233', phase: 1, phaseSpeed: 0.004 },
            { x: w * 0.5, y: h * 0.15, radius: 150, color1: '168,85,247', color2: '244,63,94', phase: 2, phaseSpeed: 0.002 },
            { x: w * 0.85, y: h * 0.2, radius: 120, color1: '245,158,11', color2: '139,92,246', phase: 3, phaseSpeed: 0.005 },
        ];

        // === SHOOTING STARS ===
        interface ShootingStar {
            x: number; y: number; vx: number; vy: number; size: number;
            life: number; maxLife: number; trail: { x: number; y: number }[];
        }
        const shooters: ShootingStar[] = [];
        let shootCooldown = 0;

        // === AURORA WAVES ===
        interface Aurora {
            yBase: number; amplitude: number; frequency: number;
            speed: number; phase: number; color: string; alpha: number;
        }
        const auroras: Aurora[] = [
            { yBase: h * 0.82, amplitude: 40, frequency: 0.006, speed: 0.008, phase: 0, color: '139,92,246', alpha: 0.06 },
            { yBase: h * 0.86, amplitude: 30, frequency: 0.008, speed: 0.006, phase: 1, color: '16,185,129', alpha: 0.05 },
            { yBase: h * 0.78, amplitude: 50, frequency: 0.004, speed: 0.01, phase: 2, color: '99,102,241', alpha: 0.04 },
        ];

        // === ENERGY TRAILS (rising) ===
        interface ETrail {
            x: number; y: number; speed: number; size: number; color: string;
            alpha: number; wobFreq: number; wobAmp: number; wobPhase: number;
            trail: { x: number; y: number; a: number }[];
        }
        const eTrails: ETrail[] = [];
        for (let i = 0; i < 20; i++) {
            eTrails.push({
                x: Math.random() * w, y: h + Math.random() * 200,
                speed: 0.5 + Math.random() * 1.2,
                size: 2 + Math.random() * 3,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                alpha: 0.2 + Math.random() * 0.4,
                wobFreq: 0.01 + Math.random() * 0.02,
                wobAmp: 10 + Math.random() * 30,
                wobPhase: Math.random() * Math.PI * 2,
                trail: [],
            });
        }

        // === CURSOR GRAVITATIONAL LENSING PARTICLES ===
        interface LensP {
            angle: number; dist: number; speed: number;
        }
        const lens: LensP[] = [];
        for (let i = 0; i < 20; i++) {
            lens.push({
                angle: (Math.PI * 2 * i) / 20,
                dist: 40 + Math.random() * 50,
                speed: 0.02 + Math.random() * 0.03,
            });
        }

        const galCx = () => w * 0.55;
        const galCy = () => h * 0.4;
        let time = 0;

        function animate() {
            time += 0.016;
            shootCooldown -= 0.016;
            ctx.clearRect(0, 0, w, h);

            // === NEBULA CLOUDS ===
            nebulae.forEach(n => {
                n.phase += n.phaseSpeed;
                const breathe = 1 + 0.15 * Math.sin(n.phase);
                const r = n.radius * breathe;
                const nx = n.x + Math.sin(n.phase * 0.7) * 20;
                const ny = n.y + Math.cos(n.phase * 0.5) * 15;
                const g1 = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
                g1.addColorStop(0, `rgba(${n.color1}, 0.05)`);
                g1.addColorStop(0.4, `rgba(${n.color2}, 0.025)`);
                g1.addColorStop(1, `rgba(0,0,0,0)`);
                ctx.beginPath();
                ctx.arc(nx, ny, r, 0, Math.PI * 2);
                ctx.fillStyle = g1;
                ctx.fill();
            });

            // === AURORA WAVES ===
            auroras.forEach(a => {
                a.phase += a.speed;
                ctx.beginPath();
                ctx.moveTo(0, h);
                for (let x = 0; x <= w; x += 4) {
                    const y = a.yBase
                        + Math.sin(x * a.frequency + a.phase) * a.amplitude
                        + Math.sin(x * a.frequency * 1.7 + a.phase * 1.3) * a.amplitude * 0.4;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(w, h);
                ctx.closePath();
                const grad = ctx.createLinearGradient(0, a.yBase - a.amplitude * 1.5, 0, h);
                grad.addColorStop(0, `rgba(${a.color}, ${a.alpha})`);
                grad.addColorStop(0.5, `rgba(${a.color}, ${a.alpha * 0.3})`);
                grad.addColorStop(1, `rgba(${a.color}, 0)`);
                ctx.fillStyle = grad;
                ctx.fill();
            });

            // === GALAXY SPIRAL ROTATION ===
            const gcx = galCx();
            const gcy = galCy();
            galaxyStars.forEach(s => {
                s.angle += s.speed;
                const spiralWind = s.dist * 0.003;
                const ang = s.angle + spiralWind;
                let px = gcx + Math.cos(ang) * s.dist;
                let py = gcy + Math.sin(ang) * s.dist * 0.55; // elliptical

                // GRAVITATIONAL CURSOR — attract
                if (mouse.active) {
                    const dx = px - mouse.x;
                    const dy = py - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        const force = (1 - dist / 200) * 35;
                        px -= (dx / dist) * force;
                        py -= (dy / dist) * force;
                    }
                }

                // Glow
                const glow = ctx.createRadialGradient(px, py, 0, px, py, s.size * 5);
                glow.addColorStop(0, `rgba(${s.color}, ${s.alpha * 0.25})`);
                glow.addColorStop(1, `rgba(${s.color}, 0)`);
                ctx.beginPath();
                ctx.arc(px, py, s.size * 5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(px, py, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
                ctx.fill();
            });

            // Galaxy core glow
            const coreGlow = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, 80);
            coreGlow.addColorStop(0, 'rgba(168, 85, 247, 0.12)');
            coreGlow.addColorStop(0.3, 'rgba(139, 92, 246, 0.05)');
            coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(gcx, gcy, 80, 0, Math.PI * 2);
            ctx.fillStyle = coreGlow;
            ctx.fill();

            // === ENERGY TRAILS (rising) ===
            eTrails.forEach(t => {
                t.wobPhase += t.wobFreq;
                t.y -= t.speed;
                t.x += Math.sin(t.wobPhase) * t.wobAmp * 0.02;

                t.trail.push({ x: t.x, y: t.y, a: t.alpha });
                if (t.trail.length > 25) t.trail.shift();

                if (t.y < -30) {
                    t.y = h + 30;
                    t.x = Math.random() * w;
                    t.trail = [];
                }

                // Trail
                for (let i = 0; i < t.trail.length; i++) {
                    const tp = t.trail[i];
                    const ta = tp.a * (i / t.trail.length) * 0.2;
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, t.size * (i / t.trail.length) * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${t.color}, ${ta})`;
                    ctx.fill();
                }

                // Core
                const glow = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.size * 4);
                glow.addColorStop(0, `rgba(${t.color}, ${t.alpha * 0.3})`);
                glow.addColorStop(1, `rgba(${t.color}, 0)`);
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${t.color}, ${t.alpha})`;
                ctx.fill();
            });

            // === SHOOTING STARS ===
            if (shootCooldown <= 0) {
                const angle = -0.3 - Math.random() * 0.7;
                const speed = 5 + Math.random() * 8;
                shooters.push({
                    x: Math.random() * w * 0.8 + w * 0.1,
                    y: Math.random() * h * 0.3,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed * -1,
                    size: 2 + Math.random() * 2,
                    life: 0, maxLife: 0.5 + Math.random() * 0.8,
                    trail: [],
                });
                shootCooldown = 2 + Math.random() * 4;
            }
            for (let i = shooters.length - 1; i >= 0; i--) {
                const s = shooters[i];
                s.life += 0.016;
                if (s.life >= s.maxLife) { shooters.splice(i, 1); continue; }
                s.x += s.vx;
                s.y -= s.vy;
                s.trail.push({ x: s.x, y: s.y });
                if (s.trail.length > 20) s.trail.shift();

                const fade = 1 - s.life / s.maxLife;
                // Trail
                for (let j = 0; j < s.trail.length; j++) {
                    const t = s.trail[j];
                    const ta = fade * (j / s.trail.length) * 0.4;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, s.size * (j / s.trail.length), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(245, 158, 11, ${ta})`;
                    ctx.fill();
                }
                // Head
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.8})`;
                ctx.fill();
                // Head glow
                const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 6);
                hg.addColorStop(0, `rgba(245, 158, 11, ${fade * 0.3})`);
                hg.addColorStop(1, 'rgba(245, 158, 11, 0)');
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 6, 0, Math.PI * 2);
                ctx.fillStyle = hg;
                ctx.fill();
            }

            // === CURSOR GRAVITATIONAL LENSING ===
            if (mouse.active) {
                // Gravity well glow
                const wellGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 130);
                wellGlow.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
                wellGlow.addColorStop(0.3, 'rgba(168, 85, 247, 0.04)');
                wellGlow.addColorStop(0.7, 'rgba(99, 102, 241, 0.02)');
                wellGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 130, 0, Math.PI * 2);
                ctx.fillStyle = wellGlow;
                ctx.fill();

                // Orbiting lensing particles
                lens.forEach(l => {
                    l.angle += l.speed;
                    const wobble = 5 * Math.sin(time * 3 + l.angle * 2);
                    const px = mouse.x + Math.cos(l.angle) * (l.dist + wobble);
                    const py = mouse.y + Math.sin(l.angle) * (l.dist + wobble);
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(168, 85, 247, ${0.3 + 0.2 * Math.sin(time * 4 + l.angle)})`;
                    ctx.fill();
                });

                // Distortion rings
                for (let i = 1; i <= 2; i++) {
                    const r = 30 * i + 10 * Math.sin(time * 2);
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 / i})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            animRef.current = requestAnimationFrame(animate);
        }

        const onMouse = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
        const onLeave = () => { mouse.active = false; };
        const onResize = () => {
            w = window.innerWidth; h = window.innerHeight;
            canvas.width = w; canvas.height = h;
            auroras[0].yBase = h * 0.82;
            auroras[1].yBase = h * 0.86;
            auroras[2].yBase = h * 0.78;
            nebulae[0].x = w * 0.2; nebulae[0].y = h * 0.3;
            nebulae[1].x = w * 0.75; nebulae[1].y = h * 0.6;
            nebulae[2].x = w * 0.5; nebulae[2].y = h * 0.15;
            nebulae[3].x = w * 0.85; nebulae[3].y = h * 0.2;
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
