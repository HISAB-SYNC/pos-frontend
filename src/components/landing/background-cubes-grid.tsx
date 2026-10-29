"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BackgroundCubesGridProps {
  className?: string;
  /** Half-width of a cube's top face in px. */
  size?: number;
}

const HOVER_RADIUS = 200;
const GAP = 0.84;

/**
 * Isometric cube floor (after Aceternity's background cubes).
 * Calm idle swell, cubes lift and tint indigo under the cursor, click sends a ripple.
 * Pauses offscreen and renders a single static frame for reduced motion.
 */
export function BackgroundCubesGrid({ className, size = 30 }: BackgroundCubesGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const a = size;
    const b = size * 0.5774; // tan(30deg) → true isometric
    const base = 14; // resting height of every cube
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let time = 0;

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    const ripples: { x: number; y: number; r: number; life: number }[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, inside: e.clientY >= rect.top && e.clientY <= rect.bottom };
    };

    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      mouse.tx = p.x;
      mouse.ty = p.y;
      mouse.active = p.inside;
    };

    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      if (p.inside) ripples.push({ x: p.x, y: p.y, r: 0, life: 1 });
    };

    const lerp = (from: number, to: number, t: number) => Math.round(from + (to - from) * t);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Visible (row, col) range for a grid whose origin is the top-left corner.
      const pad = 3;
      const maxSum = Math.ceil(height / b) + pad * 2;
      const span = Math.ceil(width / (2 * a)) + pad;

      // Row-major, col-ascending order already paints back-to-front for this projection.
      for (let r = -span; r <= maxSum; r++) {
        for (let c = -pad; c <= maxSum + span; c++) {
          const cx = (c - r) * a;
          const cy = (c + r) * b;
          if (cx < -a * 2 || cx > width + a * 2 || cy < -b * 4 || cy > height + b * 6) continue;

          // Idle swell — low amplitude so the floor reads as texture, not terrain.
          let lift = Math.sin(c * 0.35 + r * 0.2 - time) * 3 + Math.cos(c * 0.15 - r * 0.3 + time * 0.7) * 2;

          let heat = 0;
          if (mouse.active) {
            const d = Math.hypot(cx - mouse.x, cy - mouse.y);
            if (d < HOVER_RADIUS) {
              heat = 1 - d / HOVER_RADIUS;
              heat *= heat; // ease-in falloff
              lift += heat * 22;
            }
          }

          for (const rip of ripples) {
            const band = Math.abs(Math.hypot(cx - rip.x, cy - rip.y) - rip.r);
            if (band < 40) {
              const k = (1 - band / 40) * rip.life;
              lift += k * 14;
              heat = Math.max(heat, k * 0.6);
            }
          }

          const h = base + lift;
          const top = cy - h;
          // Cubes are drawn smaller than their cell so the gap exposes each block's sides.
          const ia = a * GAP;
          const ib = b * GAP;

          // Left face
          ctx.beginPath();
          ctx.moveTo(cx - ia, top);
          ctx.lineTo(cx, top + ib);
          ctx.lineTo(cx, cy + ib);
          ctx.lineTo(cx - ia, cy);
          ctx.closePath();
          ctx.fillStyle = `rgb(${lerp(214, 176, heat)},${lerp(219, 170, heat)},${lerp(228, 243, heat)})`;
          ctx.fill();

          // Right face
          ctx.beginPath();
          ctx.moveTo(cx, top + ib);
          ctx.lineTo(cx + ia, top);
          ctx.lineTo(cx + ia, cy);
          ctx.lineTo(cx, cy + ib);
          ctx.closePath();
          ctx.fillStyle = `rgb(${lerp(232, 206, heat)},${lerp(235, 202, heat)},${lerp(241, 250, heat)})`;
          ctx.fill();

          // Top face
          ctx.beginPath();
          ctx.moveTo(cx, top - ib);
          ctx.lineTo(cx + ia, top);
          ctx.lineTo(cx, top + ib);
          ctx.lineTo(cx - ia, top);
          ctx.closePath();
          ctx.fillStyle =
            heat > 0.02
              ? `rgb(${lerp(255, 91, heat * 0.7)},${lerp(255, 79, heat * 0.7)},${lerp(255, 233, heat * 0.7)})`
              : "#ffffff";
          ctx.fill();
          ctx.strokeStyle = heat > 0.02 ? `rgba(91,79,233,${0.2 + heat * 0.5})` : "rgba(186,196,212,0.9)";
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    };

    const tick = () => {
      frame = 0;
      if (!visible) return;
      time += 0.012;
      mouse.x += (mouse.tx - mouse.x) * 0.18;
      mouse.y += (mouse.ty - mouse.y) * 0.18;
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += 5;
        ripples[i].life *= 0.965;
        if (ripples[i].life < 0.03) ripples.splice(i, 1);
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame && !reduceMotion) frame = requestAnimationFrame(tick);
    };

    resize();
    draw();

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);

    if (!reduceMotion) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      start();
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [size]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
