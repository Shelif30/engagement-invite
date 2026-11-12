import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth";
import { EVENT, VERSES } from "../lib/config";
import { Sprig } from "./Ornaments";

export default function Closing() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    const q = gsap.utils.selector(ref);
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 72%" } });
    tl.from(q(".closing-verse"), { y: 40, opacity: 0, filter: "blur(8px)", duration: 1.3, ease: "power3.out" })
      .from(q(".closing-ref"), { opacity: 0, letterSpacing: "0.6em", duration: 1.1, ease: "power3.out" }, 0.4)
      .fromTo(q(".sprig path"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.06, ease: "power2.inOut" }, 0.5)
      .from(q(".closing-note"), { y: 24, opacity: 0, duration: 1 }, 0.9)
      .fromTo(q(".sign"), { clipPath: "inset(-30% 100% -30% -8%)" }, { clipPath: "inset(-30% -8% -30% -8%)", duration: 2.2, ease: "power2.inOut" }, 1.2)
      .from(q(".with-love"), { opacity: 0, y: 10, duration: 0.8 }, 1.1);
  }, { scope: ref });

  return (
    <footer className="section closing" ref={ref}>
      <blockquote className="closing-verse">&ldquo;{VERSES.closing.text}&rdquo;</blockquote>
      <p className="closing-ref caps">{VERSES.closing.ref}</p>
      <Sprig />
      <p className="closing-note">
        Together with our families, we warmly invite you to bless us with your presence and prayers as we begin this new chapter.
      </p>
      <p className="with-love caps">With love</p>
      <p className="sign script-xl">{EVENT.groom} <span className="amp">&amp;</span> {EVENT.bride}</p>
    </footer>
  );
}
