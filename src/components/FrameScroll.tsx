import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, getLenis } from "../lib/smooth";
import { EVENT, FRAME_COUNT } from "../lib/config";
import { frames, nearestFrame, onFrameProgress } from "../lib/frames";

/** Seconds the film takes when it plays by itself. */
const AUTOPLAY_SECONDS = 6;
/** After the guest stops scrolling, wait this long before the film carries on by itself. */
const RESUME_AFTER_MS = 2500;

type Mode = "playing" | "paused" | "waiting" | "done";

/**
 * Scroll-scrubbed film: the ZIP frames are drawn to a canvas as the reader scrolls,
 * with story lines fading in over the top. Once the invitation is opened the film
 * plays by itself (it scrolls the page), and any wheel, touch, key or scrollbar use
 * takes over instantly; it carries on from wherever the guest leaves it.
 */
export default function FrameScroll({ active }: { active: boolean }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ frame: 0, drawn: -1 });
  const [mode, setMode] = useState<Mode>("playing");
  const userPaused = useRef(false);

  const draw = (force = false) => {
    const c = canvas.current;
    if (!c) return;
    const i = Math.round(state.current.frame);
    if (!force && i === state.current.drawn && frames[i]) return;
    const img = nearestFrame(i);
    if (!img) return;
    const ctx = c.getContext("2d")!;
    const cw = c.width,
      ch = c.height;
    // cover-fit; on tall phone screens keep the couple (slightly right of centre) in view
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s,
      h = img.naturalHeight * s;
    const focusX = cw / ch < 1 ? 0.56 : 0.5;
    const x = (cw - w) * focusX,
      y = (ch - h) * 0.5;
    ctx.drawImage(img, x, y, w, h);
    state.current.drawn = frames[i] ? i : -1;
  };

  useEffect(() => {
    const c = canvas.current!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw(true);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    // redraw as frames arrive, so the nearest-frame stand-in gets replaced
    const off = onFrameProgress(() => draw());
    return () => {
      ro.disconnect();
      off();
    };
  }, []);

  // ---- autoplay ----
  useEffect(() => {
    if (!active) return;
    const sec = section.current!;
    const getY = () => getLenis()?.scroll ?? window.scrollY;
    const setY = (y: number) => {
      const l = getLenis();
      if (l) l.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };
    const endY = () => sec.offsetTop + sec.offsetHeight - window.innerHeight;
    let lastInput = -Infinity;
    let expected = getY();
    let done = false;
    let shown: Mode = "playing";
    const show = (m: Mode) => {
      if (m !== shown) {
        shown = m;
        setMode(m);
      }
    };

    const onInput = () => {
      lastInput = performance.now();
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(e.key)
      )
        onInput();
    };
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchstart", onInput, { passive: true });
    window.addEventListener("touchmove", onInput, { passive: true });
    window.addEventListener("keydown", onKey);

    const startAt = performance.now() + 1700; // let the cover finish parting first
    const tick = (_time: number, deltaMs: number) => {
      if (done) return;
      const now = performance.now();
      const y = getY();
      // scrollbar drags or any other scroll we didn't make count as the guest taking over
      if (Math.abs(y - expected) > 3) {
        lastInput = now;
        expected = y;
      }
      if (y >= endY() - 2) {
        done = true;
        show("done");
        return;
      }
      if (now < startAt) return;
      if (userPaused.current) {
        show("paused");
        expected = y;
        return;
      }
      if (now - lastInput < RESUME_AFTER_MS) {
        show("waiting");
        expected = y;
        return;
      }
      show("playing");
      const speed = (sec.offsetHeight - window.innerHeight) / AUTOPLAY_SECONDS;
      const next = Math.min(endY(), y + (speed * Math.min(deltaMs, 50)) / 1000);
      expected = next;
      setY(next);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchstart", onInput);
      window.removeEventListener("touchmove", onInput);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const scrollOn = () => {
    const next = section.current?.nextElementSibling as HTMLElement | null;
    if (!next) return;
    const l = getLenis();
    if (l) l.scrollTo(next, { duration: 1.6, offset: -40 });
    else next.scrollIntoView({ behavior: "smooth" });
  };

  const toggle = () => {
    userPaused.current = !userPaused.current;
    setMode(userPaused.current ? "paused" : "playing");
  };

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });
      tl.to(
        state.current,
        { frame: FRAME_COUNT - 1, duration: 10, onUpdate: () => draw() },
        0,
      );

      // story beats (positions are on the same 0–10 scale as the frames)
      const beat = (sel: string, at: number, len: number) => {
        tl.fromTo(
          q(sel),
          { opacity: 0, y: 40, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power2.out",
          },
          at,
        ).to(
          q(sel),
          {
            opacity: 0,
            y: -30,
            filter: "blur(8px)",
            duration: 0.7,
            ease: "power2.in",
          },
          at + len,
        );
      };
      beat(".beat-1", 0.3, 1.6);
      beat(".beat-2", 2.9, 1.7);
      beat(".beat-3", 5.4, 1.6);
      tl.fromTo(
        q(".beat-4"),
        { opacity: 0, scale: 0.9, filter: "blur(12px)" },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.0,
          ease: "power2.out",
        },
        7.8,
      );
      tl.fromTo(
        q(".beat-4 .b4-sub"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        8.6,
      );
      tl.fromTo(
        q(".scroll-hint"),
        { opacity: 1 },
        { opacity: 0, duration: 0.4 },
        0,
      );
      tl.fromTo(
        q(".film-shade"),
        { opacity: 0.55 },
        { opacity: 0.85, duration: 2 },
        7.6,
      );
      tl.to(q(".film-progress i"), { scaleX: 1, duration: 10 }, 0);

      ScrollTrigger.refresh();
    },
    { scope: section },
  );

  return (
    <section className="film" ref={section} aria-label="Our story">
      <div className={`film-sticky${mode === "done" ? " is-done" : ""}`}>
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" />
        <div className="film-shade" />
        <div className="film-copy">
          <p className="beat beat-1">
            <span className="script-lg">In a garden of grace</span>
            <span className="caps">our story began</span>
          </p>
          <p className="beat beat-2">
            <span className="script-lg">Two hearts, one path</span>
            <span className="caps">hand in hand, by His design</span>
          </p>
          <p className="beat beat-3">
            <span className="script-lg">A promise blooms</span>
            <span className="caps">with the blessing of our families</span>
          </p>
          <div className="beat beat-4">
            <h2 className="film-names">
              {EVENT.groom}
              <span className="amp">&amp;</span>
              {EVENT.bride}
            </h2>
            <p className="b4-sub caps">
              are getting engaged &middot; {EVENT.dateParts[1]}{" "}
              {EVENT.dateParts[2]} {EVENT.dateParts[3]}
            </p>
          </div>
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <span>
            {mode === "playing" ? "Playing \u00b7 scroll any time" : "Scroll"}
          </span>
          <i />
        </div>
        {mode === "done" && (
          <button
            className="scroll-more"
            onClick={scrollOn}
            aria-label="Scroll down to the invitation"
          >
            <span className="sm-mouse" aria-hidden="true">
              <i />
            </span>
            <span className="sm-label">Scroll down</span>
            <span className="sm-chevrons" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 8l7 7 7-7" />
              </svg>
              <svg viewBox="0 0 24 24">
                <path d="M5 8l7 7 7-7" />
              </svg>
            </span>
          </button>
        )}
        {mode !== "done" && (
          <button
            className="film-play"
            onClick={toggle}
            aria-label={mode === "paused" ? "Play the film" : "Pause the film"}
          >
            {mode === "paused" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
              </svg>
            )}
            <span>
              {mode === "paused"
                ? "Play"
                : mode === "waiting"
                  ? "Resuming\u2026"
                  : "Pause"}
            </span>
          </button>
        )}
        <div className="film-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
