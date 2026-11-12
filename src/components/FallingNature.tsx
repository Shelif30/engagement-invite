import { useEffect, useRef } from "react";
import { reducedMotion } from "../lib/config";

type Kind = "leaf" | "petal" | "firefly";
interface P {
  kind: Kind;
  x: number; y: number; z: number;
  vx: number; vy: number;
  rot: number; vr: number;
  flip: number; vf: number;
  size: number; color: string;
  sway: number; phase: number;
}

const LEAF = ["#5f9a3c", "#7fb04a", "#9cc35a", "#4e8a3a", "#b7d36a"];
const PETAL = ["#e0307a", "#ec4f93", "#f27fb0", "#d42a6f"];

interface Props {
  leaves?: number;
  petals?: number;
  fireflies?: number;
  className?: string;
  /** 0..1, fades the whole layer (used during splash exit) */
  intensity?: number;
}

/** Ambient canvas of falling leaves, bougainvillea bracts and drifting light motes. */
export default function FallingNature({ leaves = 18, petals = 14, fireflies = 26, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, dpr = 1, raf = 0, last = performance.now();
    const still = reducedMotion();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const make = (kind: Kind, anywhere: boolean): P => {
      const z = 0.45 + Math.random() * 0.75;
      return {
        kind,
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -40 - Math.random() * 120,
        z,
        vx: (Math.random() - 0.3) * 18,
        vy: kind === "firefly" ? -(6 + Math.random() * 14) : (28 + Math.random() * 38) * z,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 1.6,
        flip: Math.random() * Math.PI * 2,
        vf: 1.5 + Math.random() * 2.5,
        size: kind === "leaf" ? (9 + Math.random() * 9) * z : kind === "petal" ? (7 + Math.random() * 6) * z : 1.4 + Math.random() * 2.4,
        color: kind === "leaf" ? LEAF[(Math.random() * LEAF.length) | 0] : PETAL[(Math.random() * PETAL.length) | 0],
        sway: 18 + Math.random() * 34,
        phase: Math.random() * Math.PI * 2,
      };
    };
    const ps: P[] = [
      ...Array.from({ length: leaves }, () => make("leaf", true)),
      ...Array.from({ length: petals }, () => make("petal", true)),
      ...Array.from({ length: fireflies }, () => make("firefly", true)),
    ];

    const drawLeaf = (p: P) => {
      const s = p.size;
      ctx.scale(1, Math.max(0.18, Math.abs(Math.cos(p.flip))));
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.75, -s * 0.55, s * 0.7, s * 0.55, 0, s);
      ctx.bezierCurveTo(-s * 0.7, s * 0.55, -s * 0.75, -s * 0.55, 0, -s);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(40,70,25,.45)";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(0, s * 1.25); ctx.stroke();
    };
    const drawPetal = (p: P) => {
      // bougainvillea bract: rounded heart-ish with a soft vein
      const s = p.size;
      ctx.scale(1, Math.max(0.25, Math.abs(Math.cos(p.flip))));
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.bezierCurveTo(s * 1.2, s * 0.2, s * 0.9, -s * 1.1, 0, -s * 0.45);
      ctx.bezierCurveTo(-s * 0.9, -s * 1.1, -s * 1.2, s * 0.2, 0, s);
      ctx.fillStyle = p.color;
      ctx.globalAlpha *= 0.92;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(0, s * 0.85); ctx.lineTo(0, -s * 0.35); ctx.stroke();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!still) {
          p.x += (p.vx + Math.sin(t * 0.9 + p.phase) * p.sway * 0.6) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          p.flip += p.vf * dt;
        }
        if (p.kind === "firefly") {
          if (p.y < -10) Object.assign(p, make("firefly", false), { y: h + 10 });
        } else if (p.y > h + 40 || p.x < -60 || p.x > w + 60) {
          Object.assign(p, make(p.kind, false));
        }
        ctx.save();
        if (p.kind === "firefly") {
          const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2 + p.phase));
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
          g.addColorStop(0, `rgba(255,246,200,${0.9 * a})`);
          g.addColorStop(0.35, `rgba(255,224,140,${0.35 * a})`);
          g.addColorStop(1, "rgba(255,220,120,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.55 + 0.45 * p.z;
          if (p.kind === "leaf") drawLeaf(p); else drawPetal(p);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [leaves, petals, fireflies]);

  return <canvas ref={ref} className={className ?? "nature-canvas"} aria-hidden="true" />;
}
