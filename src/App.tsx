import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, startSmoothScroll } from "./lib/smooth";
import { asset } from "./lib/config";
import Splash from "./components/Splash";
import FrameScroll from "./components/FrameScroll";
import Verse from "./components/Verse";
import Rings from "./components/Rings";
import Countdown from "./components/Countdown";
import Venue from "./components/Venue";
import Closing from "./components/Closing";
import FallingNature from "./components/FallingNature";

export default function App() {
  const [splash, setSplash] = useState(true);
  const [opened, setOpened] = useState(false);
  const bg = useRef<HTMLDivElement>(null);

  // Lock scrolling while the cover is up.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("locked", !opened);
    if (opened) {
      window.scrollTo(0, 0);
      startSmoothScroll();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [opened]);

  // The garden photo is the backdrop for the whole site; it drifts gently as you scroll.
  useGSAP(() => {
    gsap.fromTo(
      bg.current,
      { yPercent: 0, scale: 1.12 },
      {
        yPercent: -6,
        scale: 1.02,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: true },
      },
    );
  });

  return (
    <>
      <div
        className="site-bg"
        ref={bg}
        style={{ backgroundImage: `url(${asset("img/garden.webp")})` }}
        aria-hidden="true"
      />
      <div className="site-veil" aria-hidden="true" />
      {opened && (
        <FallingNature
          className="nature-canvas site-canvas"
          leaves={10}
          petals={10}
          fireflies={14}
        />
      )}

      <main className={opened ? "is-open" : undefined} aria-hidden={!opened}>
        <FrameScroll active={opened} />
        <Verse />
        <Rings />
        <Countdown />
        <Venue />
        <Closing />
      </main>

      {splash && (
        <Splash
          onOpen={() => setOpened(true)}
          onGone={() => setSplash(false)}
        />
      )}
    </>
  );
}
