import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { EVENT, FRAME_COUNT, asset, reducedMotion } from "../lib/config";
import { onFrameProgress, preloadFrames } from "../lib/frames";
import FallingNature from "./FallingNature";

const SVGNS = "http://www.w3.org/2000/svg";
const LEAF_D = "M0 0 C 6 -7, 17 -7, 24 0 C 17 7, 6 7, 0 0 Z";
const LEAF_FILLS = ["#4f8a36", "#6aa244", "#86b84f", "#3f7a31", "#9cc65a"];

/** Grow leaves (and optional bougainvillea clusters) along an SVG path; returns the created nodes. */
function sproutAlong(path: SVGPathElement, holder: SVGGElement, spacing: number, scale: number, flowerAt: number[]) {
  const L = path.getTotalLength();
  const leaves: { el: SVGElement; at: number }[] = [];
  let side = 1;
  for (let d = spacing * 0.6; d < L - 4; d += spacing) {
    const p = path.getPointAtLength(d);
    const q = path.getPointAtLength(Math.min(L, d + 1));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${ang + side * 52}) scale(${scale * (0.75 + Math.random() * 0.45)})`);
    const leaf = document.createElementNS(SVGNS, "path");
    leaf.setAttribute("d", LEAF_D);
    leaf.setAttribute("fill", LEAF_FILLS[(Math.random() * LEAF_FILLS.length) | 0]);
    const vein = document.createElementNS(SVGNS, "path");
    vein.setAttribute("d", "M1 0 L22 0");
    vein.setAttribute("stroke", "rgba(30,60,20,.35)");
    vein.setAttribute("stroke-width", "0.8");
    const inner = document.createElementNS(SVGNS, "g");
    inner.setAttribute("class", "sprout");
    inner.append(leaf, vein);
    g.append(inner);
    holder.append(g);
    leaves.push({ el: inner, at: d / L });
    side *= -1;
  }
  for (const f of flowerAt) {
    const p = path.getPointAtLength(L * f);
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${scale * 1.15})`);
    const inner = document.createElementNS(SVGNS, "g");
    inner.setAttribute("class", "sprout bloom");
    for (let k = 0; k < 3; k++) {
      const pet = document.createElementNS(SVGNS, "path");
      pet.setAttribute("d", "M0 0 C 9 -4, 12 -15, 0 -19 C -12 -15, -9 -4, 0 0 Z");
      pet.setAttribute("fill", k === 1 ? "#e43d86" : "#d0236b");
      pet.setAttribute("transform", `rotate(${k * 120 + Math.random() * 20})`);
      inner.append(pet);
    }
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("r", "2.6");
    c.setAttribute("fill", "#fff3c4");
    inner.append(c);
    g.append(inner);
    holder.append(g);
    leaves.push({ el: inner, at: f });
  }
  return { L, leaves };
}

function Butterfly({ hue, className }: { hue: string; className: string }) {
  return (
    <svg className={`butterfly ${className}`} viewBox="-30 -24 60 48" aria-hidden="true">
      <g className="wing wing-l">
        <path d="M0 0 C -10 -22, -30 -22, -27 -6 C -25 4, -10 4, 0 0 Z" fill={hue} />
        <path d="M0 2 C -8 6, -22 12, -16 20 C -10 24, -3 12, 0 2 Z" fill={hue} opacity=".85" />
        <circle cx="-17" cy="-9" r="3.2" fill="#fff6dc" opacity=".8" />
      </g>
      <g className="wing wing-r">
        <path d="M0 0 C 10 -22, 30 -22, 27 -6 C 25 4, 10 4, 0 0 Z" fill={hue} />
        <path d="M0 2 C 8 6, 22 12, 16 20 C 10 24, 3 12, 0 2 Z" fill={hue} opacity=".85" />
        <circle cx="17" cy="-9" r="3.2" fill="#fff6dc" opacity=".8" />
      </g>
      <ellipse cx="0" cy="3" rx="1.6" ry="9" fill="#3b2a1d" />
      <path d="M0 -5 C -2 -12, -5 -15, -7 -16 M0 -5 C 2 -12, 5 -15, 7 -16" stroke="#3b2a1d" strokeWidth=".8" fill="none" />
    </svg>
  );
}

interface Props { onOpen: () => void; onGone: () => void }

