import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { EVENT, reducedMotion } from "../lib/config";

const TARGET = new Date(EVENT.countdownTo).getTime();

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** One calligraphic number; the old value lifts away in a blur as the new one settles in. */
function Flip({ value }: { value: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const [pair, setPair] = useState<{ cur: string; prev: string | null; n: number }>({ cur: value, prev: null, n: 0 });

  useEffect(() => {
    setPair((p) => (p.cur === value ? p : { cur: value, prev: p.cur, n: p.n + 1 }));
  }, [value]);

  useLayoutEffect(() => {
    if (pair.prev === null || reducedMotion()) return;
    const q = gsap.utils.selector(box);
    const tl = gsap.timeline({ onComplete: () => setPair((p) => ({ ...p, prev: null })) });
    tl.fromTo(q(".fl-old"), { yPercent: 0, opacity: 1, filter: "blur(0px)" }, { yPercent: -55, opacity: 0, filter: "blur(6px)", duration: 0.55, ease: "power2.in" }, 0)
      .fromTo(q(".fl-new"), { yPercent: 55, opacity: 0, filter: "blur(6px)", rotate: -6 }, { yPercent: 0, opacity: 1, filter: "blur(0px)", rotate: 0, duration: 0.7, ease: "power3.out" }, 0.12);
    return () => { tl.kill(); };
  }, [pair.n]);

  return (
    <span className="flip" ref={box}>
      {pair.prev !== null && <span className="fl fl-old" aria-hidden="true">{pair.prev}</span>}
      <span className="fl fl-new">{pair.cur}</span>
    </span>
  );
}

const R = 46, C = 2 * Math.PI * R;

function Unit({ label, value, frac }: { label: string; value: number; frac: number }) {
  return (
    <div className="cd-unit">
      <svg className="cd-ring" viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={R} className="cd-track" />
        <circle cx="55" cy="55" r={R} className="cd-arc" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - frac) }} />
      </svg>
      <Flip value={String(value).padStart(2, "0")} />
      <span className="cd-label caps">{label}</span>
    </div>
  );
}

export default function Countdown() {
  const ref = useRef<HTMLElement>(null);
  const [left, setLeft] = useState(() => TARGET - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setLeft(TARGET - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    gsap.from(q(".cd-unit"), {
      y: 70, opacity: 0, scale: 0.8, stagger: 0.12, duration: 1.1, ease: "back.out(1.7)",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });
    gsap.fromTo(q(".cd-title"), { clipPath: "inset(-30% 100% -30% -8%)" }, {
      clipPath: "inset(-30% -8% -30% -8%)", duration: 1.6, ease: "power2.inOut",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
  }, { scope: ref });

  const t = split(left);
  const done = left <= 0;

  return (
    <section className="section countdown" ref={ref} aria-labelledby="cd-h">
      <p id="cd-h" className="eyebrow">Counting the days</p>
      <h2 className="cd-title script-xl">{done ? "Today is the day" : "Until we say yes"}</h2>
      <div className="cd-grid" role="timer" aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes and ${t.seconds} seconds to go`}>
        <Unit label="Days" value={t.days} frac={Math.min(1, t.days / 100)} />
        <Unit label="Hours" value={t.hours} frac={t.hours / 24} />
        <Unit label="Minutes" value={t.minutes} frac={t.minutes / 60} />
        <Unit label="Seconds" value={t.seconds} frac={t.seconds / 60} />
      </div>
      <p className="cd-note">{EVENT.dateLong}</p>
    </section>
  );
}
