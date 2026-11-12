import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { VERSES } from "../lib/config";
import { Sprig } from "./Ornaments";

/** Bible verse that "writes itself" word by word as you scroll. */
export default function Verse() {
  const ref = useRef<HTMLElement>(null);
  const words = VERSES.main.text.split(" ");

  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    gsap.fromTo(q(".vw"), { opacity: 0.16, y: 6, filter: "blur(3px)" }, {
      opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.12, ease: "none",
      scrollTrigger: { trigger: q(".verse-text")[0], start: "top 78%", end: "bottom 42%", scrub: 0.6 },
    });
    gsap.from(q(".verse-card"), {
      y: 80, opacity: 0, rotateX: 12, transformPerspective: 900, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
    gsap.fromTo(q(".sprig path"), { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", stagger: 0.08,
      scrollTrigger: { trigger: ref.current, start: "top 70%" },
    });
    gsap.from(q(".verse-ref"), {
      letterSpacing: "0.6em", opacity: 0, duration: 1.4, ease: "power3.out",
      scrollTrigger: { trigger: q(".verse-ref")[0], start: "top 90%" },
    });
  }, { scope: ref });

  return (
    <section className="section verse" ref={ref} aria-labelledby="verse-h">
      <div className="verse-card glass">
        <h2 id="verse-h" className="eyebrow">A word from Scripture</h2>
        <Sprig />
        <blockquote className="verse-text">
          {words.map((w, i) => <span className="vw" key={i}>{w} </span>)}
        </blockquote>
        <p className="verse-ref caps">{VERSES.main.ref}</p>
        <Sprig flip />
      </div>
    </section>
  );
}
