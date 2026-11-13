import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { EVENT, FRAME_COUNT, asset, reducedMotion } from "../lib/config";
import { onFrameProgress, preloadFrames } from "../lib/frames";
import FallingNature from "./FallingNature";
import { Butterfly, CornerVines, growVines } from "./NatureBits";
import { playMusic } from "../lib/music";

interface Props {
  onOpen: () => void;
  onGone: () => void;
}

export default function Splash({ onOpen, onGone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const opened = useRef(false);
  const intro = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    preloadFrames();
    const off = onFrameProgress((n) => setProgress(n / FRAME_COUNT));
    // Don't make anyone wait for every frame: open once a rough pass is in, or after 4 s at most.
    const t = window.setTimeout(() => setReady(true), 4000);
    return () => {
      off();
      window.clearTimeout(t);
    };
  }, []);
  useEffect(() => {
    if (progress >= 0.15) setReady(true);
  }, [progress]);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const still = reducedMotion();
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro.current = tl;

      // Vines: draw strokes and sprout leaves along them as they grow.
      growVines(q, tl);

      tl.from(
        q(".splash-bg"),
        { scale: 1.3, duration: 3.4, ease: "power2.out" },
        0,
      )
        .from(q(".sun"), { scale: 0.2, opacity: 0, duration: 2.2 }, 0.2)
        .from(q(".splash-veil"), { opacity: 0, duration: 1.4 }, 0.6)
        .from(
          q(".wreath-ring"),
          {
            scale: 0.6,
            opacity: 0,
            rotate: -40,
            duration: 1.6,
            transformOrigin: "50% 50%",
          },
          0.9,
        )
        .from(
          q(".mono span"),
          {
            y: 30,
            opacity: 0,
            filter: "blur(8px)",
            stagger: 0.18,
            duration: 1.1,
          },
          1.3,
        )
        .fromTo(
          q(".splash-names"),
          { clipPath: "inset(-30% 100% -30% -8%)" },
          {
            clipPath: "inset(-30% -8% -30% -8%)",
            duration: 2.0,
            ease: "power2.inOut",
          },
          1.9,
        )
        .from(
          q(".splash-line"),
          { scaleX: 0, duration: 1.1, ease: "power2.inOut" },
          2.6,
        )
        .from(
          q(".splash-sub > *"),
          { y: 18, opacity: 0, stagger: 0.14, duration: 0.9 },
          2.9,
        )
        .from(q(".splash-cta"), { y: 24, opacity: 0, duration: 0.9 }, 3.4);

      if (still) tl.progress(1);

      // Butterflies wander on looping paths.
      if (!still) {
        const vw = window.innerWidth,
          vh = window.innerHeight;
        gsap.fromTo(
          q(".bf-a"),
          { x: -80, y: vh * 0.62 },
          {
            motionPath: {
              path: [
                { x: vw * 0.25, y: vh * 0.42 },
                { x: vw * 0.55, y: vh * 0.58 },
                { x: vw * 0.8, y: vh * 0.3 },
                { x: vw + 90, y: vh * 0.2 },
              ],
              curviness: 1.4,
              autoRotate: 90,
            },
            duration: 13,
            ease: "none",
            repeat: -1,
            delay: 1.2,
          },
        );
        gsap.fromTo(
          q(".bf-b"),
          { x: vw + 60, y: vh * 0.25 },
          {
            motionPath: {
              path: [
                { x: vw * 0.7, y: vh * 0.45 },
                { x: vw * 0.4, y: vh * 0.3 },
                { x: vw * 0.15, y: vh * 0.55 },
                { x: -90, y: vh * 0.7 },
              ],
              curviness: 1.5,
              autoRotate: -90,
            },
            duration: 16,
            ease: "none",
            repeat: -1,
            delay: 3,
          },
        );
        gsap.to(q(".sun-rays"), {
          rotate: 360,
          duration: 60,
          repeat: -1,
          ease: "none",
        });
        gsap.to(q(".sun-core"), {
          scale: 1.12,
          opacity: 0.85,
          duration: 2.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
        gsap.to(q(".vine"), {
          rotate: 1.6,
          duration: 3.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: 0.6,
          transformOrigin: "0% 0%",
        });
      }
    },
    { scope: root },
  );

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    void playMusic(); // a tap is the one moment every browser allows sound to start
    const el = root.current!;
    const q = gsap.utils.selector(el);
    intro.current?.progress(1);
    onOpen();
    gsap
      .timeline({ onComplete: onGone, defaults: { ease: "power3.inOut" } })
      .to(
        q(".splash-center"),
        { scale: 1.12, opacity: 0, filter: "blur(10px)", duration: 0.9 },
        0,
      )
      .to(
        q(".vine"),
        { scale: 1.35, opacity: 0, duration: 1.1, stagger: 0.04 },
        0.05,
      )
      .to(q(".butterfly, .sun"), { opacity: 0, duration: 0.6 }, 0)
      .to(
        q(".half-l"),
        {
          xPercent: -102,
          rotate: -4,
          duration: 1.5,
          transformOrigin: "0% 50%",
        },
        0.45,
      )
      .to(
        q(".half-r"),
        {
          xPercent: 102,
          rotate: 4,
          duration: 1.5,
          transformOrigin: "100% 50%",
        },
        0.45,
      )
      .to(q(".splash-canvas"), { opacity: 0, duration: 0.8 }, 1.1);
  };

  const pct = Math.round(progress * 100);

  return (
    <div
      className="splash"
      ref={root}
      role="dialog"
      aria-label="Invitation cover"
    >
      <div className="splash-half half-l">
        <div
          className="splash-bg"
          style={{ backgroundImage: `url(${asset("img/garden.webp")})` }}
        />
      </div>
      <div className="splash-half half-r">
        <div
          className="splash-bg"
          style={{ backgroundImage: `url(${asset("img/garden.webp")})` }}
        />
      </div>
      <div className="splash-veil" />

      <div className="sun" aria-hidden="true">
        <div className="sun-rays" />
        <div className="sun-core" />
      </div>

      {/* Corner vines */}
      <CornerVines />

      <FallingNature
        className="nature-canvas splash-canvas"
        leaves={22}
        petals={18}
        fireflies={34}
      />
      <Butterfly hue="#f08a2c" className="bf-a" />
      <Butterfly hue="#d63a83" className="bf-b" />

      <div className="splash-center">
        <div className="wreath">
          <svg className="wreath-ring" viewBox="0 0 240 240" aria-hidden="true">
            <path
              className="vine-path"
              data-spacing="15"
              data-scale=".72"
              data-flowers="0.12,0.46,0.8"
              d="M120 14 A106 106 0 1 1 119.9 14"
            />
            <g className="vine-leaves" />
          </svg>
          <p className="mono" aria-hidden="true">
            <span>S</span>
            <span className="amp">&amp;</span>
            <span>G</span>
          </p>
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
          <button
            className="btn-open"
            onClick={open}
            disabled={!ready}
            aria-live="polite"
          >
            <span className="btn-leaf" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M4 20 C 4 10, 10 4, 20 4 C 20 14, 14 20, 4 20 Z M4 20 L 14 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {ready ? "Open the invitation" : `Gathering flowers ${pct}%`}
          </button>
          <div className="load-bar" aria-hidden="true">
            <i style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