export default function Splash({ onOpen, onGone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const opened = useRef(false);
  const intro = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    preloadFrames();
    const off = onFrameProgress((n) => setProgress(n / FRAME_COUNT));
    // Don't make anyone wait for every frame: open after a third, or after 7 s at most.
    const t = window.setTimeout(() => setReady(true), 7000);
    return () => { off(); window.clearTimeout(t); };
  }, []);
  useEffect(() => { if (progress >= 0.34) setReady(true); }, [progress]);

  useGSAP(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const still = reducedMotion();
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro.current = tl;

    // Vines: draw strokes and sprout leaves along them as they grow.
    q<SVGGElement>(".vine-leaves").forEach((h) => h.replaceChildren());
    const vines = q<SVGPathElement>(".vine-path");
    vines.forEach((path, i) => {
      const holder = path.parentNode!.querySelector<SVGGElement>(".vine-leaves")!;
      const flowers = (path.dataset.flowers ?? "").split(",").filter(Boolean).map(Number);
      const { L, leaves } = sproutAlong(path, holder, Number(path.dataset.spacing ?? 26), Number(path.dataset.scale ?? 1), flowers);
      const dur = 2.6;
      const start = 0.25 + i * 0.12;
      gsap.set(path, { strokeDasharray: L, strokeDashoffset: L });
      tl.to(path, { strokeDashoffset: 0, duration: dur, ease: "power2.inOut" }, start);
      leaves.forEach(({ el: leaf, at }) => {
        const bloom = leaf.classList.contains("bloom");
        tl.fromTo(leaf, { scale: 0, rotate: bloom ? -90 : -25, transformOrigin: "0px 0px" },
          { scale: 1, rotate: 0, duration: bloom ? 0.9 : 0.6, ease: bloom ? "back.out(2.2)" : "back.out(1.8)" },
          start + at * dur * 0.92 + (bloom ? 0.15 : 0));
      });
    });

    tl.from(q(".splash-bg"), { scale: 1.3, duration: 3.4, ease: "power2.out" }, 0)
      .from(q(".sun"), { scale: 0.2, opacity: 0, duration: 2.2 }, 0.2)
      .from(q(".splash-veil"), { opacity: 0, duration: 1.4 }, 0.6)
      .from(q(".wreath-ring"), { scale: 0.6, opacity: 0, rotate: -40, duration: 1.6, transformOrigin: "50% 50%" }, 0.9)
      .from(q(".mono span"), { y: 30, opacity: 0, filter: "blur(8px)", stagger: 0.18, duration: 1.1 }, 1.3)
      .fromTo(q(".splash-names"), { clipPath: "inset(-30% 100% -30% -8%)" }, { clipPath: "inset(-30% -8% -30% -8%)", duration: 2.0, ease: "power2.inOut" }, 1.9)
      .from(q(".splash-line"), { scaleX: 0, duration: 1.1, ease: "power2.inOut" }, 2.6)
      .from(q(".splash-sub > *"), { y: 18, opacity: 0, stagger: 0.14, duration: 0.9 }, 2.9)
      .from(q(".splash-cta"), { y: 24, opacity: 0, duration: 0.9 }, 3.4);

    if (still) tl.progress(1);

    // Butterflies wander on looping paths.
    if (!still) {
      const vw = window.innerWidth, vh = window.innerHeight;
      gsap.fromTo(q(".bf-a"), { x: -80, y: vh * 0.62 }, {
        motionPath: { path: [{ x: vw * 0.25, y: vh * 0.42 }, { x: vw * 0.55, y: vh * 0.58 }, { x: vw * 0.8, y: vh * 0.3 }, { x: vw + 90, y: vh * 0.2 }], curviness: 1.4, autoRotate: 90 },
        duration: 13, ease: "none", repeat: -1, delay: 1.2,
      });
      gsap.fromTo(q(".bf-b"), { x: vw + 60, y: vh * 0.25 }, {
        motionPath: { path: [{ x: vw * 0.7, y: vh * 0.45 }, { x: vw * 0.4, y: vh * 0.3 }, { x: vw * 0.15, y: vh * 0.55 }, { x: -90, y: vh * 0.7 }], curviness: 1.5, autoRotate: -90 },
        duration: 16, ease: "none", repeat: -1, delay: 3,
      });
      gsap.to(q(".sun-rays"), { rotate: 360, duration: 60, repeat: -1, ease: "none" });
      gsap.to(q(".sun-core"), { scale: 1.12, opacity: 0.85, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(q(".vine"), { rotate: 1.6, duration: 3.4, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.6, transformOrigin: "0% 0%" });
    }
  }, { scope: root });

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    const el = root.current!;
    const q = gsap.utils.selector(el);
    intro.current?.progress(1);
    onOpen();
    gsap.timeline({ onComplete: onGone, defaults: { ease: "power3.inOut" } })
      .to(q(".splash-center"), { scale: 1.12, opacity: 0, filter: "blur(10px)", duration: 0.9 }, 0)
      .to(q(".vine"), { scale: 1.35, opacity: 0, duration: 1.1, stagger: 0.04 }, 0.05)
      .to(q(".butterfly, .sun"), { opacity: 0, duration: 0.6 }, 0)
      .to(q(".half-l"), { xPercent: -102, rotate: -4, duration: 1.5, transformOrigin: "0% 50%" }, 0.45)
      .to(q(".half-r"), { xPercent: 102, rotate: 4, duration: 1.5, transformOrigin: "100% 50%" }, 0.45)
      .to(q(".splash-canvas"), { opacity: 0, duration: 0.8 }, 1.1);
  };

  const pct = Math.round(progress * 100);

  return (
    <div className="splash" ref={root} role="dialog" aria-label="Invitation cover">
      <div className="splash-half half-l"><div className="splash-bg" style={{ backgroundImage: `url(${asset("img/garden.webp")})` }} /></div>
      <div className="splash-half half-r"><div className="splash-bg" style={{ backgroundImage: `url(${asset("img/garden.webp")})` }} /></div>
      <div className="splash-veil" />

      <div className="sun" aria-hidden="true">
        <div className="sun-rays" />
        <div className="sun-core" />
      </div>

      {/* Corner vines */}
      <svg className="vine vine-tl" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="24" data-scale="1" data-flowers="0.35,0.72,0.98"
          d="M-6 18 C 60 30, 120 10, 170 40 S 250 120, 300 110" />
        <path className="vine-path" data-spacing="26" data-scale=".9" data-flowers="0.6,0.97"
          d="M14 -6 C 30 60, 10 120, 40 170 S 110 240, 96 300" />
        <g className="vine-leaves" />
      </svg>
      <svg className="vine vine-br" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="24" data-scale="1" data-flowers="0.4,0.75,0.98"
          d="M326 300 C 260 290, 200 312, 150 280 S 70 200, 20 210" />
        <path className="vine-path" data-spacing="26" data-scale=".9" data-flowers="0.55,0.97"
          d="M306 326 C 290 260, 312 200, 280 150 S 210 80, 224 20" />
        <g className="vine-leaves" />
      </svg>
      <svg className="vine vine-tr" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="25" data-scale=".85" data-flowers="0.5,0.96"
          d="M326 26 C 260 40, 230 20, 190 60 S 150 130, 110 120" />
        <g className="vine-leaves" />
      </svg>
      <svg className="vine vine-bl" viewBox="0 0 320 320" aria-hidden="true">
        <path className="vine-path" data-spacing="25" data-scale=".85" data-flowers="0.5,0.96"
          d="M-6 294 C 60 280, 90 300, 130 260 S 170 190, 210 200" />
        <g className="vine-leaves" />
      </svg>

      <FallingNature className="nature-canvas splash-canvas" leaves={22} petals={18} fireflies={34} />
      <Butterfly hue="#f08a2c" className="bf-a" />
      <Butterfly hue="#d63a83" className="bf-b" />

      <div className="splash-center">
        <div className="wreath">
          <svg className="wreath-ring" viewBox="0 0 240 240" aria-hidden="true">
            <path className="vine-path" data-spacing="15" data-scale=".72" data-flowers="0.12,0.46,0.8"
              d="M120 14 A106 106 0 1 1 119.9 14" />
            <g className="vine-leaves" />
          </svg>
          <p className="mono" aria-hidden="true"><span>S</span><span className="amp">&amp;</span><span>G</span></p>
        </div>

        <h1 className="splash-names">
          {EVENT.groom} <span className="amp">&amp;</span> {EVENT.bride}
        </h1>
        <div className="splash-line" aria-hidden="true" />
        <div className="splash-sub">
          <p className="caps">are getting engaged</p>
          <p className="splash-date">{EVENT.dateLong}</p>
        </div>

        <div className="splash-cta">
          <button className="btn-open" onClick={open} disabled={!ready} aria-live="polite">
            <span className="btn-leaf" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 20 C 4 10, 10 4, 20 4 C 20 14, 14 20, 4 20 Z M4 20 L 14 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </span>
            {ready ? "Open the invitation" : `Gathering flowers ${pct}%`}
          </button>
          <div className="load-bar" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
        </div>
      </div>
    </div>
  );
}
