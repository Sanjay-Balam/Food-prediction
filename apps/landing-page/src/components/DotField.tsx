"use client";

import { useEffect, useRef } from "react";

const COLUMNS = 90;
const ROWS = 46;

/**
 * A slow wave of dots in perspective, in the spirit of Vanta's "dots" effect, drawn on a 2D canvas
 * (no three.js). It pauses when off screen, and draws a single still frame for reduced motion.
 */
export function DotField({ rgb = "92, 194, 168", className }: { rgb?: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let onScreen = true;
    let pointer = 0;        // -0.5 .. 0.5, eased towards pointerTarget
    let pointerTarget = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (seconds: number) => {
      context.clearRect(0, 0, width, height);
      const horizon = height * 0.3;
      const focal = height * 0.9;
      pointer += (pointerTarget - pointer) * 0.04;
      for (let row = 0; row < ROWS; row++) {
        const depth = 1 + row * 0.42;
        const scale = focal / depth;
        const alpha = Math.min(0.9, 1.5 / depth);
        context.fillStyle = `rgba(${rgb}, ${alpha})`;
        for (let column = 0; column < COLUMNS; column++) {
          const x = (column - COLUMNS / 2) * 0.3 + pointer * 1.2;
          const wave = Math.sin(x * 0.85 + seconds * 0.7) * Math.cos(depth * 0.45 + seconds * 0.55) * 0.38;
          const screenX = width / 2 + x * scale;
          const screenY = horizon + (1.6 - wave) * scale * 0.5;
          if (screenX < -4 || screenX > width + 4 || screenY > height + 4) continue;
          const radius = Math.max(0.6, (2.6 * scale) / focal);
          context.beginPath();
          context.arc(screenX, screenY, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const loop = (time: number) => {
      draw(time / 1000);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!reduceMotion && onScreen && !document.hidden && !frame) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget = event.clientX / window.innerWidth - 0.5;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });

    resize();
    draw(0);
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rgb]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
