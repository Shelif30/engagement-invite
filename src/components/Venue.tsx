import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { EVENT, reducedMotion } from "../lib/config";

/** Venue card: a winding garden path draws to a pin that drops in, then the directions button. */
export default function Venue() {
  const ref = useRef<HTMLElement>(null);
  const btn = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top 70%" },
      });
      tl.from(q(".venue-card"), {
        y: 90,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
      })
        .fromTo(
          q(".trail"),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" },
          0.3,
        )
        .from(
          q(".pin"),
          { y: -140, opacity: 0, duration: 0.9, ease: "bounce.out" },
          1.4,
        )
        .from(
          q(".pin-shadow"),
          { scale: 0, opacity: 0, duration: 0.6, transformOrigin: "50% 50%" },
          1.7,
        )
        .fromTo(
          q(".venue-name"),
          { clipPath: "inset(-30% 100% -30% -8%)" },
          {
            clipPath: "inset(-30% -8% -30% -8%)",
            duration: 1.4,
            ease: "power2.inOut",
          },
          0.8,
        )
        .from(
          q(".venue-time"),
          { scale: 0.7, opacity: 0, duration: 0.9, ease: "back.out(2)" },
          1.3,
        )
        .from(
          q(".vt-line"),
          { scaleX: 0, duration: 0.8, ease: "power2.out" },
          1.6,
        )
        .from(
          q(".venue-area, .venue-date"),
          { y: 20, opacity: 0, stagger: 0.15, duration: 0.8 },
          1.5,
        )
        .from(
          q(".btn-map"),
          { y: 30, opacity: 0, scale: 0.9, duration: 0.8, ease: "back.out(2)" },
          1.9,
        );
      if (!reducedMotion()) {
        gsap.to(q(".ripple"), {
          scale: 2.6,
          opacity: 0,
          duration: 2.2,
          repeat: -1,
          stagger: 0.7,
          ease: "power1.out",
          transformOrigin: "50% 50%",
        });
      }

      // magnetic button
      const b = btn.current!;
      const move = (e: PointerEvent) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, {
          x: (e.clientX - r.left - r.width / 2) * 0.25,
          y: (e.clientY - r.top - r.height / 2) * 0.35,
          duration: 0.4,
          ease: "power3.out",
        });
      };
      const leave = () =>
        gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      b.addEventListener("pointermove", move);
      b.addEventListener("pointerleave", leave);
      return () => {
        b.removeEventListener("pointermove", move);
        b.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref },
  );

  return (
    <section className="section venue" ref={ref} aria-labelledby="venue-h">
      <div className="venue-card glass">
        <svg className="venue-map" viewBox="0 0 300 150" aria-hidden="true">
          <path
            className="trail"
            pathLength={1}
            d="M10 130 C 60 120, 70 80, 120 92 S 190 128, 214 96 S 236 60, 228 50"
          />
          <ellipse className="pin-shadow" cx="228" cy="62" rx="10" ry="3.5" />
          <circle className="ripple" cx="228" cy="62" r="8" />
          <circle className="ripple" cx="228" cy="62" r="8" />
          <g className="pin">
            <path d="M228 60 C 216 44, 214 36, 214 30 A14 14 0 1 1 242 30 C 242 36, 240 44, 228 60 Z" />
            <circle cx="228" cy="30" r="5.5" className="pin-dot" />
          </g>
          <g className="tiny-leaves">
            <path d="M40 118 c4 -8 12 -10 16 -8 c-3 7 -10 10 -16 8z" />
            <path d="M150 108 c4 8 12 10 16 8 c-3 -7 -10 -10 -16 -8z" />
            <path d="M96 84 c-2 -9 3 -15 8 -16 c1 8 -3 13 -8 16z" />
          </g>
        </svg>
        <p id="venue-h" className="eyebrow">
          The venue
        </p>
        <h2 className="venue-name script-xl">{EVENT.venue}</h2>
        <p className="venue-time">
          <span className="vt-line" aria-hidden="true" />
          {EVENT.time}
          <span className="vt-line" aria-hidden="true" />
        </p>
        <p className="venue-area">{EVENT.venueArea}</p>
        <p className="venue-date caps">{EVENT.dateLong}</p>
        <a
          ref={btn}
          className="btn-map"
          href={EVENT.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 22 C 8 16, 5 13, 5 9 a7 7 0 0 1 14 0 c0 4 -3 7 -7 13z M12 11.5 a2.5 2.5 0 1 0 0 -5 a2.5 2.5 0 0 0 0 5z" />
          </svg>
          <span>Get directions</span>
          <i className="shine" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
