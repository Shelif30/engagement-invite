import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { EVENT, asset } from "../lib/config";

/** The rings arrive, turn and settle while the names glide in from both sides. */
export default function Rings() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ref.current, start: "top 75%", end: "center 45%", scrub: 1 },
    });
    tl.fromTo(q(".rings-img"), { scale: 0.35, rotate: -38, y: 120, opacity: 0 }, { scale: 1, rotate: 0, y: 0, opacity: 1, ease: "power2.out" }, 0)
      .fromTo(q(".rings-glow"), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, ease: "power2.out" }, 0.1)
      .fromTo(q(".rn-left"), { xPercent: -60, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out" }, 0.25)
      .fromTo(q(".rn-right"), { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out" }, 0.25)
      .fromTo(q(".rn-amp"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: "back.out(2)" }, 0.4)
      .fromTo(q(".date-part"), { y: 50, opacity: 0, rotateX: -80 }, { y: 0, opacity: 1, rotateX: 0, stagger: 0.12, ease: "back.out(1.6)" }, 0.45);

    gsap.to(q(".rings-img"), { y: -10, rotate: 2, duration: 3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1 });
    gsap.to(q(".rings-rays"), { rotate: 360, duration: 40, repeat: -1, ease: "none" });
    q(".glint").forEach((g, i) =>
      gsap.fromTo(g, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, yoyo: true, repeat: -1, repeatDelay: 1.6 + i * 0.4, delay: i * 0.55, ease: "sine.inOut" }));
  }, { scope: ref });

  return (
    <section className="section rings" ref={ref} aria-labelledby="rings-h">
      <h2 id="rings-h" className="eyebrow">The engagement ceremony</h2>
      <div className="rings-stage">
        <span className="rn rn-left script-xl">{EVENT.groom}</span>
        <div className="rings-visual">
          <div className="rings-glow" aria-hidden="true"><div className="rings-rays" /></div>
          <img className="rings-img" src={asset("img/rings.webp")} alt="Two gold engagement rings, one set with a diamond" width={535} height={425} />
          {[[18, 30], [72, 22], [64, 64], [30, 70], [84, 48]].map(([x, y], i) => (
            <svg key={i} className="glint" style={{ left: `${x}%`, top: `${y}%` }} viewBox="-10 -10 20 20" aria-hidden="true">
              <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" />
            </svg>
          ))}
        </div>
        <span className="rn-amp amp" aria-hidden="true">&amp;</span>
        <span className="rn rn-right script-xl">{EVENT.bride}</span>
      </div>
      <p className="date-row" aria-label={EVENT.dateLong}>
        {EVENT.dateParts.map((p, i) => (
          <span key={p} className={`date-part${i === 1 ? " date-day" : ""}`}>{p}</span>
        ))}
      </p>
    </section>
  );
}
