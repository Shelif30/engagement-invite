import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { reducedMotion } from "../lib/config";
import { Butterfly, CornerVines, growVines } from "./NatureBits";

const BURST = 22;
const RISERS = 9;
const SPARKS: [number, number][] = [[18, 62], [82, 58], [26, 78], [74, 80], [50, 54], [10, 86], [90, 88], [38, 92], [62, 50]];

/**
 * The garden blooms around the names on the film's last frame: vines grow in from the corners,
 * flowers open, butterflies cross, a warm sun glows behind the names, petals burst outward,
 * sparkles twinkle and little hearts float up. Plays when the guest reaches the end of the film
 * and rewinds if they scroll back up.
 */
export default function FinaleBloom({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

    t.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0)
      .fromTo(q(".fin-sun"), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 2 }, 0)
      .fromTo(q(".fin-glow"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 1.6 }, 0.15);
    growVines(q, t, 0.1, 2.2);

    // petal + heart burst from behind the names
    q(".burst > i").forEach((p, i) => {
      const ang = (i / BURST) * Math.PI * 2 + (i % 2) * 0.12;
      const r = 180 + (i % 3) * 70;
      t.fromTo(p, { x: 0, y: 0, scale: 0.2, rotate: 0, opacity: 0 }, {
        keyframes: [
          { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
          { x: Math.cos(ang) * r, y: Math.sin(ang) * r * 0.7 - 40, rotate: (i % 2 ? 1 : -1) * 260, duration: 1.6, ease: "power3.out" },
          { opacity: 0, duration: 0.6, ease: "power1.in" },
        ],
      }, 0.45 + (i % 4) * 0.04);
    });

    t.fromTo(q(".butterfly"), { opacity: 0 }, { opacity: 1, duration: 1 }, 0.9)
      .fromTo(q(".fin-spark"), { scale: 0 }, { scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(2)" }, 0.9)
      .fromTo(q(".riser"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.2);
    tl.current = t;

    if (reducedMotion()) return;
    // ambient loops (cheap; the layer is hidden until the finale plays)
    gsap.to(q(".fin-rays"), { rotate: 360, duration: 50, repeat: -1, ease: "none" });
    gsap.to(q(".fin-glow"), { scale: 1.08, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2 });
    gsap.to(q(".vine"), { rotate: 1.4, duration: 3.6, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.5 });
    q(".fin-spark svg").forEach((s, i) =>
      gsap.fromTo(s, { scale: 0.2, opacity: 0.2, rotate: 0 }, { scale: 1, opacity: 1, rotate: 90, duration: 0.9, yoyo: true, repeat: -1, delay: i * 0.37, ease: "sine.inOut" }));
    q(".riser").forEach((h, i) => {
      gsap.fromTo(h, { y: 0, x: 0, opacity: 0, scale: 0.6 }, {
        keyframes: [
          { opacity: 0.95, scale: 1, duration: 0.6 },
          { y: -260 - (i % 3) * 60, x: (i % 2 ? 1 : -1) * (20 + (i % 4) * 12), duration: 3.4, ease: "sine.out" },
          { opacity: 0, duration: 0.8 },
        ],
        repeat: -1, delay: i * 0.55, repeatDelay: 0.6,
      });
    });

    // butterflies drift on looping paths across the frame
    const fly = () => {
      const w = el.clientWidth, h = el.clientHeight;
      gsap.killTweensOf(q(".butterfly"), "x,y,rotation");
      gsap.fromTo(q(".fbf-a"), { x: -70, y: h * 0.55 }, {
        motionPath: { path: [{ x: w * 0.2, y: h * 0.32 }, { x: w * 0.48, y: h * 0.46 }, { x: w * 0.75, y: h * 0.22 }, { x: w + 80, y: h * 0.3 }], curviness: 1.4, autoRotate: 90 },
        duration: 11, ease: "none", repeat: -1,
      });
      gsap.fromTo(q(".fbf-b"), { x: w + 60, y: h * 0.18 }, {
        motionPath: { path: [{ x: w * 0.72, y: h * 0.4 }, { x: w * 0.45, y: h * 0.24 }, { x: w * 0.18, y: h * 0.48 }, { x: -80, y: h * 0.4 }], curviness: 1.5, autoRotate: -90 },
        duration: 13, ease: "none", repeat: -1, delay: 2,
      });
    };
    fly();
    window.addEventListener("resize", fly);
    return () => window.removeEventListener("resize", fly);
  }, { scope: root });

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (active) t.timeScale(1).play();
    else t.timeScale(2.4).reverse();
  }, [active]);

  return (
    <div className="finale" ref={root} aria-hidden="true">
      <div className="fin-sun"><div className="fin-rays" /></div>
      <div className="fin-glow" />
      <CornerVines />
      <div className="burst">
        {Array.from({ length: BURST }, (_, i) => (
          <i key={i} className={i % 3 === 0 ? "b-heart" : i % 3 === 1 ? "b-petal" : "b-gold"} />
        ))}
      </div>
      {SPARKS.map(([x, y], i) => (
        <span key={i} className="fin-spark" style={{ left: `${x}%`, top: `${y}%` }}>
          <svg viewBox="-10 -10 20 20"><path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" /></svg>
        </span>
      ))}
      <div className="risers">
        {Array.from({ length: RISERS }, (_, i) => (
          <svg key={i} className="riser" style={{ left: `${8 + i * 10.5}%` }} viewBox="0 0 24 22">
            <path d="M12 21 C 3 14, 0 9, 3 4.5 C 5.5 1, 10 1.5, 12 5 C 14 1.5, 18.5 1, 21 4.5 C 24 9, 21 14, 12 21 Z" />
          </svg>
        ))}
      </div>
      <Butterfly hue="#f08a2c" className="fbf-a" />
      <Butterfly hue="#e0478e" className="fbf-b" />
    </div>
  );
}
